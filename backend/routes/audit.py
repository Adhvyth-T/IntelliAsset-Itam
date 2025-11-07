from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timedelta
from bson import ObjectId

from database import get_database
from models import AuditChainResponse, AuditChainVerification, UserResponse
from auth import get_current_user
from utils import audit_record_helper, verify_audit_chain

router = APIRouter(prefix="/api/audit", tags=["Audit"])

@router.get("/asset/{asset_id}", response_model=AuditChainResponse)
async def get_asset_audit_chain(
    asset_id: str,
    db=Depends(get_database)
):
    """Get the complete audit chain for an asset"""
    if not ObjectId.is_valid(asset_id):
        raise HTTPException(status_code=400, detail="Invalid asset ID")
    
    # Get asset info
    asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Get all audit records
    records = await db.audit_chain.find(
        {"asset_id": asset_id}
    ).sort("chain_index", 1).to_list(length=None)
    
    # AUTO-VERIFY on every fetch
    verification = await verify_audit_chain(db, asset_id)
    
    # Log security alert if tampered
    if not verification.is_valid:
        print(f" SECURITY ALERT: Audit chain compromised for asset {asset_id}")
        print(f"   Broken at index: {verification.broken_at_index}")
        print(f"   Error: {verification.error_message}")
    
    return AuditChainResponse(
        asset_id=asset_id,
        asset_name=asset.get("name", "Unknown"),
        total_changes=len(records),
        records=[audit_record_helper(r) for r in records]
    )

@router.get("/asset/{asset_id}/verify", response_model=AuditChainVerification)
async def verify_asset_audit_chain(
    asset_id: str,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Verify the cryptographic integrity of an asset's audit chain"""
    if not ObjectId.is_valid(asset_id):
        raise HTTPException(status_code=400, detail="Invalid asset ID")
    
    # Verify the asset exists
    asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Verify the audit chain
    verification = await verify_audit_chain(db, asset_id)
    return verification

@router.get("/user/{user_id}/changes")
async def get_user_audit_changes(
    user_id: str,
    skip: int = 0,
    limit: int = 50,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all changes made by a specific user"""
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Get audit records for this user
    records = await db.audit_chain.find(
        {"changed_by_user_id": user_id}
    ).sort("timestamp", -1).skip(skip).limit(limit).to_list(length=limit)
    
    # Get asset names
    asset_ids = list(set([r["asset_id"] for r in records]))
    assets = {}
    for aid in asset_ids:
        if ObjectId.is_valid(aid):
            asset = await db.assets.find_one({"_id": ObjectId(aid)})
            if asset:
                assets[aid] = asset.get("name", "Unknown")
    
    # Add asset names to records
    enriched_records = []
    for record in records:
        rec_dict = audit_record_helper(record)
        rec_dict["asset_name"] = assets.get(record["asset_id"], "Unknown")
        enriched_records.append(rec_dict)
    
    return {
        "user_id": user_id,
        "total_changes": len(records),
        "changes": enriched_records
    }

@router.get("/recent")
async def get_recent_audit_changes(
    limit: int = 20,
    field: Optional[str] = None,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get recent audit changes across all assets"""
    query = {}
    if field:
        query["field_changed"] = field
    
    records = await db.audit_chain.find(query).sort(
        "timestamp", -1
    ).limit(limit).to_list(length=limit)
    
    # Enrich with asset and user names
    enriched_records = []
    for record in records:
        rec_dict = audit_record_helper(record)
        
        # Get asset name
        if ObjectId.is_valid(record["asset_id"]):
            asset = await db.assets.find_one({"_id": ObjectId(record["asset_id"])})
            rec_dict["asset_name"] = asset.get("name", "Unknown") if asset else "Unknown"
        
        enriched_records.append(rec_dict)
    
    return {
        "total_changes": len(records),
        "changes": enriched_records
    }

@router.get("/statistics")
async def get_audit_statistics(
    db=Depends(get_database)
):
    """Get audit chain statistics"""
    
    # Total audit records
    total_records = await db.audit_chain.count_documents({})
    
    # Records by field
    pipeline_by_field = [
        {"$group": {"_id": "$field_changed", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    by_field = await db.audit_chain.aggregate(pipeline_by_field).to_list(length=None)
    
    # Records by user
    pipeline_by_user = [
        {"$group": {"_id": "$changed_by_email", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    by_user = await db.audit_chain.aggregate(pipeline_by_user).to_list(length=None)
    
    # Recent activity (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_count = await db.audit_chain.count_documents({
        "timestamp": {"$gte": seven_days_ago}
    })
    
    return {
        "total_records": total_records,
        "recent_7_days": recent_count,
        "by_field": by_field,
        "top_users": by_user
    }
