from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from .base import PyObjectId

class AuditChainRecord(BaseModel):
    """Model for cryptographic audit chain record"""
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str, datetime: lambda v: v.isoformat()}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    asset_id: str
    field_changed: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by_user_id: str
    changed_by_email: str
    previous_hash: Optional[str] = None
    current_hash: str
    chain_index: int
    metadata: Optional[Dict[str, Any]] = None
    
class AuditChainVerification(BaseModel):
    """Model for audit chain verification response"""
    is_valid: bool
    total_records: int
    verified_records: int
    broken_at_index: Optional[int] = None
    error_message: Optional[str] = None
    
class AuditChainResponse(BaseModel):
    """Model for audit chain query response"""
    asset_id: str
    asset_name: str
    total_changes: int
    records: List[Dict[str, Any]]
