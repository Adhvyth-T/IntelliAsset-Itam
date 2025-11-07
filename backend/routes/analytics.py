from fastapi import APIRouter, Depends
from datetime import datetime, timedelta

from database import get_database
from utils import check_and_update_compliance_status

router = APIRouter(prefix="/api", tags=["Analytics"])

@router.get("/analytics/dashboard")
async def get_dashboard_analytics(db=Depends(get_database)):
    """Get dashboard analytics data"""
    await check_and_update_compliance_status(db)
    
    pipeline = [
        {
            "$group": {
                "_id": None,
                "totalAssets": {"$sum": 1},
                "totalValue": {"$sum": "$cost"},
                "activeAssets": {
                    "$sum": {"$cond": [{"$eq": ["$status", "Active"]}, 1, 0]}
                },
                "maintenanceAssets": {
                    "$sum": {"$cond": [{"$eq": ["$status", "Maintenance"]}, 1, 0]}
                },
                "inactiveAssets": {
                    "$sum": {"$cond": [{"$eq": ["$status", "Inactive"]}, 1, 0]}
                }
            }
        }
    ]
    
    result = await db.assets.aggregate(pipeline).to_list(length=1)
    if result:
        return result[0]
    return {
        "totalAssets": 0,
        "totalValue": 0,
        "activeAssets": 0,
        "maintenanceAssets": 0,
        "inactiveAssets": 0
    }

@router.get("/analytics/departments")
async def get_department_analytics(db=Depends(get_database)):
    """Get department-wise asset analytics"""
    pipeline = [
        {
            "$group": {
                "_id": "$department",
                "count": {"$sum": 1},
                "totalValue": {"$sum": "$cost"}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    result = await db.assets.aggregate(pipeline).to_list(length=None)
    return result

@router.get("/analytics/categories")
async def get_category_analytics(db=Depends(get_database)):
    """Get category-wise asset analytics"""
    pipeline = [
        {
            "$group": {
                "_id": "$category",
                "count": {"$sum": 1},
                "totalValue": {"$sum": "$cost"}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    result = await db.assets.aggregate(pipeline).to_list(length=None)
    return result

@router.get("/analytics/compliance")
async def get_compliance_analytics(db=Depends(get_database)):
    """Get compliance analytics"""
    pipeline = [
        {
            "$group": {
                "_id": "$complianceStatus",
                "count": {"$sum": 1}
            }
        }
    ]
    
    result = await db.assets.aggregate(pipeline).to_list(length=None)
    return result

@router.get("/reports/asset-aging")
async def get_asset_aging_report(db=Depends(get_database)):
    """Get asset aging report"""
    assets = await db.assets.find().to_list(length=None)
    aging_data = []
    
    for asset in assets:
        if asset.get("purchaseDate"):
            try:
                purchase_date = datetime.strptime(asset["purchaseDate"], "%Y-%m-%d")
                age_days = (datetime.utcnow() - purchase_date).days
                aging_data.append({
                    "id": str(asset["_id"]),
                    "name": asset["name"],
                    "purchaseDate": asset["purchaseDate"],
                    "ageDays": age_days,
                    "ageYears": round(age_days / 365.25, 2)
                })
            except ValueError:
                continue
    
    return sorted(aging_data, key=lambda x: x["ageDays"], reverse=True)

@router.get("/reports/utilization")
async def get_utilization_report(db=Depends(get_database)):
    """Get asset utilization report"""
    pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "totalValue": {"$sum": "$cost"}
            }
        }
    ]
    
    result = await db.assets.aggregate(pipeline).to_list(length=None)
    total_assets = await db.assets.count_documents({})
    
    utilization_data = []
    for item in result:
        utilization_data.append({
            "status": item["_id"],
            "count": item["count"],
            "totalValue": item["totalValue"],
            "percentage": round((item["count"] / total_assets) * 100, 2) if total_assets > 0 else 0
        })
    
    return utilization_data
