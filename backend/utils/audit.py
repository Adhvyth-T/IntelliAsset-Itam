import hashlib
from datetime import datetime
from typing import Optional, Dict, Any
from models import UserResponse, AuditChainVerification

def compute_audit_hash(
    timestamp: datetime,
    asset_id: str,
    field: str,
    old_value: Optional[str],
    new_value: Optional[str],
    user_id: str,
    previous_hash: Optional[str]
) -> str:
    """
    Compute SHA-256 hash for audit record.
    Creates a cryptographic chain by including previous hash.
    """
    # Ensure timestamp is timezone-aware UTC and format consistently
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=None)
    
    # Use Unix timestamp (seconds since epoch) for consistency
    timestamp_str = str(int(timestamp.timestamp() * 1000))  # milliseconds
    
    # Create deterministic string representation
    # Convert None values to empty string for consistency
    old_val = old_value if old_value is not None else ""
    new_val = new_value if new_value is not None else ""
    prev_hash = previous_hash if previous_hash is not None else "GENESIS"
    
    data_string = f"{timestamp_str}|{asset_id}|{field}|{old_val}|{new_val}|{user_id}|{prev_hash}"
    
    # Compute SHA-256 hash
    hash_object = hashlib.sha256(data_string.encode('utf-8'))
    return hash_object.hexdigest()

async def create_audit_record(
    db,
    asset_id: str,
    field_changed: str,
    old_value: Optional[str],
    new_value: Optional[str],
    changed_by: UserResponse,
    metadata: Optional[Dict[str, Any]] = None
) -> str:
    """
    Create a new audit chain record with cryptographic hash.
    Returns the hash of the created record.
    """
    # Get the previous audit record for this asset
    previous_record = await db.audit_chain.find_one(
        {"asset_id": asset_id},
        sort=[("chain_index", -1)]
    )
    
    previous_hash = previous_record["current_hash"] if previous_record else None
    chain_index = (previous_record["chain_index"] + 1) if previous_record else 0
    
    timestamp = datetime.utcnow()
    
    # Compute hash for this record
    current_hash = compute_audit_hash(
        timestamp=timestamp,
        asset_id=asset_id,
        field=field_changed,
        old_value=old_value,
        new_value=new_value,
        user_id=changed_by.id,
        previous_hash=previous_hash
    )
    
    # Create audit record
    audit_record = {
        "timestamp": timestamp,
        "asset_id": asset_id,
        "field_changed": field_changed,
        "old_value": old_value,
        "new_value": new_value,
        "changed_by_user_id": changed_by.id,
        "changed_by_email": changed_by.email,
        "previous_hash": previous_hash,
        "current_hash": current_hash,
        "chain_index": chain_index,
        "metadata": metadata or {}
    }
    
    await db.audit_chain.insert_one(audit_record)
    
    return current_hash

async def verify_audit_chain(db, asset_id: str) -> AuditChainVerification:
    """
    Verify the integrity of the audit chain for an asset.
    Checks that each record's hash is valid and links correctly to previous.
    """
    records = await db.audit_chain.find(
        {"asset_id": asset_id}
    ).sort("chain_index", 1).to_list(length=None)
    
    if not records:
        return AuditChainVerification(
            is_valid=True,
            total_records=0,
            verified_records=0
        )
    
    verified_count = 0
    previous_hash = None
    
    for i, record in enumerate(records):
        # Recompute hash
        computed_hash = compute_audit_hash(
            timestamp=record["timestamp"],
            asset_id=record["asset_id"],
            field=record["field_changed"],
            old_value=record.get("old_value"),
            new_value=record.get("new_value"),
            user_id=record["changed_by_user_id"],
            previous_hash=previous_hash
        )
        
        # Verify hash matches
        if computed_hash != record["current_hash"]:
            return AuditChainVerification(
                is_valid=False,
                total_records=len(records),
                verified_records=verified_count,
                broken_at_index=i,
                error_message=f"Hash mismatch at index {i}. Expected {computed_hash}, got {record['current_hash']}"
            )
        
        # Verify chain link
        if previous_hash != record.get("previous_hash"):
            return AuditChainVerification(
                is_valid=False,
                total_records=len(records),
                verified_records=verified_count,
                broken_at_index=i,
                error_message=f"Chain break at index {i}. Previous hash mismatch."
            )
        
        verified_count += 1
        previous_hash = record["current_hash"]
    
    return AuditChainVerification(
        is_valid=True,
        total_records=len(records),
        verified_records=verified_count
    )
