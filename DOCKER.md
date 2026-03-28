# Docker Development Setup

This guide explains how to set up and run the Node.js/TypeScript REST API using Docker with Redis and external database support.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Environment                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   App Container │  │  Redis Stack     │  │  Redis Insight    │  │
│  │   (Node.js)     │  │   Server         │  │   (Web GUI)      │  │
│  │                 │  │                 │  │                 │  │
│  │ • Hot Reload     │  │ • In-Memory     │  │ • Data Browser   │  │
│  │ • Volume Mount   │  │ • Data         │  │ • Search         │  │
│  │ • Dev Tools      │  │ • Port 6379     │  │ • CLI Access    │  │
│  │ • Port 8000      │  │                 │  │ • Port 8001     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Docker Network (bridge)                      │ │
│  │         ↳ External Database (Neon/AWS RDS)                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed and running
- External PostgreSQL database (Neon/AWS RDS)
- Gmail account (for email service)

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Update .env with your configuration:
# DATABASE_URL="postgresql://user:pass@your-neon-db-url.neon.tech/dbname?schema=public&sslmode=require"
# SMTP_HOST=smtp.gmail.com
# SMTP_USERNAME=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# JWT_SECRET=your-secure-secret
```

### 2. Start Development Environment

```bash
# Option 1: Using the setup script (recommended)
chmod +x scripts/docker-dev-setup.sh
./scripts/docker-dev-setup.sh

# Option 2: Manual setup
npm run docker:dev-build
npm run docker:dev
```

### 3. Verify Setup

```bash
# Check API health
curl http://localhost:8000/v1/health

# Check email service health
curl http://localhost:8000/v1/health/email

# Check Redis connection
docker exec redis-dev redis-cli ping

# Access Redis Insight GUI
# Open http://localhost:8001 in your browser
```

## 📋 Available Commands

### Development Commands

```bash
# Build development images
npm run docker:dev-build

# Start development environment (with hot reload)
npm run docker:dev

# Access Redis Insight
npm run docker:redis-insight

# Access Redis CLI
npm run docker:redis-cli

# View logs
npm run docker:dev-logs

# Stop development environment
npm run docker:dev-down
```

### Production Commands

```bash
# Build production images
npm run docker:prod-build

# Start production environment
npm run docker:prod

# Start production with tools (Redis Insight)
npm run docker:prod-tools

# Stop production environment
npm run docker:prod-down
```

### Redis Management with Redis Insight

```bash
# Access Redis Insight
# Open http://localhost:8001 in your browser
npm run docker:redis-insight

# Access Redis CLI
npm run docker:redis-cli

# Connect to Redis directly
docker exec -it redis-dev redis-cli

# Monitor Redis in real-time
docker exec -it redis-dev redis-cli MONITOR

# Check Redis info
docker exec -it redis-dev redis-cli INFO

# View Redis Insight features:
# - Data browser with search capabilities
# - Real-time analytics and monitoring
# - CLI access directly from the web interface
# - Memory usage analysis
# - Slow log analysis
```

## 🔧 Configuration

### Environment Variables

| Variable         | Description         | Development         | Production          |
| ---------------- | ------------------- | ------------------- | ------------------- |
| `DATABASE_URL`   | External PostgreSQL | Your Neon URL       | Your AWS RDS URL    |
| `REDIS_HOST`     | Redis host          | `redis` (container) | `redis` (container) |
| `REDIS_PORT`     | Redis port          | `6379`              | `6379`              |
| `REDIS_PASSWORD` | Redis password      | (none)              | (none)              |
| `REDIS_DB`       | Redis database      | `0`                 | `0`                 |
| `JWT_SECRET`     | JWT signing key     | Any secure string   | Any secure string   |

## 🚀 Redis Stack with Redis Insight

### **Architecture:**

- **Redis Stack Server**: Redis with additional modules (JSON, Search, Time Series, etc.)
- **Redis Insight**: Separate container providing the web GUI
- **Connection**: Redis Insight connects to Redis Stack Server via Docker network

### **Redis Insight Features:**

- **🔍 Advanced Data Browser** - Visualize all Redis data types
- **🔎 Search Functionality** - Search across keys and values
- **📊 Real-time Analytics** - Monitor performance metrics
- **🛠️ CLI Access** - Run Redis commands directly in browser
- **📈 Memory Analysis** - Track memory usage and fragmentation
- **⚡ Slow Log Analysis** - Identify performance bottlenecks
- **🔧 Configuration Management** - Edit Redis settings via GUI

### **Redis Stack vs Basic Redis:**

- ✅ **All Redis features** (Strings, Lists, Sets, Hashes, etc.)
- ✅ **Redis Modules** (JSON, Search, Time Series, Graph, etc.)
- ✅ **Enhanced Performance** (optimized binaries)
- ✅ **Separate GUI** (Redis Insight in dedicated container)

### **Access Methods:**

- **Web Interface**: `http://localhost:8001`
- **CLI**: `npm run docker:redis-cli`
- **Direct Connection**: `docker exec -it redis-dev redis-cli`
  | `SMTP_HOST` | Email server | `smtp.gmail.com` | `smtp.gmail.com` |

