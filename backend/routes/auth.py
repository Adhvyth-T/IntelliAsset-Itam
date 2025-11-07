from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from datetime import datetime
from bson import ObjectId

from database import get_database
from models import (
    UserRegister, UserLogin, LoginResponse, UserResponse,
    Token, UserUpdate, UserStatus, UserRole
)
from auth import (
    get_password_hash, create_access_token, create_refresh_token,
    authenticate_user, get_current_user, verify_token, security
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=LoginResponse)
async def register(user_data: UserRegister, db=Depends(get_database)):
    """Register a new user."""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="User with this email already exists"
        )
    
    # Hash password and create user document
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.dict()
    user_dict.pop("password")
    user_dict["hashed_password"] = hashed_password
    user_dict["createdAt"] = datetime.utcnow()
    user_dict["updatedAt"] = datetime.utcnow()
    user_dict["assetsCount"] = 0
    user_dict["status"] = UserStatus.ACTIVE
    user_dict["failed_login_attempts"] = 0
    user_dict["is_verified"] = True
    user_dict["permissions"] = []
    
    result = await db.users.insert_one(user_dict)
    new_user = await db.users.find_one({"_id": result.inserted_id})
    
    # Create tokens
    token_data = {
        "sub": new_user["email"],
        "user_id": str(new_user["_id"]),
        "role": new_user["role"]
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    user_response = UserResponse(
        id=str(new_user["_id"]),
        name=new_user["name"],
        email=new_user["email"],
        department=new_user.get("department"),
        role=new_user["role"],
        permissions=new_user.get("permissions", []),
        status=new_user["status"],
        createdAt=new_user["createdAt"],
        updatedAt=new_user["updatedAt"],
        last_login=new_user.get("last_login")
    )
    
    return LoginResponse(user=user_response, token=access_token, refresh_token=refresh_token)

@router.post("/login", response_model=LoginResponse)
async def login(login_data: UserLogin, db=Depends(get_database)):
    """Authenticate user and return tokens."""
    user = await authenticate_user(login_data.email, login_data.password, db)
    
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    
    # Create tokens
    token_data = {
        "sub": user["email"],
        "user_id": str(user["_id"]),
        "role": user["role"]
    }
    
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    user_response = UserResponse(
        id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        department=user.get("department"),
        role=user["role"],
        permissions=user.get("permissions", []),
        status=user["status"],
        createdAt=user["createdAt"],
        updatedAt=user["updatedAt"],
        last_login=user.get("last_login")
    )
    print(LoginResponse(user=user_response, token=access_token, refresh_token=refresh_token))
    return LoginResponse(user=user_response, token=access_token, refresh_token=refresh_token)

@router.get("/verify", response_model=UserResponse)
async def verify_token_endpoint(current_user: UserResponse = Depends(get_current_user)):
    """Verify token and return user data."""
    return current_user

@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user (client should remove token)."""
    return {"message": "Successfully logged out"}

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update user profile."""
    update_data = {k: v for k, v in profile_data.dict().items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    
    if len(update_data) >= 1:
        await db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"_id": ObjectId(current_user.id)})
    
    return UserResponse(
        id=str(updated_user["_id"]),
        name=updated_user["name"],
        email=updated_user["email"],
        department=updated_user.get("department"),
        role=updated_user["role"],
        permissions=updated_user.get("permissions", []),
        status=updated_user["status"],
        createdAt=updated_user["createdAt"],
        updatedAt=updated_user["updatedAt"],
        last_login=updated_user.get("last_login")
    )

@router.post("/refresh", response_model=Token)
async def refresh_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Refresh access token using refresh token."""
    token = credentials.credentials
    token_data = verify_token(token)
    
    if token_data["token_type"] != "refresh":
        raise HTTPException(
            status_code=401,
            detail="Invalid token type"
        )
    
    # Create new tokens
    new_token_data = {
        "sub": token_data["email"],
        "user_id": token_data["user_id"],
        "role": token_data["role"]
    }
    
    access_token = create_access_token(new_token_data)
    refresh_token = create_refresh_token(new_token_data)
    
    return Token(access_token=access_token, refresh_token=refresh_token)
