from fastapi import APIRouter, HTTPException, Depends, Form
from datetime import datetime, timedelta
from bson import ObjectId
import aiohttp

from database import get_database
from models import AgentMetricsResponse, LiveMetrics

router = APIRouter(prefix="/api", tags=["Agent"])

@router.get("/assets/{asset_id}/agent-status", response_model=AgentMetricsResponse)
async def get_asset_agent_status(
    asset_id: str, 
    db=Depends(get_database)
):
    """Check if an asset's agent is online and get live metrics"""
    if not ObjectId.is_valid(asset_id):
        raise HTTPException(status_code=400, detail="Invalid asset ID")
    
    # Get the asset
    asset = await db.assets.find_one({"_id": ObjectId(asset_id)})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    serial_number = asset.get("serialNumber")
    if not serial_number:
        return AgentMetricsResponse(
            asset_id=asset_id,
            serial_number="",
            is_online=False,
            error="Asset has no serial number"
        )
    
    # Check agent status from our tracking collection
    agent_status = await db.agent_status.find_one({"serial_number": serial_number})
    
    # Consider agent online if last seen within 5 minutes
    is_online = False
    agent_url = None
    
    if agent_status:
        last_seen = agent_status.get("last_seen")
        agent_url = agent_status.get("agent_url")
        
        if last_seen and (datetime.utcnow() - last_seen).total_seconds() < 300:  # 5 minutes
            is_online = True
    
    response = AgentMetricsResponse(
        asset_id=asset_id,
        serial_number=serial_number,
        is_online=is_online
    )
    
    # If online and we have agent URL, fetch live metrics
    if is_online and agent_url:
        try:
            print(f"Fetching metrics from agent: {agent_url}/metrics")
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
                async with session.get(f"{agent_url}/metrics") as resp:
                    if resp.status == 200:
                        metrics_data = await resp.json()
                        
                        print(f"✓ Successfully fetched metrics from {agent_url}")
                        
                        response.metrics = LiveMetrics(
                            hostname=metrics_data.get("hostname", "Unknown"),
                            platform=metrics_data.get("platform", "Unknown"),
                            cpu_model=metrics_data.get("cpu_model", "Unknown"),
                            device_type=metrics_data.get("device_type", "Unknown"),
                            cpu_usage=metrics_data.get("cpu_usage"),
                            memory_usage=metrics_data.get("memory_usage"),
                            disk_usage=metrics_data.get("disk_usage"),
                            ip_address=metrics_data.get("ip_address"),
                            uptime=metrics_data.get("uptime"),
                            serial_number=metrics_data.get("serial_number", serial_number),
                            timestamp=datetime.utcnow()
                        )
                        response.last_updated = datetime.utcnow()
                    else:
                        error_msg = f"Agent returned status {resp.status}"
                        print(f"✗ {error_msg}")
                        response.error = error_msg
                        response.is_online = False
                        
        except aiohttp.ClientConnectorError as e:
            error_msg = f"Cannot connect to agent at {agent_url}"
            print(f"✗ {error_msg}: {str(e)}")
            response.error = error_msg
            response.is_online = False
            
        except asyncio.TimeoutError:
            error_msg = f"Timeout connecting to agent at {agent_url}"
            print(f"✗ {error_msg}")
            response.error = error_msg
            response.is_online = False
            
        except Exception as e:
            error_msg = f"Failed to fetch live metrics: {str(e)}"
            print(f"✗ {error_msg}")
            response.error = error_msg
            response.is_online = False
    else:
        if not is_online:
            response.error = "Agent offline (last heartbeat >5 minutes ago)"
        elif not agent_url:
            response.error = "Agent URL not registered"
    
    return response

