from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AgentStatus(BaseModel):
    serial_number: str
    is_online: bool
    last_seen: Optional[datetime] = None
    agent_url: Optional[str] = None

class LiveMetrics(BaseModel):
    hostname: str
    platform: str
    cpu_model: str
    device_type: str
    cpu_usage: Optional[float] = None
    memory_usage: Optional[float] = None
    disk_usage: Optional[float] = None
    ip_address: Optional[str] = None
    uptime: Optional[float] = None
    serial_number: Optional[str] = None
    timestamp: datetime

class AgentMetricsResponse(BaseModel):
    asset_id: str
    serial_number: str
    is_online: bool
    metrics: Optional[LiveMetrics] = None
    last_updated: Optional[datetime] = None
    error: Optional[str] = None
