from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from datetime import datetime
from database import get_database
from models import UserResponse, UserRole, UserStatus
from .security import verify_token, verify_password

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_database)
):
    """Get current authenticated user."""
    token = credentials.credentials
    token_data = verify_token(token)
    
    if token_data["token_type"] != "access":
        raise HTTPException(
            status_code=401,
            detail="Invalid token type"
        )
    
    user = await db.users.find_one({"_id": ObjectId(token_data["user_id"])})
    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )
    
    return UserResponse(
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

def require_role(required_roles: list):
    """Decorator to require specific roles."""
    def role_checker(current_user: UserResponse = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

async def authenticate_user(email: str, password: str, db):
    """Authenticate user with email and password."""
    user = await db.users.find_one({"email": email})
    if not user:
        return None
    
    if user.get("status") != UserStatus.ACTIVE:
        return None
    
    if not user.get("hashed_password"):
        return None
    
    if not verify_password(password, user["hashed_password"]):
        # Increment failed login attempts
        await db.users.update_one(
            {"email": email},
            {"$inc": {"failed_login_attempts": 1}}
        )
        return None
    
    # Update last login and reset failed attempts
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "last_login": datetime.utcnow(),
                "failed_login_attempts": 0
            }
        }
    )
    
    return user
