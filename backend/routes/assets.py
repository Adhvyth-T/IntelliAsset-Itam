from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from database import get_database
from models import AssetCreate, AssetUpdate, UserResponse, UserRole, UserStatus
from auth import get_current_user, verify_token
from utils import (
    asset_helper, update_user_asset_count,
    check_and_update_expired_assets, check_and_update_compliance_status,
    create_audit_record
)

router = APIRouter(prefix="/api/assets", tags=["Assets"])

@router.get("", response_model=List[dict])
async def get_assets(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    category: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all assets with filters"""
    await check_and_update_expired_assets(db)
    await check_and_update_compliance_status(db)
    
    query = {}
    
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if department:
        query["department"] = department
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"assignedTo": {"$regex": search, "$options": "i"}},
            {"serialNumber": {"$regex": search, "$options": "i"}}
        ]
    
    assets = await db.assets.find(query).skip(skip).limit(limit).to_list(length=limit)
    return [asset_helper(asset) for asset in assets]

@router.post("", response_model=dict)
async def create_asset(
    asset: AssetCreate, 
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new asset"""
    asset_dict = asset.dict()
    asset_dict["createdAt"] = datetime.utcnow()
    asset_dict["updatedAt"] = datetime.utcnow()
    
    # Check if serial number already exists
    if asset_dict.get("serialNumber"):
        existing = await db.assets.find_one({"serialNumber": asset_dict["serialNumber"]})
        if existing:
            raise HTTPException(status_code=400, detail="Asset with this serial number already exists")
    
    result = await db.assets.insert_one(asset_dict)
    new_asset = await db.assets.find_one({"_id": result.inserted_id})
   
    # Update user assets count if assigned
    if asset_dict.get("assignedTo"):
        await update_user_asset_count(asset_dict["assignedTo"], db)
    
    return asset_helper(new_asset)

@router.put("/{asset_id}", response_model=dict)
async def update_asset(
    asset_id: str, 
    asset: AssetUpdate, 
    db=Depends(get_database),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
):
    """Update an existing asset with cryptographic audit trail"""
    if not ObjectId.is_valid(asset_id):
        raise HTTPException(status_code=400, detail="Invalid asset ID")
    
    # Get existing asset for comparison
    existing_asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
    if not existing_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Try to get current user, fallback to system user
    current_user = None
    if credentials:
        try:
            token = credentials.credentials
            token_data = verify_token(token)
            user = await db.users.find_one({"_id": ObjectId(token_data["user_id"])})
            if user:
                current_user = UserResponse(
                    id=str(user["_id"]),
                    name=user["name"],
                    email=user["email"],
                    department=user.get("department"),
                    role=user.get("role", UserRole.EMPLOYEE),
                    permissions=user.get("permissions", []),
                    status=user.get("status", UserStatus.ACTIVE),
                    createdAt=user.get("createdAt"),
                    updatedAt=user.get("updatedAt"),
                    last_login=user.get("last_login")
                )
        except:
            pass
    
    # If no authenticated user, create a system user for audit trail
    if not current_user:
        current_user = UserResponse(
            id="system",
            name="System",
            email="system@itam.local",
            department="System",
            role=UserRole.ADMIN,
            permissions=[],
            status=UserStatus.ACTIVE,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
    
    update_data = {k: v for k, v in asset.dict().items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    
    if len(update_data) >= 1:
        # Track changes to assignedTo field for audit chain
        if "assignedTo" in update_data and update_data["assignedTo"] != existing_asset.get("assignedTo"):
            # Create audit record BEFORE updating
            await create_audit_record(
                db=db,
                asset_id=asset_id,
                field_changed="assignedTo",
                old_value=existing_asset.get("assignedTo"),
                new_value=update_data["assignedTo"],
                changed_by=current_user,
                metadata={
                    "asset_name": existing_asset.get("name"),
                    "asset_type": existing_asset.get("type"),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        # Perform the update
        result = await db.assets.update_one(
            {"_id": ObjectId(asset_id)}, {"$set": update_data}
        )
        if result.modified_count == 1:
            updated_asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
            return asset_helper(updated_asset)
    
    return asset_helper(existing_asset)

@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: str, 
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete an asset"""
    if not ObjectId.is_valid(asset_id):
        raise HTTPException(status_code=400, detail="Invalid asset ID")
    
    # Get asset before deletion to update user count
    asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    result = await db.assets.delete_one({"_id": ObjectId(asset_id)})
    if result.deleted_count == 1:
        # Update user assets count if was assigned
        if asset.get("assignedTo"):
            await update_user_asset_count(asset["assignedTo"], db)
        return {"message": "Asset deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Asset not found")
