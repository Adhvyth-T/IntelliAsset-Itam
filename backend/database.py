from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URL, DATABASE_NAME

# Global variables for database
mongodb_client: AsyncIOMotorClient = None
database = None

async def startup_db_client():
    global mongodb_client, database
    mongodb_client = AsyncIOMotorClient(MONGODB_URL)
    database = mongodb_client[DATABASE_NAME]
    
    # Create indexes
    await database.assets.create_index("name")
    await database.users.create_index("email", unique=True)
    await database.users.create_index("status")
    await database.users.create_index("role")
    await database.assets.create_index("serialNumber")
    await database.assets.create_index("department")
    
    # Add index for agent status
    await database.agent_status.create_index("serial_number", unique=True)
    await database.agent_status.create_index("last_seen")
    
    # Add indexes for audit chain
    await database.audit_chain.create_index([("asset_id", 1), ("chain_index", 1)], unique=True)
    await database.audit_chain.create_index("asset_id")
    await database.audit_chain.create_index("timestamp")
    await database.audit_chain.create_index("changed_by_user_id")
    
    # Add indexes for procurement requests
    await database.procurement_requests.create_index("requestor_id")
    await database.procurement_requests.create_index("status")
    await database.procurement_requests.create_index("priority")
    await database.procurement_requests.create_index("department")
    await database.procurement_requests.create_index("requested_date")
    
    print("Connected to MongoDB Atlas")

async def shutdown_db_client():
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("Disconnected from MongoDB Atlas")

def get_database():
    return database
