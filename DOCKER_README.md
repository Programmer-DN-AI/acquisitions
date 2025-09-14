# 🐳 Acquisitions API - Docker Setup Guide

Complete guide for dockerizing your Node.js application with Neon Database support for both development and production environments.

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [⚙️ Prerequisites](#️-prerequisites)
- [🚀 Development Setup (Neon Local)](#-development-setup-neon-local)
- [🏗️ Production Deployment (Neon Cloud)](#️-production-deployment-neon-cloud)
- [🐛 Troubleshooting](#-troubleshooting)
- [📖 Additional Resources](#-additional-resources)

---

## 🎯 Overview

This setup provides two distinct Docker environments:

- **Development**: Uses **Neon Local** via Docker for ephemeral database branches
- **Production**: Connects directly to **Neon Cloud Database**

### Architecture

```
Development:
┌─────────────────┐    ┌─────────────────┐
│   App Container │────│ Neon Local      │
│   (your code)   │    │ (proxy)         │
└─────────────────┘    └─────────────────┘
                              │
                        ┌─────────────────┐
                        │   Neon Cloud    │
                        │   (main branch) │
                        └─────────────────┘

Production:
┌─────────────────┐
│   App Container │─────────────┐
│   (your code)   │             │
└─────────────────┘             │
                        ┌─────────────────┐
                        │   Neon Cloud    │
                        │   (production)  │
                        └─────────────────┘
```

---

## ⚙️ Prerequisites

### Required Software

- **Docker Desktop** (latest version)
- **Docker Compose** v3.8+
- **Git** (for branch-based development)

### Required Neon Configuration

1. **Neon Console Access**: https://console.neon.tech
2. **API Key**: Generate from Neon Console → Account Settings → Developer Settings
3. **Project ID**: Found in Project Settings → General
4. **Branch ID**: Your main branch ID (usually called "main")

---

## 🚀 Development Setup (Neon Local)

### Step 1: Configure Environment

Copy and configure your development environment:

```bash
# Copy the development environment template
cp .env.development .env.development.local

# Edit with your actual Neon credentials
# Get these from: https://console.neon.tech
```

Edit `.env.development.local`:

```env
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Database connects to Neon Local proxy
DATABASE_URL=postgres://neon:npg@neon-local:5432/neondb?sslmode=require

# JWT secret for development (change this!)
JWT_SECRET=your-super-secret-jwt-key-for-development

# Neon credentials (get from console.neon.tech)
NEON_API_KEY=neon_api_1A2B3C4D5E6F...
NEON_PROJECT_ID=proj-abc-123
PARENT_BRANCH_ID=br-main-456

# Development Arcjet key
ARCJET_KEY=ajkey_dev_placeholder
```

### Step 2: Start Development Environment

```bash
# Build and start development stack
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up --build

# Or run in detached mode
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up -d --build
```

### What Happens:

1. **Neon Local Container** starts and creates an ephemeral branch from your main branch
2. **App Container** connects to the local database proxy
3. **Hot Reload** enabled - your code changes are reflected immediately
4. **Fresh Database** every restart (ephemeral branches are deleted when stopped)

### Step 3: Verify Development Setup

```bash
# Check container status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f app
docker-compose -f docker-compose.dev.yml logs -f neon-local

# Test the API
curl http://localhost:3000/health
curl http://localhost:3000/api
```

### Step 4: Development Workflow

```bash
# Stop services
docker-compose -f docker-compose.dev.yml down

# Restart with fresh database
docker-compose -f docker-compose.dev.yml up -d

# View real-time logs
docker-compose -f docker-compose.dev.yml logs -f

# Clean up everything (remove volumes)
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🏗️ Production Deployment (Neon Cloud)

### Step 1: Configure Production Environment

Create production environment configuration:

```bash
# Copy production template
cp .env.production .env.production.local

# Edit with your production values
```

Edit `.env.production.local`:

```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Production Neon Cloud Database URL
DATABASE_URL=postgresql://username:password@ep-cool-proj-a1b2c3d4.us-east-1.aws.neon.tech/mydb?sslmode=require

# Strong JWT secret (generate with: openssl rand -base64 32)
JWT_SECRET=super-secure-production-jwt-secret-32-chars-long

# Production Arcjet key
ARCJET_KEY=ajkey_01your_production_key_here
```

### Step 2: Deploy to Production

```bash
# Build and start production
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d --build

# Check deployment status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f app
```

### Step 3: Production Management

```bash
# View logs
docker logs acquisitions-app-prod --tail 100 -f

# Health check
curl http://localhost:3000/health

# Update deployment
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build

# Scale (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale app=2
```

### Production Considerations

- **Resource Limits**: Set in `docker-compose.prod.yml`
- **Health Checks**: Automatic container restart on failure
- **Logging**: JSON format with rotation
- **Security**: Production-optimized Docker image

---

## 🔧 Advanced Configuration

### Environment-Specific Database Configuration

The app automatically detects the environment and configures database connections:

**Development (Neon Local)**:

```javascript
// src/config/database.js detects NODE_ENV=development
// Connects to: postgres://neon:npg@neon-local:5432/neondb
```

**Production (Neon Cloud)**:

```javascript
// src/config/database.js detects NODE_ENV=production
// Connects to: your production DATABASE_URL
```

### Persistent Development Branches

To persist database branches across restarts, uncomment in `docker-compose.dev.yml`:

```yaml
volumes:
  - ./.neon_local/:/tmp/.neon_local
  - ./.git/HEAD:/tmp/.git/HEAD:ro,consistent
```

This creates a persistent branch per Git branch.

### Custom Docker Builds

Build specific targets:

```bash
# Development build
docker build --target development -t acquisitions:dev .

# Production build
docker build --target production -t acquisitions:prod .
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Neon Local connection failed"

**Problem**: App can't connect to Neon Local proxy

**Solution**:

```bash
# Check Neon Local container status
docker-compose -f docker-compose.dev.yml logs neon-local

# Verify environment variables
docker-compose -f docker-compose.dev.yml exec neon-local env | grep NEON

# Restart with fresh containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

#### 2. "Invalid API credentials"

**Problem**: NEON_API_KEY or NEON_PROJECT_ID incorrect

**Solution**:

- Verify credentials at https://console.neon.tech
- Check API key format: `neon_api_1A2B3C4D...`
- Ensure project ID format: `proj-abc-123`

#### 3. "Database connection timeout"

**Problem**: Production DATABASE_URL incorrect

**Solution**:

```bash
# Test connection string
docker run --rm postgres:15 psql "your-database-url" -c "SELECT 1;"

# Check production logs
docker-compose -f docker-compose.prod.yml logs app
```

#### 4. "Permission denied" errors

**Problem**: File permissions in container

**Solution**:

```bash
# Fix Windows file permissions
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

#### 5. Hot reload not working

**Problem**: Code changes not reflected

**Solution**:

```bash
# Ensure volumes are mounted correctly
docker-compose -f docker-compose.dev.yml config

# Rebuild development image
docker-compose -f docker-compose.dev.yml build --no-cache app
```

### Debugging Commands

```bash
# Enter running container
docker-compose -f docker-compose.dev.yml exec app sh

# Check database connection
docker-compose -f docker-compose.dev.yml exec app node -e "
const { sql } = require('./src/config/database.js');
sql\`SELECT version()\`.then(console.log).catch(console.error);
"

# View all environment variables
docker-compose -f docker-compose.dev.yml exec app env

# Check container resource usage
docker stats acquisitions-app-dev
```

---

## 📖 Additional Resources

### Neon Local Documentation

- **Official Guide**: https://neon.com/docs/local/neon-local
- **API Reference**: https://neon.com/docs/reference/api-reference
- **Branching Guide**: https://neon.com/docs/guides/branching

### Docker Best Practices

- **Multi-stage builds**: Optimized image size
- **Non-root user**: Security hardening
- **Health checks**: Container monitoring
- **Resource limits**: Production stability

### Development Workflow

1. **Feature Development**: Use ephemeral branches via Neon Local
2. **Integration Testing**: Test with production-like database
3. **Deployment**: Deploy to production with Neon Cloud

---

## 🚀 Quick Reference Commands

### Development

```bash
# Start development
docker-compose -f docker-compose.dev.yml --env-file .env.development.local up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop development
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Deploy production
docker-compose -f docker-compose.prod.yml --env-file .env.production.local up -d

# Check health
curl http://localhost:3000/health

# Update deployment
docker-compose -f docker-compose.prod.yml up -d --build
```

### Utilities

```bash
# Clean up all containers and volumes
docker system prune -a --volumes

# Build without cache
docker-compose -f docker-compose.dev.yml build --no-cache

# Export production logs
docker-compose -f docker-compose.prod.yml logs --no-color > app.log
```

---

**Happy Dockerizing! 🐳**

For issues or questions, check the troubleshooting section or refer to the Neon documentation.
