import os
import sys
import socket
import platform
import psutil
import httpx
import json
import uvicorn
import asyncio
from uuid import getnode as get_mac
from datetime import datetime

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

# --- Configuration ---
BACKEND_API_URL = "http://172.31.176.1:8000"  # Update this with your backend server IP
AGENT_HOST = "0.0.0.0"  # Listen on ALL interfaces
AGENT_PORT = 8081
HEARTBEAT_INTERVAL = 30  # seconds

# Auto-detect agent's IP (set at startup)
AGENT_IP = None
# ---------------------

# --- Initialize FastAPI App ---
app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for agent
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- HTML/CSS for the Web UI ---
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Device Metrics Update</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f2f5; }}
        .container {{ background: #fff; padding: 2rem 3rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }}
        h1 {{ color: #333; }}
        p {{ color: #666; }}
        form {{ display: flex; flex-direction: column; }}
        input {{ padding: 0.8rem; margin-bottom: 1rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }}
        button {{ padding: 0.8rem; border: none; border-radius: 6px; background-color: #007bff; color: white; font-size: 1rem; cursor: pointer; transition: background-color 0.2s; }}
        button:hover {{ background-color: #0056b3; }}
        .message {{ margin-top: 1.5rem; padding: 1rem; border-radius: 6px; text-align: left; }}
        .success {{ background-color: #e9f7ef; color: #155724; border: 1px solid #c3e6cb; }}
        .error {{ background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }}
        .info {{ background-color: #e2e3e5; color: #383d41; border: 1px solid #d6d8db; }}
        a {{ color: #007bff; text-decoration: none; }}
        .status-badge {{ display: inline-block; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem; margin-top: 1rem; }}
        .online {{ background-color: #d4edda; color: #155724; }}
    </style>
</head>
<body>
    <div class="container">
        {content}
    </div>
</body>
</html>
"""

LOGIN_FORM_CONTENT = """
<h1>📊 Device Metrics Update</h1>
<p>Enter your credentials to find this device and update its metrics.</p>
<div class="status-badge online">Agent Online</div>
<form action="/submit-info" method="post">
    <input type="email" name="email" placeholder="Enter your email" required>
    <input type="password" name="password" placeholder="Enter your password" required>
    <button type="submit">Update Device Metrics</button>
</form>
<p style="margin-top: 1.5rem; font-size: 0.85rem; color: #666;">
    Serial Number: {serial}<br>
    Agent URL: {agent_url}
</p>
"""

def create_response_page(message_html: str) -> HTMLResponse:
    """Helper function to create a full HTML response page."""
    go_back_link = '<p style="margin-top: 2rem;"><a href="/">&larr; Go Back</a></p>'
    full_content = message_html + go_back_link
    return HTMLResponse(content=HTML_TEMPLATE.format(content=full_content))

# --- Functions to get a unique Serial Number ---
def get_serial_number():
    """Get unique serial number based on MAC address"""
    mac = get_mac()
    return hex(mac)

def get_agent_ip():
    """
    Auto-detect the agent's IP address that can be reached by the backend.
    This works by creating a socket connection to the backend server.
    """
    try:
        # Extract backend host from URL
        backend_host = BACKEND_API_URL.split("://")[1].split(":")[0]
        
        # Create a socket and connect to backend (doesn't actually send data)
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect((backend_host, 80))
        agent_ip = s.getsockname()[0]
        s.close()
        
        # Validate it's not localhost
        if agent_ip.startswith("127."):
            raise Exception("Got localhost IP, trying fallback")
        
        return agent_ip
    except Exception as e:
        print(f"Warning: Could not auto-detect IP via socket: {e}")
        # Fallback: get hostname IP
        try:
            hostname = socket.gethostname()
            agent_ip = socket.gethostbyname(hostname)
            
            if not agent_ip.startswith("127."):
                return agent_ip
            else:
                print("Warning: Hostname resolved to localhost, using 127.0.0.1")
                return "127.0.0.1"
        except Exception as e2:
            print(f"Warning: Fallback IP detection failed: {e2}")
            return "127.0.0.1"

# --- Metric Collection Functions ---
def collect_metrics():
    """Collect all system metrics."""
    try:
        # Determine device type
        try:
            battery = psutil.sensors_battery()
            device_type = "Laptop" if battery else "Desktop"
        except:
            device_type = "Desktop"
        
        # Get disk usage based on OS
        try:
            if os.name == 'posix':
                disk_usage = psutil.disk_usage('/').percent
            else:
                disk_usage = psutil.disk_usage('C:\\').percent
        except:
            disk_usage = 0
        
        return {
            "hostname": socket.gethostname(),
            "platform": platform.platform(),
            "cpu_model": platform.processor() or "Unknown",
            "device_type": device_type,
            "serial_number": get_serial_number(),
            "timestamp": datetime.utcnow().isoformat(),
            "ip_address": socket.gethostbyname(socket.gethostname()),
            "cpu_usage": psutil.cpu_percent(interval=1),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": disk_usage,
            "uptime": psutil.boot_time()
        }
    except Exception as e:
        print(f"Error collecting metrics: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

# --- API Client ---
class APIClient:
    def __init__(self, base_url: str):
        self._api_url = base_url
        self._user_id = None
        self._client = httpx.AsyncClient(base_url=base_url, timeout=20.0, headers={"Authorization": ""})

    async def login(self, email: str, password: str) -> tuple[bool, str]:
        try:
            response = await self._client.post("/api/auth/login", json={"email": email, "password": password})
            if response.status_code == 200:
                response_data = response.json()
                self._user_id = response_data.get("user", {}).get("id")
                # Set the auth token for subsequent requests
                token = response_data.get("token")
                if token:
                    self._client.headers["Authorization"] = f"Bearer {token}"
                return (True, "Login successful.") if self._user_id else (False, "Login failed: User or Token not found in response.")
            return False, f"Login failed with status {response.status_code}: {response.text}"
        except httpx.ConnectError:
            return False, f"Connection Error: Could not connect to the backend at {self._api_url}."
        except Exception as e:
            return False, f"An unexpected error occurred during login: {e}"

    async def find_asset_by_serial(self, serial_number: str) -> tuple[dict | None, str]:
        try:
            response = await self._client.get(f"/api/assets?search={serial_number}")
            response.raise_for_status()
            assets = response.json()
            if assets and isinstance(assets, list):
                return assets[0], "Found existing asset."
            return None, "Asset not found."
        except Exception as e:
            return None, f"Error while checking for asset: {e}"

    async def update_asset_metrics(self, asset_id: str, metrics: dict) -> tuple[bool, str]:
        """Sends collected metrics to update an existing asset."""
        payload = {"notes": json.dumps(metrics, indent=2)}
        try:
            response = await self._client.put(f"/api/assets/{asset_id}", json=payload)
            response.raise_for_status()
            return True, f"Successfully updated metrics for asset ID: {asset_id}"
        except Exception as e:
            return False, f"Failed to update asset metrics: {e}"

    async def send_heartbeat(self, serial_number: str, agent_url: str) -> bool:
        """Send heartbeat to backend to indicate agent is online."""
        try:
            response = await self._client.post(
                "/api/agent/heartbeat",
                data={
                    "serial_number": serial_number,
                    "agent_url": agent_url
                }
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Failed to send heartbeat: {e}")
            return False

# Global API client for heartbeat
heartbeat_client = APIClient(base_url=BACKEND_API_URL)

# --- Background task for heartbeat ---
async def heartbeat_task():
    """Background task to send periodic heartbeats."""
    serial = get_serial_number()
    agent_url = f"http://{AGENT_IP}:{AGENT_PORT}"
    
    print(f"Starting heartbeat task...")
    print(f"  Serial: {serial}")
    print(f"  Agent URL: {agent_url}")
    print(f"  Interval: {HEARTBEAT_INTERVAL}s")
    
    while True:
        try:
            success = await heartbeat_client.send_heartbeat(serial, agent_url)
            if success:
                print(f"✓ Heartbeat sent at {datetime.utcnow().strftime('%H:%M:%S')}")
            else:
                print(f"✗ Heartbeat failed at {datetime.utcnow().strftime('%H:%M:%S')}")
            await asyncio.sleep(HEARTBEAT_INTERVAL)
        except Exception as e:
            print(f"Heartbeat error: {e}")
            await asyncio.sleep(HEARTBEAT_INTERVAL)

# --- FastAPI Endpoints ---
@app.on_event("startup")
async def startup_event():
    """Start the heartbeat task on startup."""
    global AGENT_IP
    
    # Auto-detect agent IP
    AGENT_IP = get_agent_ip()
    
    print("\n" + "="*60)
    print("AGENT STARTED")
    print("="*60)
    print(f"Agent IP detected: {AGENT_IP}")
    print(f"Agent accessible at: http://{AGENT_IP}:{AGENT_PORT}")
    print(f"Backend URL: {BACKEND_API_URL}")
    print(f"Serial Number: {get_serial_number()}")
    print("="*60 + "\n")
    
    # Start heartbeat task
    asyncio.create_task(heartbeat_task())

@app.get("/", response_class=HTMLResponse)
async def get_login_form():
    """Serves the initial login page."""
    content = LOGIN_FORM_CONTENT.format(
        serial=get_serial_number(),
        agent_url=f"http://{AGENT_IP}:{AGENT_PORT}"
    )
    return HTMLResponse(content=HTML_TEMPLATE.format(content=content))

@app.get("/metrics")
async def get_live_metrics():
    """Endpoint to get current live metrics - called by backend."""
    metrics = collect_metrics()
    return metrics

@app.get("/status")
async def get_agent_status():
    """Endpoint to check if agent is running."""
    return {
        "status": "online",
        "serial_number": get_serial_number(),
        "timestamp": datetime.utcnow().isoformat(),
        "agent_url": f"http://{AGENT_IP}:{AGENT_PORT}",
        "backend_url": BACKEND_API_URL
    }

@app.post("/submit-info", response_class=HTMLResponse)
async def submit_device_info(email: str = Form(...), password: str = Form(...)):
    """Handles the form submission and the entire registration process."""
    client = APIClient(base_url=BACKEND_API_URL)

    # 1. Login
    login_ok, login_msg = await client.login(email, password)
    if not login_ok:
        message = f'<div class="message error"><h4>Authentication Failed</h4><p>{login_msg}</p></div>'
        return create_response_page(message)

    # 2. Get serial and find the existing asset
    serial = get_serial_number()
    existing_asset, find_msg = await client.find_asset_by_serial(serial)
    
    # 3. If asset is found, update it. If not, show an error.
    if existing_asset:
        asset_id = existing_asset.get("id")
        if not asset_id:
            message = f'<div class="message error"><h4>Error</h4><p>Asset was found, but its ID is missing.</p></div>'
            return create_response_page(message)
        
        # Collect metrics and send them to the backend
        metrics = collect_metrics()
        update_ok, update_msg = await client.update_asset_metrics(asset_id, metrics)
        
        if update_ok:
            message = f'<div class="message success"><h4>Metrics Updated!</h4><p>{update_msg}</p><p>Asset ID: {asset_id}</p></div>'
        else:
            message = f'<div class="message error"><h4>Update Failed</h4><p>{update_msg}</p></div>'
    else:
        # If asset does not exist, inform the user.
        message = f'<div class="message error"><h4>Asset Not Found</h4><p>This device (S/N: {serial}) is not registered. Please add it to the system before sending metrics.</p></div>'

    return create_response_page(message)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "agent_ip": AGENT_IP,
        "agent_url": f"http://{AGENT_IP}:{AGENT_PORT}",
        "backend_url": BACKEND_API_URL,
        "serial_number": get_serial_number(),
        "timestamp": datetime.utcnow().isoformat()
    }

# --- Main Execution Block ---
if __name__ == "__main__":
    print("\n" + "="*60)
    print("ITAM SYSTEM - MONITORING AGENT")
    print("="*60)
    print(f"Starting server on port {AGENT_PORT}...")
    print(f"Backend: {BACKEND_API_URL}")
    
    # Detect IP before starting
    detected_ip = get_agent_ip()
    print(f"Detected IP: {detected_ip}")
    print(f"\nAccess agent UI at:")
    print(f"  Local:    http://localhost:{AGENT_PORT}")
    print(f"  Network:  http://{detected_ip}:{AGENT_PORT}")
    print(f"\nPress CTRL+C to stop the agent.")
    print("="*60 + "\n")
    
    uvicorn.run(app, host=AGENT_HOST, port=AGENT_PORT)