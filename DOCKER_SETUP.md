# ITAM System - Docker Setup Guide

This guide explains how to deploy the ITAM (IT Asset Management) system using Docker.

## 📋 Architecture Overview

The system consists of:
- **Backend**: FastAPI application (Port 8000) - Exposed to external traffic for agent connections
- **Frontend**: React application served by Nginx (Port 3000)
- **Agent**: Python script running directly on monitored devices (NOT containerized)

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd itam-system

# Create backend and frontend directories if not exist
mkdir -p backend frontend
```

### 2. Project Structure

```
itam-system/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── requirements.txt
│   ├── backend.py
│   ├── scanner_api_simple.py
│   └── ... (other backend files)
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   ├── package.json
│   ├── src/
│   └── ... (other frontend files)
└── agent/
    └── agent.py (runs directly on monitored machines)
```

### 3. Configuration

#### Backend Environment Variables (docker-compose.yml)

```yaml
environment:
  - MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/...
  - DATABASE_NAME=itam
  - SECRET_KEY=your-secret-key-here  # Generate with: openssl rand -hex 32
  - ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**⚠️ IMPORTANT**: Change the `SECRET_KEY` in production!

```bash
# Generate a secure secret key
openssl rand -hex 32
```

#### Frontend Environment Variables

Update `REACT_APP_API_URL` in docker-compose.yml to match your backend URL:
- Development: `http://localhost:8000`
- Production: `http://your-server-ip:8000` or `https://api.yourdomain.com`

### 4. Build and Run

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 5. Verify Deployment

```bash
# Check service status
docker-compose ps

# Test backend API
curl http://localhost:8000/api/health

# Test frontend
curl http://localhost:3000/health
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🖥️ Agent Setup (Not Containerized)

The monitoring agent runs directly on each monitored device (NOT in Docker).

### Install Agent on Monitored Devices

1. **Copy agent.py to the target machine**

```bash
# On the target machine
mkdir -p ~/itam-agent
cd ~/itam-agent

# Copy agent.py (via scp, USB, etc.)
scp user@server:/path/to/agent.py .
```

2. **Install Python dependencies**

```bash
pip install psutil httpx uvicorn fastapi
```

3. **Configure agent**

Edit `agent.py` and update the `BACKEND_API_URL`:

```python
BACKEND_API_URL = "http://<your-server-ip>:8000"  # Use Docker host IP
```

4. **Run agent**

```bash
python agent.py
```

The agent will:
- Start a web server on port 8081
- Send heartbeats to the backend every 30 seconds
- Provide live metrics endpoint for backend to query

5. **Access agent web UI**

Open browser to `http://localhost:8081` on the monitored device to register it.

### Agent Configuration Notes

- **Port 8000 on Backend**: Exposed with `0.0.0.0` binding to accept external connections from agents
- **Firewall**: Ensure port 8000 is accessible from agent machines
- **Security**: Use HTTPS and authentication in production

## 🔧 Docker Management Commands

### Start/Stop Services

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or rebuild specific service
docker-compose up -d --build backend
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## 🌐 Production Deployment

### 1. Security Enhancements

#### Update docker-compose.yml for production:

```yaml
services:
  backend:
    environment:
      - SECRET_KEY=${SECRET_KEY}  # Use environment variable
      - MONGODB_URL=${MONGODB_URL}
    restart: always
```

#### Create .env file (never commit this):

```bash
# .env
SECRET_KEY=your-generated-secret-key
MONGODB_URL=mongodb+srv://...
```

### 2. Use Reverse Proxy (Nginx/Traefik)

```nginx
# Example Nginx reverse proxy config
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Enable HTTPS

Use Let's Encrypt with Certbot or integrate with Traefik for automatic SSL.

### 4. Monitoring and Logging

```bash
# Enable logging to file
docker-compose logs -f > app.log 2>&1 &
```

Consider using:
- Prometheus + Grafana for metrics
- ELK stack for log aggregation
- Docker healthchecks (already configured)

## 🔍 Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. MongoDB connection failure - verify MONGODB_URL
# 2. Port 8000 already in use - change port mapping
# 3. Missing dependencies - rebuild: docker-compose build backend
```

### Frontend build fails

```bash
# Check Node version (needs 16+)
docker-compose build frontend

# If out of memory during build:
# Add to frontend Dockerfile: ENV NODE_OPTIONS="--max-old-space-size=4096"
```

### Agent can't connect to backend

```bash
# Verify backend is accessible
curl http://<server-ip>:8000/api/health

# Check firewall rules
sudo ufw allow 8000/tcp  # Ubuntu/Debian

# Verify Docker network binding
docker-compose exec backend netstat -tlnp | grep 8000
```

### MongoDB Atlas connection issues

1. Whitelist your server IP in MongoDB Atlas Network Access
2. Verify connection string format
3. Check if database name exists

## 📊 Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manual health check
curl http://localhost:8000/api/health  # Backend
curl http://localhost:3000/health       # Frontend
```

## 🔄 Backup and Restore

### Backup

MongoDB Atlas handles automatic backups. For additional safety:

```bash
# Backup volumes (if using local MongoDB)
docker run --rm -v itam_mongodb_data:/data -v $(pwd):/backup \
    alpine tar czf /backup/mongodb-backup.tar.gz -C /data .
```

### Restore

```bash
# Restore from backup
docker run --rm -v itam_mongodb_data:/data -v $(pwd):/backup \
    alpine tar xzf /backup/mongodb-backup.tar.gz -C /data
```

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Load Balancing

Use Nginx or Traefik to load balance between multiple backend instances.

## 🛠️ Development Mode

For development with hot-reload:

```yaml
# docker-compose.dev.yml
services:
  backend:
    command: uvicorn backend:app --host 0.0.0.0 --port 8000 --reload
    volumes:
      - ./backend:/app
    
  frontend:
    command: npm start
    volumes:
      - ./frontend:/app
      - /app/node_modules
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## 📝 Notes

- Backend port 8000 is exposed to `0.0.0.0` for external agent connections
- Frontend uses multi-stage build for optimized production image
- Agents run separately on each monitored device
- All sensitive data should use environment variables
- Regular backups of MongoDB are recommended

## 🆘 Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify configuration in docker-compose.yml
3. Check MongoDB Atlas connectivity
4. Review firewall rules for port 8000

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [React Production Build](https://create-react-app.dev/docs/production-build/)
