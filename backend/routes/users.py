from fastapi import APIRouter, HTTPException, Depends
from typing import List
from datetime import datetime
from bson import ObjectId

from database import get_database
from models import UserCreate, UserUpdate, UserResponse, UserRole
from auth import get_current_user, require_role
from utils import user_helper

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("", response_model=List[dict])
async def get_users(
    skip: int = 0, 
    limit: int = 100, 
    db=Depends(get_database),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Get all users - requires admin or manager role"""
    users = await db.users.find().skip(skip).limit(limit).to_list(length=None)
    return [user_helper(user) for user in users]

@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: str, 
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific user by ID"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user:
        return user_helper(user)
    raise HTTPException(status_code=404, detail="User not found")

@router.post("", response_model=dict)
async def create_user(
    user: UserCreate, 
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new user"""
    user_dict = user.dict()
    user_dict["createdAt"] = datetime.utcnow()
    user_dict["updatedAt"] = datetime.utcnow()
    user_dict["assetsCount"] = 0
    
    # Check if email already exists
    existing = await db.users.find_one({"email": user_dict["email"]})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    result = await db.users.insert_one(user_dict)
    new_user = await db.users.find_one({"_id": result.inserted_id})
    return user_helper(new_user)

@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: str, 
    user: UserUpdate, 
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Update an existing user"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    update_data = {k: v for k, v in user.dict().items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    
    if len(update_data) >= 1:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)}, {"$set": update_data}
        )
        if result.modified_count == 1:
            updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
            return user_helper(updated_user)
    
    existing_user = await db.users.find_one({"_id": ObjectId(user_id)})
    if existing_user:
        return user_helper(existing_user)
    
    raise HTTPException(status_code=404, detail="User not found")

@router.delete("/{user_id}")
async def delete_user(
    user_id: str, 
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a user"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 1:
        return {"message": "User deleted successfully"}
    raise HTTPException(status_code=404, detail="User not found")
