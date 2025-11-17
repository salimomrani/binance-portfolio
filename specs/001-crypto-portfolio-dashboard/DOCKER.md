# Docker Setup Guide

This document explains the Docker setup for the Crypto Portfolio Dashboard application.

## Overview

The application uses Docker Compose to run PostgreSQL and Redis in development. This ensures:
- **Consistent environments** across all developers
- **Easy setup** with a single command
- **Isolation** from system-installed databases
- **Production parity** by matching exact versions

## Services

### PostgreSQL 15
- **Image**: `postgres:15-alpine`
- **Port**: 5432
- **Database**: `crypto_portfolio_dev`
- **User**: `crypto_user`
- **Password**: `crypto_password_dev` (development only)
- **Health checks**: Automatic readiness verification

### Redis 7
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Persistence**: Append-only file (AOF) enabled
- **Health checks**: Ping every 10 seconds

### pgAdmin (Optional)
- **Image**: `dpage/pgadmin4:latest`
- **Port**: 5050
- **Email**: `admin@cryptoportfolio.local`
- **Password**: `admin`
- **Usage**: Start with `--profile tools` flag

## Getting Started

### 1. Start Services

```bash
# From project root
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Verify Services

```bash
# PostgreSQL health
docker-compose exec postgres pg_isready -U crypto_user

# Redis health
docker-compose exec redis redis-cli ping

# Both should return "PONG" or success message
```

### 3. Connect to Database

```bash
# Using psql from container
docker-compose exec postgres psql -U crypto_user -d crypto_portfolio_dev

# Using Prisma Studio (from backend directory)
cd backend && npx prisma studio

# Using pgAdmin (optional)
docker-compose --profile tools up -d
# Access at http://localhost:5050
```

## Common Commands

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services (keeps data)
docker-compose down

# Restart a service
docker-compose restart postgres

# View service logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Check service status
docker-compose ps
```

### Data Management

```bash
# Backup database
docker-compose exec postgres pg_dump -U crypto_user crypto_portfolio_dev > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U crypto_user -d crypto_portfolio_dev

# Reset all data (destructive!)
docker-compose down -v
docker-compose up -d
```

### Troubleshooting

```bash
# View all container logs
docker-compose logs

# Check container details
docker-compose exec postgres env

# Execute arbitrary commands
docker-compose exec postgres /bin/sh

# Force recreate containers
docker-compose up -d --force-recreate
```

## Configuration

### Environment Variables

Database connection is configured in `backend/.env`:

```env
DATABASE_URL="postgresql://crypto_user:crypto_password_dev@localhost:5432/crypto_portfolio_dev"
REDIS_URL="redis://localhost:6379"
```

### Port Conflicts

If ports 5432 or 6379 are already in use:

**Option 1: Stop conflicting services**
```bash
# macOS
brew services stop postgresql
brew services stop redis

# Linux
sudo systemctl stop postgresql
sudo systemctl stop redis
```

**Option 2: Change ports in docker-compose.yml**
```yaml
services:
  postgres:
    ports:
      - "5433:5432"  # Use 5433 on host
  redis:
    ports:
      - "6380:6379"  # Use 6380 on host
```

Then update `backend/.env`:
```env
DATABASE_URL="postgresql://crypto_user:crypto_password_dev@localhost:5433/crypto_portfolio_dev"
REDIS_URL="redis://localhost:6380"
```

### Custom Configuration

Edit `docker-compose.yml` to customize:
- Database credentials (POSTGRES_USER, POSTGRES_PASSWORD)
- Resource limits (memory, CPU)
- Volume locations
- Network settings

## Data Persistence

Data is stored in Docker volumes:
- `postgres_data`: Database files
- `redis_data`: Redis persistence files
- `pgadmin_data`: pgAdmin configuration (if using)

**Location**: Docker manages volume storage. To find the actual path:
```bash
docker volume inspect binance-portfolio_postgres_data
```

**Backup volumes**:
```bash
# Create backup
docker run --rm -v binance-portfolio_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore backup
docker run --rm -v binance-portfolio_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## Using pgAdmin

pgAdmin provides a web-based database management interface.

### Start pgAdmin

```bash
docker-compose --profile tools up -d
```

Access at `http://localhost:5050`
- Email: `admin@cryptoportfolio.local`
- Password: `admin`

