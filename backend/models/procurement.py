from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from bson import ObjectId
from .enums import ProcurementStatus, ProcurementPriority

class ProcurementRequestCreate(BaseModel):
    asset_name: str
    asset_type: str
    category: str = "Hardware"
    quantity: int = 1
    estimated_cost: Optional[float] = None
    priority: ProcurementPriority = ProcurementPriority.MEDIUM
    justification: str
    specifications: Optional[str] = None
    department: Optional[str] = None
    required_by_date: Optional[str] = None
    vendor_preference: Optional[str] = None

class ProcurementRequestUpdate(BaseModel):
    asset_name: Optional[str] = None
    asset_type: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    estimated_cost: Optional[float] = None
    priority: Optional[ProcurementPriority] = None
    justification: Optional[str] = None
    specifications: Optional[str] = None
    required_by_date: Optional[str] = None
    vendor_preference: Optional[str] = None
    status: Optional[ProcurementStatus] = None

class ProcurementApprovalAction(BaseModel):
    comments: Optional[str] = None

class ProcurementRequestResponse(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda v: v.isoformat()}
    )
    
    id: str
    requestor_id: str
    requestor_name: str
    requestor_email: str
    asset_name: str
    asset_type: str
    category: str
    quantity: int
    estimated_cost: Optional[float]
    priority: ProcurementPriority
    status: ProcurementStatus
    justification: str
    specifications: Optional[str]
    department: Optional[str]
    required_by_date: Optional[str]
    vendor_preference: Optional[str]
    requested_date: datetime
    approver_id: Optional[str] = None
    approver_name: Optional[str] = None
    approval_date: Optional[datetime] = None
    approval_comments: Optional[str] = None
    rejection_comments: Optional[str] = None
    fulfilled_asset_id: Optional[str] = None
    order_date: Optional[datetime] = None
    fulfillment_date: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
