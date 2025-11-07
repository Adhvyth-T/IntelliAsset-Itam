from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from .base import PyObjectId
from .enums import UserRole, UserStatus

class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    department: Optional[str] = None
    role: UserRole = UserRole.EMPLOYEE

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    department: Optional[str] = None
    role: UserRole
    permissions: List[str] = []
    status: UserStatus
    createdAt: datetime
    updatedAt: datetime
    last_login: Optional[datetime] = None

class LoginResponse(BaseModel):
    user: UserResponse
    token: str
    refresh_token: str

class UserModel(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )
    
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str
    email: str
    department: Optional[str] = None
    role: UserRole = UserRole.EMPLOYEE
    permissions: List[str] = []
    assetsCount: int = 0
    hashed_password: Optional[str] = None
    status: UserStatus = UserStatus.ACTIVE
    last_login: Optional[datetime] = None
    failed_login_attempts: int = 0
    is_verified: bool = True
    createdAt: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updatedAt: Optional[datetime] = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: str
    department: Optional[str] = None
    role: Optional[str] = None
    permissions: List[str] = []

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[List[str]] = None