### Add Server Connection

1. Click "Add New Server"
2. General tab:
   - Name: `Crypto Portfolio Dev`
3. Connection tab:
   - Host: `postgres` (or `host.docker.internal` on Mac/Windows)
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `crypto_user`
   - Password: `crypto_password_dev`
   - Save password: ✓

### Stop pgAdmin

```bash
docker-compose --profile tools down
```

## Production Considerations

**Do NOT use this Docker setup in production**. Instead:

1. **Managed Database Services**:
   - AWS RDS PostgreSQL
   - Heroku Postgres
   - DigitalOcean Managed Databases
   - Google Cloud SQL

2. **Managed Redis**:
   - Redis Cloud
   - AWS ElastiCache
   - Heroku Redis

3. **Security**:
   - Change default passwords
   - Use secrets management (AWS Secrets Manager, etc.)
   - Enable SSL/TLS connections
   - Restrict network access

4. **Scaling**:
   - Read replicas for PostgreSQL
   - Redis cluster for high availability
   - Automated backups
   - Monitoring and alerting

## Docker Compose File Explained

```yaml
version: '3.8'  # Docker Compose file format version

services:
  postgres:
    image: postgres:15-alpine  # Lightweight PostgreSQL image
    container_name: crypto-portfolio-db  # Custom container name
    restart: unless-stopped  # Auto-restart on failure
    environment:  # Database configuration
      POSTGRES_USER: crypto_user
      POSTGRES_PASSWORD: crypto_password_dev
      POSTGRES_DB: crypto_portfolio_dev
      PGDATA: /var/lib/postgresql/data/pgdata  # Data location
    ports:
      - "5432:5432"  # Host:Container port mapping
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Persistent storage
    healthcheck:  # Automatic health monitoring
      test: ["CMD-SHELL", "pg_isready -U crypto_user"]
      interval: 10s  # Check every 10 seconds
      timeout: 5s
      retries: 5
    networks:
      - crypto-portfolio-network  # Custom network

  redis:
    image: redis:7-alpine
    container_name: crypto-portfolio-redis
    restart: unless-stopped
    command: redis-server --appendonly yes  # Enable persistence
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - crypto-portfolio-network

volumes:
  postgres_data:  # Named volume for PostgreSQL data
    driver: local
  redis_data:  # Named volume for Redis data
    driver: local

networks:
  crypto-portfolio-network:  # Custom bridge network
    driver: bridge
```

## FAQ

**Q: Why Docker instead of installing PostgreSQL locally?**
A: Docker ensures everyone uses the same PostgreSQL version and configuration, eliminating "works on my machine" issues.

**Q: Will data persist if I restart my computer?**
A: Yes, data is stored in Docker volumes which persist across restarts.

**Q: Can I use a different PostgreSQL version?**
A: Yes, change the image tag in docker-compose.yml (e.g., `postgres:14-alpine`).

**Q: How do I access the database from outside Docker?**
A: Use `localhost:5432` from your host machine. The backend connects this way.

**Q: What if I already have PostgreSQL installed?**
A: Either stop your local PostgreSQL or change the Docker port mapping to avoid conflicts.

**Q: How much disk space do Docker volumes use?**
A: Minimal initially (< 100MB), grows with data. Monitor with `docker system df`.

**Q: Can I use this for multiple projects?**
A: Yes, but change container names and ports in docker-compose.yml to avoid conflicts.

## Best Practices

1. **Always start Docker before backend**
   ```bash
   docker-compose up -d
   cd backend && npm run dev
   ```

2. **Check health before debugging**
   ```bash
   docker-compose ps  # All services should show "healthy"
   ```

3. **View logs for errors**
   ```bash
   docker-compose logs -f postgres  # Real-time logs
   ```

4. **Regular cleanup**
   ```bash
   docker system prune  # Remove unused containers/images
   ```

5. **Backup before major changes**
   ```bash
   docker-compose exec postgres pg_dump -U crypto_user crypto_portfolio_dev > backup.sql
   ```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)

---

**Need help?** Check the [Troubleshooting section](./quickstart.md#troubleshooting) in the Quick Start Guide.
