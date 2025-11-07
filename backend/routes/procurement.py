from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

from database import get_database
from models import (
    ProcurementRequestCreate, ProcurementRequestUpdate,
    ProcurementApprovalAction, UserResponse, UserRole,
    ProcurementStatus, AssetCreate
)
from auth import get_current_user, require_role
from utils import procurement_request_helper, asset_helper

router = APIRouter(prefix="/api/procurement", tags=["Procurement"])

@router.get("/requests", response_model=List[dict])
async def get_procurement_requests(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    department: Optional[str] = None,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get all procurement requests with filters"""
    query = {}
    
    # Employees can only see their own requests
    if current_user.role == UserRole.EMPLOYEE:
        query["requestor_id"] = current_user.id
    
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority
    if department:
        query["department"] = department
    
    requests = await db.procurement_requests.find(query).sort(
        "requested_date", -1
    ).skip(skip).limit(limit).to_list(length=limit)
    
    return [procurement_request_helper(req) for req in requests]

@router.get("/requests/my-requests", response_model=List[dict])
async def get_my_requests(
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get current user's procurement requests"""
    requests = await db.procurement_requests.find({
        "requestor_id": current_user.id
    }).sort("requested_date", -1).skip(skip).limit(limit).to_list(length=limit)
    
    return [procurement_request_helper(req) for req in requests]

@router.get("/requests/pending-approval", response_model=List[dict])
async def get_pending_approval_requests(
    skip: int = 0,
    limit: int = 100,
    db=Depends(get_database),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Get requests pending approval - Admin/Manager only"""
    requests = await db.procurement_requests.find({
        "status": ProcurementStatus.PENDING
    }).sort("priority", -1).sort("requested_date", 1).skip(skip).limit(limit).to_list(length=limit)
    
    return [procurement_request_helper(req) for req in requests]

@router.get("/requests/{request_id}", response_model=dict)
async def get_procurement_request(
    request_id: str,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a specific procurement request"""
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")
    
    request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Employees can only view their own requests
    if current_user.role == UserRole.EMPLOYEE and request["requestor_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return procurement_request_helper(request)

@router.post("/requests", response_model=dict)
async def create_procurement_request(
    request_data: ProcurementRequestCreate,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Create a new procurement request"""
    request_dict = request_data.dict()
    request_dict.update({
        "requestor_id": current_user.id,
        "requestor_name": current_user.name,
        "requestor_email": current_user.email,
        "status": ProcurementStatus.PENDING,
        "requested_date": datetime.utcnow(),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    result = await db.procurement_requests.insert_one(request_dict)
    new_request = await db.procurement_requests.find_one({"_id": result.inserted_id})
    
    return procurement_request_helper(new_request)

@router.put("/requests/{request_id}", response_model=dict)
async def update_procurement_request(
    request_id: str,
    request_data: ProcurementRequestUpdate,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Update a procurement request"""
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")
    
    request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Only requestor can update their own pending requests
    if request["requestor_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if request["status"] != ProcurementStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cannot update non-pending requests")
    
    update_data = {k: v for k, v in request_data.dict().items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    
    if len(update_data) >= 1:
        await db.procurement_requests.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": update_data}
        )
    
    updated_request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    return procurement_request_helper(updated_request)

@router.post("/requests/{request_id}/approve", response_model=dict)
async def approve_procurement_request(
    request_id: str,
    approval: ProcurementApprovalAction,
    db=Depends(get_database),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Approve a procurement request - Admin/Manager only"""
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")
    
    request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request["status"] != ProcurementStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be approved")
    
    update_data = {
        "status": ProcurementStatus.APPROVED,
        "approver_id": current_user.id,
        "approver_name": current_user.name,
        "approval_date": datetime.utcnow(),
        "approval_comments": approval.comments,
        "updatedAt": datetime.utcnow()
    }
    
    await db.procurement_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": update_data}
    )
    
    updated_request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    return procurement_request_helper(updated_request)

@router.post("/requests/{request_id}/reject", response_model=dict)
async def reject_procurement_request(
    request_id: str,
    rejection: ProcurementApprovalAction,
    db=Depends(get_database),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Reject a procurement request - Admin/Manager only"""
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")
    
    request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request["status"] != ProcurementStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be rejected")
    
    update_data = {
        "status": ProcurementStatus.REJECTED,
        "approver_id": current_user.id,
        "approver_name": current_user.name,
        "approval_date": datetime.utcnow(),
        "rejection_comments": rejection.comments,
        "updatedAt": datetime.utcnow()
    }
    
    await db.procurement_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": update_data}
    )
    
    updated_request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    return procurement_request_helper(updated_request)

@router.post("/requests/{request_id}/mark-ordered", response_model=dict)
async def mark_request_ordered(
    request_id: str,
    db=Depends(get_database),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Mark an approved request as ordered - Admin/Manager only"""
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")
    
    request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request["status"] != ProcurementStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Only approved requests can be marked as ordered")
    
    await db.procurement_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": ProcurementStatus.ORDERED,
            "order_date": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }}
    )
    
    updated_request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    return procurement_request_helper(updated_request)

@router.post("/requests/{request_id}/fulfill", response_model=dict)
async def fulfill_procurement_request(
    request_id: str,
    asset_data: AssetCreate,
    db=Depends(get_database),
    current_user: UserResponse = Depends(require_role([UserRole.ADMIN, UserRole.IT_SUPPORT]))
):
    """Fulfill a procurement request by creating the asset - Admin/IT Support only"""
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")
    
    request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if request["status"] not in [ProcurementStatus.APPROVED, ProcurementStatus.ORDERED]:
        raise HTTPException(
            status_code=400, 
            detail="Only approved or ordered requests can be fulfilled"
        )
    
    # Create the asset
    asset_dict = asset_data.dict()
    asset_dict["createdAt"] = datetime.utcnow()
    asset_dict["updatedAt"] = datetime.utcnow()
    asset_dict["notes"] = f"Created from procurement request #{request_id}"
    
    result = await db.assets.insert_one(asset_dict)
    new_asset = await db.assets.find_one({"_id": result.inserted_id})
    
    # Update procurement request
    await db.procurement_requests.update_one(
        {"_id": ObjectId(request_id)},
        {"$set": {
            "status": ProcurementStatus.FULFILLED,
            "fulfilled_asset_id": str(result.inserted_id),
            "fulfillment_date": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }}
    )
    
    updated_request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    
    return {
        "request": procurement_request_helper(updated_request),
        "asset": asset_helper(new_asset)
    }

@router.delete("/requests/{request_id}")
async def delete_procurement_request(
    request_id: str,
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Delete a procurement request"""
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid request ID")
    
    request = await db.procurement_requests.find_one({"_id": ObjectId(request_id)})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Only requestor or admin can delete
    if current_user.role not in [UserRole.ADMIN] and request["requestor_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Only pending requests can be deleted
    if request["status"] != ProcurementStatus.PENDING:
        raise HTTPException(status_code=400, detail="Only pending requests can be deleted")
    
    await db.procurement_requests.delete_one({"_id": ObjectId(request_id)})
    return {"message": "Request deleted successfully"}

@router.get("/statistics")
async def get_procurement_statistics(
    db=Depends(get_database),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get procurement request statistics"""
    # Base query - employees only see their own stats
    base_query = {}
    if current_user.role == UserRole.EMPLOYEE:
        base_query["requestor_id"] = current_user.id
    
    # Group by status
    pipeline_status = [
        {"$match": base_query},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    by_status = await db.procurement_requests.aggregate(pipeline_status).to_list(length=None)
    
    # Group by priority
    pipeline_priority = [
        {"$match": base_query},
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    by_priority = await db.procurement_requests.aggregate(pipeline_priority).to_list(length=None)
    
    # Total estimated cost
    pipeline_cost = [
        {"$match": {**base_query, "estimated_cost": {"$ne": None}}},
        {"$group": {"_id": None, "total": {"$sum": "$estimated_cost"}}}
    ]
    cost_result = await db.procurement_requests.aggregate(pipeline_cost).to_list(length=1)
    total_cost = cost_result[0]["total"] if cost_result else 0
    
    # Total requests
    total_requests = await db.procurement_requests.count_documents(base_query)
    
    return {
        "total_requests": total_requests,
        "by_status": by_status,
        "by_priority": by_priority,
        "total_estimated_cost": total_cost
    }