### Database Setup

#### Neon (Development)

1. Create account at [neon.tech](https://neon.tech)
2. Create new PostgreSQL project
3. Copy connection string to `DATABASE_URL`

#### AWS RDS (Production)

1. Create RDS PostgreSQL instance
2. Configure security groups
3. Update `DATABASE_URL` with RDS endpoint

### Email Setup (Gmail)

1. Enable 2FA on your Gmail account
2. Generate App Password at [Google Account Settings](https://myaccount.google.com/apppasswords)
3. Update SMTP variables in `.env`

## 🔥 Hot Reload Features

- **Code Changes**: Automatic restart when source files change
- **Dependency Changes**: Rebuild when package.json changes
- **Environment Changes**: Restart when .env changes
- **Volume Mounting**: Live sync of source code

## 📊 Service Health

### Health Endpoints

- `GET /v1/health` - Overall service health
- `GET /v1/health/email` - Email service health
- `GET /v1/health/database` - Database connectivity
- `GET /v1/health/cache` - Redis connectivity

### Monitoring

```bash
# View all service logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f node-app
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f redis

# Check service status
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Test connection from container
docker exec node-app-dev npm run db:push
```

#### 2. Redis Connection Failed

```bash
# Check Redis container
docker exec redis-dev redis-cli ping

# Check Redis logs
docker logs redis-dev
```

#### 3. Email Service Failed

```bash
# Check email configuration
curl http://localhost:8000/v1/health/email

# Verify SMTP credentials
# Check Gmail App Password setup
```

#### 4. Hot Reload Not Working

```bash
# Check volume mounts
docker inspect node-app-dev | grep -A 10 "Mounts"

# Restart development environment
npm run docker:dev-down && npm run docker:dev
```

### Reset Environment

```bash
# Stop all services
npm run docker:dev-down

# Remove containers and volumes
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# Rebuild and start
npm run docker:dev-build && npm run docker:dev
```

## 🚀 Production Deployment

### 1. Build Production Image

```bash
npm run docker:prod-build
```

### 2. Deploy to Production

```bash
# Update .env with production values
# DATABASE_URL=your-aws-rds-url
# NODE_ENV=production

# Start production environment
npm run docker:prod
```

### 3. Production Monitoring

```bash
# Check production logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Monitor resource usage
docker stats
```

## 📁 File Structure

```
├── docker-compose.yml          # Base configuration
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.prod.yml     # Production overrides
├── Dockerfile                   # Multi-stage build
├── .dockerignore               # Docker ignore file
├── docker/
│   └── redis.conf              # Redis configuration
├── scripts/
│   └── docker-dev-setup.sh    # Setup script
└── DOCKER.md                   # This documentation
```

## 🔄 Development Workflow

1. **Make Changes**: Edit source code
2. **Auto Reload**: Container automatically restarts
3. **Test Changes**: Use health endpoints to verify
4. **Debug**: Check logs for any issues
5. **Commit**: Git integration works normally

## 📞 Support

For issues with:

- **Docker**: Check Docker Desktop logs
- **Database**: Verify external database connectivity
- **Email**: Check SMTP configuration
- **Redis**: Verify container health

## 🎯 Best Practices

- Use external database (Neon/AWS RDS) for persistence
- Keep Redis for caching and sessions only
- Use environment-specific configurations
- Monitor health endpoints regularly
- Use proper secrets management in production
