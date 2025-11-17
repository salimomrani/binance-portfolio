# Quick Start Guide: Crypto Portfolio Dashboard

**Feature**: 001-crypto-portfolio-dashboard
**Last Updated**: 2025-11-17

## Overview

This guide provides step-by-step instructions to set up and run the Crypto Portfolio Dashboard application locally for development.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js**: Version 20.x or higher ([Download](https://nodejs.org/))
- **Docker**: For running PostgreSQL and Redis ([Download](https://www.docker.com/get-started))
- **Docker Compose**: Included with Docker Desktop
- **Git**: For version control
- **npm** or **yarn**: Package manager (npm comes with Node.js)
- **Code Editor**: VS Code recommended

**Note**: PostgreSQL will run in Docker. You don't need to install PostgreSQL locally.

## Project Structure

```
binance-portfolio/
├── backend/          # Express.js API server
├── frontend/         # Angular application
├── specs/            # Feature specifications
├── .specify/         # Project configuration
└── docker-compose.yml # Docker services configuration
```

## Quick Start (Recommended)

### 1. Start Database Services with Docker

From the project root directory:

```bash
# Start PostgreSQL and Redis in Docker
docker-compose up -d

# Verify services are running
docker-compose ps

# You should see:
# - crypto-portfolio-db (postgres:15-alpine) - healthy
# - crypto-portfolio-redis (redis:7-alpine) - healthy
```

**Docker Compose provides**:
- PostgreSQL 15 on port 5432
- Redis 7 on port 6379
- Automatic health checks
- Data persistence via volumes

### 2. Configure Backend Environment

Navigate to backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration (Docker)
DATABASE_URL="postgresql://crypto_user:crypto_password_dev@localhost:5432/crypto_portfolio_dev"

# Redis Cache (Docker)
REDIS_URL="redis://localhost:6379"

# External API Keys (Binance)
BINANCE_API_KEY=your_binance_api_key_here
BINANCE_SECRET_KEY=your_binance_secret_key_here

# Alternative API Keys (Optional)
COINGECKO_API_KEY=your_coingecko_api_key_here

# Security
JWT_SECRET=your_jwt_secret_here_change_in_production
CORS_ORIGIN=http://localhost:4200

# Logging
LOG_LEVEL=debug
```

**Important**:
- Never commit `.env` to version control
- Use read-only API keys for security
- Database credentials match docker-compose.yml
- See `.env.example` for all available options

### 4. Run Database Migrations

The database is already running in Docker. Now set up the schema:

```bash
# Still in backend directory

# Generate Prisma client
npx prisma generate

# Run migrations to create database tables
npx prisma migrate dev

# Seed database with sample data (optional)
npx prisma db seed
```

### 5. Start Development Server

```bash
# Start backend server with hot reload
npm run dev

# Or without hot reload
npm start
```

The backend API will be available at `http://localhost:3000`

### 6. Verify Backend is Running

```bash
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {"success":true,"data":{"status":"healthy"},"timestamp":"2025-11-17T..."}
```

## Frontend Setup

### 1. Navigate to Frontend Directory

Open a new terminal window:

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  priceUpdateInterval: 60000, // 60 seconds
  enableDevTools: true
};
```

### 4. Start Development Server

```bash
# Start Angular development server
npm start

# Or with custom port
ng serve --port 4200
```

The frontend will be available at `http://localhost:4200`

### 5. Verify Frontend is Running

1. Open browser to `http://localhost:4200`
2. You should see the dashboard landing page
3. Check browser console for any errors

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- holdings.test.ts
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test
ng test --include='**/ portfolio.component.spec.ts'
```

## Obtaining API Keys

### Binance API Keys (Recommended)

1. Go to [Binance API Management](https://www.binance.com/en/my/settings/api-management)
2. Click "Create API"
3. Complete 2FA verification
4. Label: "Portfolio Tracker - Development"
5. **Important**: Enable only "Enable Reading" permission
6. **Never enable** trading, withdrawal, or internal transfer
7. Copy API Key and Secret Key to your `.env` file

### CoinGecko API (Alternative)

1. Go to [CoinGecko API](https://www.coingecko.com/en/api)
2. Sign up for free account
3. Navigate to Developer Dashboard
4. Copy API key to `.env` file
5. Free tier: 50 calls/minute

## Common Development Tasks

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services (keeps data)
docker-compose down

# Stop and remove all data
docker-compose down -v

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Check service health
docker-compose ps

# Restart a specific service
docker-compose restart postgres

# Execute commands in container
docker-compose exec postgres psql -U crypto_user -d crypto_portfolio_dev

# Optional: Start with pgAdmin (database GUI)
docker-compose --profile tools up -d
# Access pgAdmin at http://localhost:5050
# Email: admin@cryptoportfolio.local
# Password: admin
```

### Reset Database

```bash
cd backend

# Option 1: Using Prisma (recommended)
npx prisma migrate reset

# Option 2: Using Docker (complete reset)
cd ..
docker-compose down -v
docker-compose up -d
cd backend
npx prisma migrate dev
npx prisma db seed
```

### View Database in Prisma Studio

```bash
cd backend

# Open Prisma Studio (GUI for database)
npx prisma studio
```

Access at `http://localhost:5555`

**Alternative: Use pgAdmin**
```bash
# From project root
docker-compose --profile tools up -d

# Access at http://localhost:5050
# Add server connection:
# - Host: postgres (or host.docker.internal on Mac/Windows)
# - Port: 5432
# - User: crypto_user
# - Password: crypto_password_dev
# - Database: crypto_portfolio_dev
```

### Generate New Migration

```bash
cd backend

# After modifying schema.prisma
npx prisma migrate dev --name describe_your_changes
```

### Lint and Format Code

```bash
# Backend
cd backend
npm run lint
npm run format

# Frontend
cd frontend
npm run lint
ng lint --fix
```

### Build for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
# Output in frontend/dist/
```

## Project Scripts

### Backend Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | Start server | Run production server |
| `npm run dev` | Start with nodemon | Development with hot reload |
| `npm test` | Run Jest | Execute all tests |
| `npm run build` | Compile TypeScript | Build for production |
| `npm run lint` | ESLint | Check code quality |
| `npm run format` | Prettier | Format code |

### Frontend Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | ng serve | Start dev server |
| `npm test` | ng test | Run unit tests |
| `npm run build` | ng build | Production build |
| `npm run lint` | ng lint | Check code quality |
| `npm run build:prod` | ng build --configuration production | Optimized build |

## Troubleshooting

### Docker Issues

**Problem**: Docker services won't start

**Solutions**:
```bash
# Check Docker is running
docker --version
docker-compose --version

# View service logs
docker-compose logs

# Remove and recreate containers
docker-compose down
docker-compose up -d --force-recreate

# Check for port conflicts
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

**Problem**: "Port 5432 already in use"

**Solutions**:
```bash
# If you have PostgreSQL installed locally, stop it
brew services stop postgresql  # macOS
sudo systemctl stop postgresql # Linux

# Or change port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 on host instead

# Update DATABASE_URL in .env accordingly
DATABASE_URL="postgresql://crypto_user:crypto_password_dev@localhost:5433/crypto_portfolio_dev"
```

### Database Connection Issues

**Problem**: "Can't connect to PostgreSQL"

**Solutions**:
```bash
# Check Docker container is running
docker-compose ps

# Check container logs
docker-compose logs postgres

# Test connection from host
docker-compose exec postgres psql -U crypto_user -d crypto_portfolio_dev

# Verify DATABASE_URL in backend/.env matches docker-compose.yml
```

### Port Already in Use

**Problem**: "Port 3000 already in use"

**Solutions**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### API Key Errors

**Problem**: "Invalid API key" or "API rate limit exceeded"

**Solutions**:
1. Verify API keys are correct in `.env`
2. Check key permissions (should be read-only)
3. Wait if rate limit exceeded
4. Try alternative API (CoinGecko)

### Prisma Migration Issues

**Problem**: "Migration failed"

**Solutions**:
```bash
# Reset migrations
npx prisma migrate reset

# Clear shadow database
npx prisma migrate reset --skip-seed

# Manually fix in Prisma Studio
npx prisma studio
```

### Frontend Build Errors

**Problem**: TypeScript compilation errors

**Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Angular cache
rm -rf .angular

# Update Angular CLI
npm install -g @angular/cli@latest
```

## Development Workflow

### Recommended Order

1. **Start Docker Services**
   ```bash
   # From project root
   docker-compose up -d
   ```

2. **Start Backend**
   ```bash
   cd backend && npm run dev
   ```

3. **In New Terminal: Start Frontend**
   ```bash
   cd frontend && npm start
   ```

4. **In New Terminal: Run Tests (Optional)**
   ```bash
   cd backend && npm run test:watch
   ```

5. **Open Browser**
   - Navigate to `http://localhost:4200`
   - Open DevTools (F12)

### Hot Reload

Both backend and frontend support hot reload:
- **Backend**: Nodemon restarts server on file changes
- **Frontend**: Angular CLI rebuilds and refreshes browser

### Debugging

**Backend (VS Code)**:
1. Set breakpoints in `.ts` files
2. Run "Debug Backend" configuration
3. Or attach to running process

**Frontend (Chrome DevTools)**:
1. Open DevTools (F12)
2. Go to Sources tab
3. Set breakpoints in TypeScript files
4. Angular source maps enabled by default

## Next Steps

After successful setup:

1. **Explore the API**: Open `specs/001-crypto-portfolio-dashboard/contracts/openapi.yaml` in Swagger Editor
2. **Review Data Model**: Read `specs/001-crypto-portfolio-dashboard/data-model.md`
3. **Check Constitution**: Understand project principles in `.specify/memory/constitution.md`
4. **Read Implementation Plan**: Review `specs/001-crypto-portfolio-dashboard/plan.md`
5. **Start Development**: Create your first portfolio via the UI

## Useful Resources

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Angular Docs](https://angular.io/docs)
- [NgRx Docs](https://ngrx.io/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

### API References
- [Binance API Docs](https://binance-docs.github.io/apidocs/)
- [CoinGecko API Docs](https://www.coingecko.com/en/api/documentation)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Swagger Editor](https://editor.swagger.io/) - OpenAPI visualization

## Support

For issues or questions:
1. Check this troubleshooting guide
2. Review project documentation in `specs/`
3. Check existing GitHub issues
4. Create new issue with detailed description

## Quick Reference Commands

```bash
# Start Docker services (from project root)
docker-compose up -d

# Stop Docker services
docker-compose down

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm start

# Run all tests
cd backend && npm test
cd frontend && npm test

# Reset database (Option 1: Prisma)
cd backend && npx prisma migrate reset

# Reset database (Option 2: Docker)
docker-compose down -v && docker-compose up -d

# View database in Prisma Studio
cd backend && npx prisma studio

# View database in pgAdmin
docker-compose --profile tools up -d
# Access at http://localhost:5050

# Check Docker services
docker-compose ps

# View Docker logs
docker-compose logs -f postgres

# Build for production
cd backend && npm run build
cd frontend && npm run build
```

---

**Happy Coding! 🚀**
