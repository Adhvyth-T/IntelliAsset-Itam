from datetime import datetime, timedelta

def asset_helper(asset) -> dict:
    return {
        "id": str(asset["_id"]),
        "name": asset["name"],
        "type": asset["type"],
        "category": asset["category"],
        "status": asset["status"],
        "assignedTo": asset.get("assignedTo"),
        "department": asset.get("department"),
        "location": asset.get("location"),
        "purchaseDate": asset.get("purchaseDate"),
        "cost": asset.get("cost", 0),
        "serialNumber": asset.get("serialNumber"),
        "vendor": asset.get("vendor"),
        "warranty": asset.get("warranty"),
        "lifecycle": asset.get("lifecycle", "Procurement"),
        "tags": asset.get("tags", []),
        "complianceStatus": asset.get("complianceStatus", "Compliant"),
        "maintenanceSchedule": asset.get("maintenanceSchedule"),
        "lastAudit": asset.get("lastAudit"),
        "notes": asset.get("notes"),
        "createdAt": asset.get("createdAt"),
        "updatedAt": asset.get("updatedAt")
    }

def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "department": user.get("department"),
        "role": user.get("role"),
        "permissions": user.get("permissions", []),
        "assetsCount": user.get("assetsCount", 0),
        "createdAt": user.get("createdAt"),
        "updatedAt": user.get("updatedAt")
    }

def procurement_request_helper(request) -> dict:
    """Helper to format procurement request for response"""
    return {
        "id": str(request["_id"]),
        "requestor_id": request["requestor_id"],
        "requestor_name": request["requestor_name"],
        "requestor_email": request["requestor_email"],
        "asset_name": request["asset_name"],
        "asset_type": request["asset_type"],
        "category": request["category"],
        "quantity": request["quantity"],
        "estimated_cost": request.get("estimated_cost"),
        "priority": request["priority"],
        "status": request["status"],
        "justification": request["justification"],
        "specifications": request.get("specifications"),
        "department": request.get("department"),
        "required_by_date": request.get("required_by_date"),
        "vendor_preference": request.get("vendor_preference"),
        "requested_date": request["requested_date"],
        "approver_id": request.get("approver_id"),
        "approver_name": request.get("approver_name"),
        "approval_date": request.get("approval_date"),
        "approval_comments": request.get("approval_comments"),
        "rejection_comments": request.get("rejection_comments"),
        "fulfilled_asset_id": request.get("fulfilled_asset_id"),
        "order_date": request.get("order_date"),
        "fulfillment_date": request.get("fulfillment_date"),
        "createdAt": request.get("createdAt"),
        "updatedAt": request.get("updatedAt")
    }

def audit_record_helper(record) -> dict:
    """Helper to format audit record for response"""
    return {
        "id": str(record["_id"]),
        "timestamp": record["timestamp"].isoformat(),
        "asset_id": record["asset_id"],
        "field_changed": record["field_changed"],
        "old_value": record.get("old_value"),
        "new_value": record.get("new_value"),
        "changed_by_user_id": record["changed_by_user_id"],
        "changed_by_email": record["changed_by_email"],
        "previous_hash": record.get("previous_hash"),
        "current_hash": record["current_hash"],
        "chain_index": record["chain_index"],
        "metadata": record.get("metadata", {})
    }

async def update_user_asset_count(user_name: str, db):
    """Update the asset count for a user"""
    count = await db.assets.count_documents({"assignedTo": user_name})
    await db.users.update_one(
        {"name": user_name},
        {"$set": {"assetsCount": count, "updatedAt": datetime.utcnow()}}
    )

async def check_and_update_expired_assets(db):
    """Check warranty dates and update expired assets to Inactive status"""
    current_date = datetime.utcnow()
    assets = await db.assets.find({"warranty": {"$ne": None}, "status": {"$ne": "Inactive"}}).to_list(length=None)
    
    updated_count = 0
    for asset in assets:
        try:
            warranty_str = asset.get("warranty", "")
            if not warranty_str:
                continue
            
            # Try multiple date formats
            warranty_date = None
            for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%d-%m-%Y"]:
                try:
                    warranty_date = datetime.strptime(warranty_str, fmt)
                    break
                except ValueError:
                    continue
            
            # If warranty expired, update status to Inactive
            if warranty_date and warranty_date < current_date:
                await db.assets.update_one(
                    {"_id": asset["_id"]},
                    {"$set": {"status": "Inactive", "updatedAt": current_date}}
                )
                updated_count += 1
        except Exception:
            continue
    
    return updated_count

async def check_and_update_compliance_status(db):
    """Check lastAudit dates and update compliance status if expired (>365 days)"""
    current_date = datetime.utcnow()
    one_year_ago = current_date - timedelta(days=365)
    assets = await db.assets.find({"lastAudit": {"$ne": None}}).to_list(length=None)
    
    updated_count = 0
    for asset in assets:
        try:
            audit_str = asset.get("lastAudit", "")
            if not audit_str:
                continue
            
            # Try multiple date formats
            audit_date = None
            for fmt in ["%Y-%m-%d", "%m/%d/%Y", "%d-%m-%Y"]:
                try:
                    audit_date = datetime.strptime(audit_str, fmt)
                    break
                except ValueError:
                    continue
            
            # If audit >365 days old, mark as non-compliant
            if audit_date and audit_date < one_year_ago:
                await db.assets.update_one(
                    {"_id": asset["_id"]},
                    {"$set": {"complianceStatus": "Non-Compliant", "updatedAt": current_date}}
                )
                updated_count += 1
        except Exception:
            continue
    
    return updated_count
