# 🚀 Production Deployment Guide

This guide covers deploying the **Sandbox-v0** frontend and **MCP Server** to production using Docker.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DOCKER HUB                               │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  laksanadika/sandbox │    │  laksanadika/mcp-server  │   │
│  └──────────────────────┘    └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                    │                      │
                    ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION SERVER                        │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  sandbox-v0          │◄──►│  mcp-server              │   │
│  │  (frontend + express)│HTTP│  (Google/Zoom APIs)      │   │
│  │  Port: 3000          │    │  Port: 3001              │   │
│  └──────────────────────┘    └──────────────────────────┘   │
│                                                              │
│  docker-compose up -d                                        │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. Docker and Docker Compose installed on your server
2. Docker Hub account (laksanadika)
3. Google OAuth credentials
4. Zoom Server-to-Server OAuth credentials (optional)

---

## Step 1: Build and Push Docker Images

### 1.1 Build & Push MCP Server

```bash
cd /path/to/mcp-server

# Build the image
docker build -t laksanadika/mcp-server:latest .

# Push to Docker Hub
docker push laksanadika/mcp-server:latest
```

### 1.2 Build & Push Sandbox Frontend

```bash
cd /path/to/sandbox-v0

# Build the image
docker build -t laksanadika/sandbox:latest .

# Push to Docker Hub
docker push laksanadika/sandbox:latest
```

---

## Step 2: Prepare Production Server

### 2.1 Create deployment directory

```bash
mkdir -p ~/app
cd ~/app
```

### 2.2 Copy docker-compose.yml

Copy `docker-compose.yml` from this repo to your server:

```bash
scp docker-compose.yml user@your-server:~/app/
```

### 2.3 Create environment file

Create `mcp.env` with your credentials:

```bash
# mcp.env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Zoom (optional)
ZOOM_ACCOUNT_ID=your-zoom-account-id
ZOOM_CLIENT_ID=your-zoom-client-id
ZOOM_CLIENT_SECRET=your-zoom-client-secret
```

### 2.4 Copy tokens.json (if exists)

If you have already authenticated with Google locally, copy `tokens.json`:

```bash
scp tokens.json user@your-server:~/app/
```

---

## Step 3: Deploy

### 3.1 Pull latest images

```bash
docker-compose pull
```

### 3.2 Start services

```bash
docker-compose up -d
```

### 3.3 Check status

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f

# Check health
curl http://localhost:3000/api/health
curl http://localhost:3001/mcp/health
```

---

## Step 4: First-time Google Authentication

If you don't have `tokens.json`, you need to authenticate:

### Option A: Authenticate locally and copy tokens

1. Run MCP server locally with stdio:
   ```bash
   cd mcp-server
   npm run dev
   ```

2. Use the auth helper:
   ```bash
   npm run auth
   ```

3. Copy the generated `tokens.json` to production server

### Option B: Authenticate on server (requires browser access)

1. SSH with port forwarding:
   ```bash
   ssh -L 3001:localhost:3001 user@your-server
   ```

2. Access auth URL in your browser

---

## Updating Deployments

### Update single service

```bash
# Pull latest image
docker-compose pull mcp-server

# Restart service
docker-compose up -d mcp-server
```

### Update all services

```bash
docker-compose pull
docker-compose up -d
```

---

## Troubleshooting

### Check logs

```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f mcp-server
docker-compose logs -f sandbox
```

### Restart services

```bash
docker-compose restart
```

### Reset everything

```bash
docker-compose down
docker-compose up -d
```

### View container details

```bash
docker-compose ps
docker inspect mcp-server
```

---

## Environment Variables

### MCP Server

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_TRANSPORT` | Transport mode (stdio/http) | `http` |
| `MCP_HTTP_PORT` | HTTP server port | `3001` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Required |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Required |
| `ZOOM_ACCOUNT_ID` | Zoom account ID | Optional |
| `ZOOM_CLIENT_ID` | Zoom client ID | Optional |
| `ZOOM_CLIENT_SECRET` | Zoom client secret | Optional |

### Sandbox Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `MCP_TRANSPORT` | Transport mode | `http` |
| `MCP_SERVER_URL` | MCP server URL | `http://mcp-server:3001` |

---

## Local Development

For local development, you can run without Docker:

```bash
# Terminal 1: Start MCP Server (HTTP mode)
cd mcp-server
npm run dev -- --http

# Terminal 2: Start Sandbox
cd sandbox-v0
MCP_TRANSPORT=http MCP_SERVER_URL=http://localhost:3001 npm run dev
```

Or use stdio mode (no MCP_TRANSPORT env var):

```bash
cd sandbox-v0
npm run dev  # Uses stdio by default
```