@router.post("/agent/heartbeat")
async def agent_heartbeat(
    serial_number: str = Form(...),
    agent_url: str = Form(...),
    db=Depends(get_database)
):
    """Endpoint for agents to register their presence"""
    
    print(f"Heartbeat received:")
    print(f"  Serial: {serial_number}")
    print(f"  URL: {agent_url}")
    print(f"  Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Validate agent_url format
    if not agent_url.startswith("http://") and not agent_url.startswith("https://"):
        agent_url = f"http://{agent_url}"
    
    # Store/update agent status
    await db.agent_status.update_one(
        {"serial_number": serial_number},
        {
            "$set": {
                "serial_number": serial_number,
                "last_seen": datetime.utcnow(),
                "agent_url": agent_url,
                "is_online": True
            }
        },
        upsert=True
    )
    
    return {
        "status": "heartbeat_recorded",
        "timestamp": datetime.utcnow(),
        "serial_number": serial_number,
        "agent_url": agent_url
    }

@router.get("/agents/online")
async def get_online_agents(
    db=Depends(get_database)
):
    """Get list of all online agents"""
    cutoff_time = datetime.utcnow() - timedelta(minutes=5)
    
    online_agents = await db.agent_status.find({
        "last_seen": {"$gte": cutoff_time}
    }).to_list(length=None)
    
    return {
        "count": len(online_agents),
        "agents": [
            {
                "serial_number": agent["serial_number"],
                "last_seen": agent["last_seen"],
                "agent_url": agent.get("agent_url"),
                "is_online": True
            }
            for agent in online_agents
        ]
    }

@router.get("/agents/all")
async def get_all_agents(
    db=Depends(get_database)
):
    """Get list of all agents (online and offline)"""
    cutoff_time = datetime.utcnow() - timedelta(minutes=5)
    
    all_agents = await db.agent_status.find({}).to_list(length=None)
    
    agents_list = []
    for agent in all_agents:
        last_seen = agent.get("last_seen")
        is_online = False
        
        if last_seen and (datetime.utcnow() - last_seen).total_seconds() < 300:
            is_online = True
        
        agents_list.append({
            "serial_number": agent["serial_number"],
            "last_seen": last_seen,
            "agent_url": agent.get("agent_url"),
            "is_online": is_online,
            "offline_duration": int((datetime.utcnow() - last_seen).total_seconds()) if last_seen else None
        })
    
    # Sort by online status, then by last_seen
    agents_list.sort(key=lambda x: (not x["is_online"], x["last_seen"] or datetime.min), reverse=True)
    
    return {
        "total": len(agents_list),
        "online": sum(1 for a in agents_list if a["is_online"]),
        "offline": sum(1 for a in agents_list if not a["is_online"]),
        "agents": agents_list
    }

@router.delete("/agents/{serial_number}")
async def remove_agent(
    serial_number: str,
    db=Depends(get_database)
):
    """Remove an agent from tracking"""
    result = await db.agent_status.delete_one({"serial_number": serial_number})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {
        "status": "success",
        "message": f"Agent {serial_number} removed",
        "timestamp": datetime.utcnow()
    }

@router.post("/agents/test-connection")
async def test_agent_connection(
    agent_url: str = Form(...)
):
    """Test connection to an agent"""
    try:
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=5)) as session:
            # Test status endpoint
            async with session.get(f"{agent_url}/status") as resp:
                if resp.status == 200:
                    status_data = await resp.json()
                    
                    # Test metrics endpoint
                    async with session.get(f"{agent_url}/metrics") as metrics_resp:
                        if metrics_resp.status == 200:
                            metrics_data = await metrics_resp.json()
                            
                            return {
                                "success": True,
                                "message": "Agent is reachable",
                                "status": status_data,
                                "metrics_available": True,
                                "sample_metrics": {
                                    "cpu_usage": metrics_data.get("cpu_usage"),
                                    "memory_usage": metrics_data.get("memory_usage"),
                                    "disk_usage": metrics_data.get("disk_usage")
                                }
                            }
                        else:
                            return {
                                "success": True,
                                "message": "Agent status OK, but metrics endpoint failed",
                                "status": status_data,
                                "metrics_available": False
                            }
                else:
                    return {
                        "success": False,
                        "message": f"Agent returned status {resp.status}"
                    }
                    
    except aiohttp.ClientConnectorError as e:
        return {
            "success": False,
            "message": f"Cannot connect to agent: {str(e)}"
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error testing connection: {str(e)}"
        }