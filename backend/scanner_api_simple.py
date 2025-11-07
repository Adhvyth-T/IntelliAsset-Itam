# scanner_api_simple.py
"""
Scanner API with AI Agent Integration
Uses OpenRouter for vision-based device scanning and intelligent data enrichment
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import base64
import io
import re
from enum import Enum

# Import AI Agent
from ai_agent_service import get_ai_agent

# Simple models for scanner
class ScanType(str, Enum):
    AI_VISION = "ai_vision"  # New: AI-powered image scanning
    MANUAL = "manual"
    BARCODE = "barcode"  # Legacy support
    QR_CODE = "qr_code"   # Legacy support

class ScanStatus(str, Enum):
    SUCCESS = "success"
    NOT_FOUND = "not_found"
    ERROR = "error"
    PROCESSING = "processing"

class DeviceScanRequest(BaseModel):
    image_data: Optional[str] = None
    manual_id: Optional[str] = None
    scan_type: ScanType = ScanType.MANUAL
    auto_add: bool = False
    additional_info: Optional[Dict[str, Any]] = None
    context: Optional[Dict[str, Any]] = None  # New: department, location context

class DeviceScanResult(BaseModel):
    status: ScanStatus
    scan_type: ScanType
    extracted_id: Optional[str] = None
    serial_number: Optional[str] = None
    asset_id: Optional[str] = None
    asset_data: Optional[Dict[str, Any]] = None
    message: str
    suggestions: List[Dict[str, Any]] = []
    user_suggestions: List[Dict[str, Any]] = []  # New: suggested user assignments
    extracted_text: Optional[str] = None  # New: all extracted text
    confidence: Optional[float] = None  # New: AI confidence score
    ai_recommendations: List[str] = []  # New: AI recommendations

class QuickAddDevice(BaseModel):
    serial_number: str
    name: str
    type: str = "Computer"
    category: str = "Hardware"
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    location: Optional[str] = None
    department: Optional[str] = None

def create_scanner_router(get_database, get_current_user, UserResponse, asset_helper):
    """Create scanner router with AI agent integration"""
    
    router = APIRouter(prefix="/api/scanner", tags=["scanner"])
    
    @router.post("/scan", response_model=DeviceScanResult)
    async def scan_device(
        scan_request: DeviceScanRequest,
        db=Depends(get_database),
        #current_user: UserResponse = Depends(get_current_user)
    ):
        """
        Enhanced scan with AI agent:
        - AI Vision: Uses OpenRouter for image analysis and device identification
        - Manual: Direct ID entry
        """
        
        extracted_id = None
        ai_result = None
        
        try:
            # AI Vision Mode - NEW PRIMARY METHOD
            if scan_request.scan_type == ScanType.AI_VISION and scan_request.image_data:
                print("🤖 Processing with AI Vision Agent...")
                
                # Get available users for assignment suggestions
                users = await db.users.find().limit(50).to_list(length=50)
                user_list = [
                    {
                        "name": u.get("name"),
                        "email": u.get("email"),
                        "department": u.get("department"),
                        "role": u.get("role"),
                        "assetsCount": u.get("assetsCount", 0)
                    }
                    for u in users
                ]
                
                # Process with AI agent
                ai_agent = get_ai_agent()
                ai_result = await ai_agent.process_scan_workflow(
                    image_data=scan_request.image_data,
                    available_users=user_list,
                    context=scan_request.context
                )
                
                if ai_result.get("status") == "error":
                    return DeviceScanResult(
                        status=ScanStatus.ERROR,
                        scan_type=scan_request.scan_type,
                        message=ai_result.get("message", "AI processing failed"),
                        suggestions=[]
                    )
                
                # Extract device info
                device_record = ai_result.get("device_record", {})
                extracted_id = device_record.get("serial_number")
                
                if not extracted_id:
                    return DeviceScanResult(
                        status=ScanStatus.ERROR,
                        scan_type=scan_request.scan_type,
                        message="Could not extract device ID from image",
                        extracted_text=ai_result.get("extracted_text"),
                        suggestions=[],
                        ai_recommendations=["Try capturing a clearer image", "Ensure serial number/label is visible"]
                    )
            
            # Manual Entry Mode
            elif scan_request.scan_type == ScanType.MANUAL:
                extracted_id = scan_request.manual_id
                
            # Legacy Barcode/QR modes
            elif scan_request.scan_type in [ScanType.BARCODE, ScanType.QR_CODE]:
                return DeviceScanResult(
                    status=ScanStatus.ERROR,
                    scan_type=scan_request.scan_type,
                    message="Legacy barcode/QR scanning requires additional libraries. Please use AI Vision mode or Manual entry.",
                    suggestions=[]
                ) 
                  
            
            if not extracted_id:
                return DeviceScanResult(
                    status=ScanStatus.ERROR,
                    scan_type=scan_request.scan_type,
                    message="No device ID could be determined",
                    suggestions=[]
                )
            
            # Search for device in database
            asset = await db.assets.find_one({
                "$or": [
                    {"serialNumber": extracted_id},
                    {"_id": ObjectId(extracted_id) if ObjectId.is_valid(extracted_id) else None}
                ]
            })
            
            # Device found in database
            if asset:
                result = DeviceScanResult(
                    status=ScanStatus.SUCCESS,
                    scan_type=scan_request.scan_type,
                    extracted_id=extracted_id,
                    serial_number=asset.get("serialNumber"),
                    asset_id=str(asset["_id"]),
                    asset_data=asset_helper(asset),
                    message="Device found in database",
                    suggestions=[]
                )
                
                # Add AI enrichment data if available
                if ai_result:
                    result.confidence = ai_result.get("confidence")
                    result.extracted_text = ai_result.get("extracted_text")
                    result.ai_recommendations = ai_result.get("recommendations", [])
                
                return result
            
            # Device NOT found - Auto-add or suggest
            if scan_request.auto_add and extracted_id:
                # Use AI-enriched data if available
                if ai_result and ai_result.get("device_record"):
                    new_asset = ai_result["device_record"].copy()
                    # Remove extraction_data before inserting
                    extraction_data = new_asset.pop("extraction_data", None)
                    new_asset["createdAt"] = datetime.utcnow()
                    new_asset["updatedAt"] = datetime.utcnow()
                    new_asset["addedBy"] = "AI Agent"
                    new_asset["aiProcessed"] = True
                    if extraction_data:
                        new_asset["extractionData"] = extraction_data
                    
                    # Apply additional info if provided
                    if scan_request.additional_info:
                        new_asset.update(scan_request.additional_info)
                else:
                    # Fallback to basic record
                    new_asset = {
                        "name": f"Device {extracted_id[:8] if len(extracted_id) > 8 else extracted_id}",
                        "type": "Unknown Device",
                        "category": "Hardware",
                        "status": "Active",
                        "serialNumber": extracted_id,
                        "tags": [extracted_id],
                        "notes": f"Auto-added via scanner on {datetime.utcnow().isoformat()}",
                        "createdAt": datetime.utcnow(),
                        "updatedAt": datetime.utcnow()
                    }
                    
                    if scan_request.additional_info:
                        new_asset.update(scan_request.additional_info)
                
                # Insert into database
                result = await db.assets.insert_one(new_asset)
                created_asset = await db.assets.find_one({"_id": result.inserted_id})
                
                response = DeviceScanResult(
                    status=ScanStatus.SUCCESS,
                    scan_type=scan_request.scan_type,
                    extracted_id=extracted_id,
                    serial_number=extracted_id,
                    asset_id=str(result.inserted_id),
                    asset_data=asset_helper(created_asset),
                    message="Device automatically added to database with AI-enriched data",
                    suggestions=[]
                )
                
                # Add AI metadata
                if ai_result:
                    response.confidence = ai_result.get("confidence")
                    response.extracted_text = ai_result.get("extracted_text")
                    response.user_suggestions = ai_result.get("user_suggestions", [])
                    response.ai_recommendations = ai_result.get("recommendations", [])
                
                return response
            
            # Device not found and not auto-adding - provide suggestions
            suggestions = []
            if len(extracted_id) > 4:
                similar_assets = await db.assets.find({
                    "serialNumber": {"$regex": extracted_id[:4], "$options": "i"}
                }).limit(5).to_list(length=5)
                
                suggestions = [asset_helper(asset) for asset in similar_assets]
            
            response = DeviceScanResult(
                status=ScanStatus.NOT_FOUND,
                scan_type=scan_request.scan_type,
                extracted_id=extracted_id,
                message="Device not found in database. Enable auto-add or use Quick Add form.",
                suggestions=suggestions
            )
            
            # Add AI enrichment data for user to review before adding
            if ai_result:
                response.confidence = ai_result.get("confidence")
                response.extracted_text = ai_result.get("extracted_text")
                response.user_suggestions = ai_result.get("user_suggestions", [])
                response.ai_recommendations = ai_result.get("recommendations", [])
                # Store device record in response for quick-add
                response.asset_data = ai_result.get("device_record")
            
            return response
            
        except Exception as e:
            import traceback
            print(f"Error in scan_device: {str(e)}")
            print(traceback.format_exc())
            return DeviceScanResult(
                status=ScanStatus.ERROR,
                scan_type=scan_request.scan_type,
                message=f"Scan error: {str(e)}",
                suggestions=[]
            )
    
    @router.post("/quick-add", response_model=dict)
    async def quick_add_device(
        device: QuickAddDevice,
        db=Depends(get_database),
        #current_user: UserResponse = Depends(get_current_user)
    ):
        """Quickly add a device after scanning"""
        
        # Check if serial number already exists
        existing = await db.assets.find_one({"serialNumber": device.serial_number})
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="Device with this serial number already exists"
            )
        
        asset_dict = {
            "name": device.name,
            "type": device.type,
            "category": device.category,
            "status": "Active",
            "serialNumber": device.serial_number,
            "manufacturer": device.manufacturer,
            "model": device.model,
            "location": device.location,
            "department": device.department,
            "tags": [device.serial_number],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        
        result = await db.assets.insert_one(asset_dict)
        new_asset = await db.assets.find_one({"_id": result.inserted_id})
        
        return asset_helper(new_asset)
    
    @router.get("/validate/{serial_number}")
    async def validate_serial_number(
        serial_number: str,
        db=Depends(get_database),
    ):
        """Validate if a serial number exists in database"""
        
        asset = await db.assets.find_one({"serialNumber": serial_number})
        
        if asset:
            return {
                "exists": True,
                "asset_id": str(asset["_id"]),
                "asset_data": asset_helper(asset)
            }
        
        # Find similar devices
        suggestions = []
        if len(serial_number) > 3:
            similar = await db.assets.find({
                "serialNumber": {"$regex": serial_number[:4], "$options": "i"}
            }).limit(5).to_list(length=5)
            suggestions = [asset_helper(asset) for asset in similar]
        
        return {
            "exists": False,
            "suggestions": suggestions
        }
    
    @router.get("/history")
    async def get_scan_history(
        limit: int = 50,
        db=Depends(get_database),
    ):
        """Get scan history - shows AI-processed devices"""
        
        # Get recently added devices with AI processing flag
        recent_assets = await db.assets.find(
            {"aiProcessed": True}
        ).sort("createdAt", -1).limit(limit).to_list(length=limit)
        
        return [asset_helper(asset) for asset in recent_assets]
    
    return router