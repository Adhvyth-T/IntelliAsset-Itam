import os

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL", "your_mongodb_connection_string_here")
DATABASE_NAME = os.getenv("DATABASE_NAME", "itam")

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# CORS Configuration
CORS_ORIGINS = ["*"]
