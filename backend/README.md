# ITAM Backend API

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Variables (Optional)
Create a `.env` file in the backend directory with the following variables:
```
MONGODB_URL=your_mongodb_connection_string
DATABASE_NAME=itam
SECRET_KEY=your_secret_key_for_jwt
```

If not provided, default values from `config.py` will be used.

### 3. Run the Application
```bash
python main.py
```

Or using uvicorn directly:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

## Scanner API Setup

Place your `scanner_api_simple.py` file (or whatever your scanner API file is called) in the **same directory as main.py** (the backend root directory).

Directory structure:
```
backend/
├── main.py
├── scanner_api_simple.py  <- Place your scanner API file here
├── config.py
├── database.py
├── requirements.txt
├── models/
├── auth/
├── utils/
└── routes/
```

The scanner API will be automatically loaded if the file is found.

## Directory Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── config.py              # Configuration constants
├── database.py            # Database connection
├── requirements.txt       # Python dependencies
├── models/                # Pydantic models
│   ├── __init__.py
│   ├── base.py
│   ├── enums.py
│   ├── user.py
│   ├── asset.py
│   ├── procurement.py
│   ├── audit.py
│   └── agent.py
├── auth/                  # Authentication
│   ├── __init__.py
│   ├── security.py
│   └── dependencies.py
├── utils/                 # Utility functions
│   ├── __init__.py
│   ├── helpers.py
│   └── audit.py
└── routes/                # API endpoints
    ├── __init__.py
    ├── auth.py
    ├── assets.py
    ├── users.py
    ├── procurement.py
    ├── analytics.py
    ├── audit.py
    └── agent.py
```
