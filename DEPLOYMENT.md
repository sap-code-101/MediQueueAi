# MediQueueAI Deployment Guide

## Required Environment Variables

### JWT_SECRET (Required)
- **Purpose**: Secret key for signing JWT authentication tokens
- **Generate**: `openssl rand -hex 32`
- **Example**: `a7f3b8c2e9d4f1a8c5e2b9f7d3a6c8e1b4f7a2d9c5e8b1f4a7d2c9e6b3f8a5d1`

## Environment Setup

### Development
```bash
# Backend
cd backend
bun install
bun run dev

# Frontend (new terminal)
cd frontend
bun install
bun run start
```

### Production (Docker) - Recommended
```bash
# Set secure JWT secret
export JWT_SECRET=$(openssl rand -hex 32)

# Build and run
docker compose up --build -d

# View logs
docker compose logs -f mediqueueai
```

### Production (Railway)
```bash
railway login
railway init
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway up
```

### Production (Heroku)
```bash
heroku create mediqueueai-app
heroku stack:set container
heroku config:set JWT_SECRET=$(openssl rand -hex 32)
git push heroku main
```

### Production (Render)
1. Connect your GitHub repository
2. Add environment variable: `JWT_SECRET`
3. Deploy automatically on push

## No External API Keys Required

MediQueueAI runs completely standalone without external API dependencies.

## Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| Backend | 5000 | Express API server |

## Health Check

The backend provides a health check endpoint:
```bash
curl http://localhost:5000/api/doctors
```

## Database

SQLite database is created automatically on first run. Data persists in Docker volumes:
- `mediqueueai_db` - SQLite database
- `mediqueueai_models` - ML trained models
- `mediqueueai_uploads` - File uploads
