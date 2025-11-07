from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from .base import PyObjectId

class AssetModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    type: str
    category: str = "Hardware"
    status: str = "Active"
    assignedTo: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    purchaseDate: Optional[str] = None
    cost: Optional[float] = 0
    serialNumber: Optional[str] = None
    vendor: Optional[str] = None
    warranty: Optional[str] = None
    lifecycle: str = "Procurement"
    tags: List[str] = []
    complianceStatus: str = "Compliant"
    maintenanceSchedule: Optional[str] = None
    lastAudit: Optional[str] = None
    notes: Optional[str] = None
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

class AssetCreate(BaseModel):
    name: str
    type: str
    category: str = "Hardware"
    status: str = "Active"
    assignedTo: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    purchaseDate: Optional[str] = None
    cost: Optional[float] = 0
    serialNumber: Optional[str] = None
    vendor: Optional[str] = None
    warranty: Optional[str] = None
    lifecycle: str = "Procurement"
    tags: List[str] = []
    complianceStatus: str = "Compliant"
    maintenanceSchedule: Optional[str] = None
    notes: Optional[str] = None

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    assignedTo: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    cost: Optional[float] = None
    serialNumber: Optional[str] = None
    vendor: Optional[str] = None
    warranty: Optional[str] = None
    lifecycle: Optional[str] = None
    tags: Optional[List[str]] = None
    complianceStatus: Optional[str] = None
    maintenanceSchedule: Optional[str] = None
    notes: Optional[str] = None
