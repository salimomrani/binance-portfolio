# Prisma Client Setup Guide

## Overview

This document explains how to set up and generate the Prisma client for the Crypto Portfolio backend. The Prisma client provides type-safe database access and must be generated before the application can run.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Internet connection (for downloading Prisma engines)
- `.env` file with `DATABASE_URL` configured

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env and set DATABASE_URL to your PostgreSQL connection string

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma migrate dev

# 5. Seed database (optional)
npx prisma db seed
```

## Prisma Client Generation

### What is Prisma Client?

Prisma Client is an auto-generated, type-safe query builder that:
- Provides TypeScript types for all database models
- Enables autocomplete for database queries
- Prevents SQL injection attacks
- Validates queries at compile-time

### How Generation Works

When you run `npx prisma generate`:

1. Prisma reads `prisma/schema.prisma`
2. Generates TypeScript types for all models
3. Downloads the Prisma query engine binary (platform-specific)
4. Saves generated code to `node_modules/.prisma/client`
5. Saves generated types to `node_modules/@prisma/client`

### Generated Types

After generation, you can import types like:

```typescript
import { PrismaClient, Portfolio, Holding, Transaction, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

// Type-safe queries
const portfolio: Portfolio = await prisma.portfolio.findUnique({
  where: { id: 'portfolio-123' }
});

const holdings: Holding[] = await prisma.holding.findMany({
  where: { portfolioId: portfolio.id }
});
```

## Common Issues and Solutions

### Issue 1: Network Errors During Generation

**Error Message**:
```
Error: Failed to fetch sha256 checksum at https://binaries.prisma.sh/.../libquery_engine.so.node.sha256 - 403 Forbidden
```

**Cause**: Network connectivity issues or firewall blocking Prisma binary download

**Solution 1 - Skip Checksum Validation**:
```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
```

**Solution 2 - Use Environment Variable Permanently**:
```bash
# Add to .env
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
```

**Solution 3 - Use Custom Binary Location**:
```bash
# Download binary manually and set path
export PRISMA_QUERY_ENGINE_BINARY=/path/to/engine
npx prisma generate
```

### Issue 2: "Module '@prisma/client' has no exported member"

**Error Message**:
```typescript
error TS2305: Module '"@prisma/client"' has no exported member 'Transaction'.
```

**Cause**: Prisma client not generated or generated incorrectly

**Solution**:
```bash
# Remove existing client
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# Reinstall and regenerate
npm install @prisma/client
npx prisma generate
```

### Issue 3: Prisma Client Out of Sync with Schema

**Error Message**:
```
Prisma Client could not locate the Query Engine for runtime "debian-openssl-3.0.x"
```

**Cause**: Schema changed but client not regenerated

**Solution**:
```bash
# Always regenerate after schema changes
npx prisma generate
```

### Issue 4: Database Connection Failed

**Error Message**:
```
Can't reach database server at `localhost:5433`
```

**Cause**: PostgreSQL not running or wrong DATABASE_URL

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5433

# Or with docker-compose
docker-compose ps

# Start PostgreSQL
docker-compose up -d postgres

# Verify connection string in .env
echo $DATABASE_URL
```

### Issue 5: Migration Errors

**Error Message**:
```
P3009: migrate found failed migrations
```

**Cause**: Previous migration failed and left database in inconsistent state

**Solution (Development)**:
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Apply migrations
npx prisma migrate dev
```

**Solution (Production)**:
```bash
# Resolve migration manually
npx prisma migrate resolve --applied <migration-name>

# Or rollback
npx prisma migrate resolve --rolled-back <migration-name>
```

## Development Workflow

### Making Schema Changes

1. **Edit `prisma/schema.prisma`**
   ```prisma
   model NewFeature {
     id   String @id @default(uuid())
     name String
     // ... fields
   }
   ```

2. **Create migration**
   ```bash
   npx prisma migrate dev --name add_new_feature
   ```

3. **Prisma client is auto-generated** during migration

4. **Update TypeScript code** to use new types
   ```typescript
   import { NewFeature } from '@prisma/client';
   ```

### Resetting Database (Development Only)

```bash
# WARNING: Deletes ALL data
npx prisma migrate reset

# Applies all migrations and runs seed
```

### Viewing Database with Prisma Studio

```bash
# Open browser-based database GUI
npx prisma studio
```

Access at `http://localhost:5555`

## Testing with Prisma

### Integration Tests (Repository Layer)

Use a test database:

```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST
    }
  }
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.holding.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Unit Tests (Service Layer)

Mock the repository (no Prisma needed):

```typescript
// No Prisma client needed
const mockRepo: PortfolioRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  // ...
};

const service = createPortfolioService(mockRepo, /* other deps */);
```

## Environment Variables

### Required

```bash
# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5433/database?schema=public"
```

### Optional

```bash
# Skip engine checksum validation (for network issues)
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Custom engine binary path
PRISMA_QUERY_ENGINE_BINARY=/path/to/engine

# Prisma log level
DEBUG="prisma:*"

# Connection pool size
DATABASE_POOL_SIZE=10
```

## CI/CD Considerations

### GitHub Actions Example

```yaml
- name: Install dependencies
  run: npm ci

- name: Generate Prisma client
  run: npx prisma generate

- name: Run migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}

- name: Run tests
  run: npm test
```

### Docker Considerations

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Generate Prisma client (important!)
COPY prisma ./prisma
RUN npx prisma generate

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

CMD ["npm", "start"]
```

### Docker Compose Setup

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: crypto_user
      POSTGRES_PASSWORD: crypto_password_dev
      POSTGRES_DB: crypto_portfolio_dev
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://crypto_user:crypto_password_dev@postgres:5432/crypto_portfolio_dev
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

## Performance Optimization

### Connection Pooling

```typescript
// src/config/database.config.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pool configuration
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Global connection pool
// Prisma automatically manages connections (default: 10)
```

### Query Optimization

```typescript
// Use select to fetch only needed fields
const portfolio = await prisma.portfolio.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    // Don't fetch unnecessary fields
  }
});

// Use include wisely
const portfolio = await prisma.portfolio.findUnique({
  where: { id },
  include: {
    holdings: {
      take: 10, // Limit related records
      orderBy: { value: 'desc' }
    }
  }
});
```

## Troubleshooting Commands

```bash
# Check Prisma version
npx prisma --version

# Validate schema
npx prisma validate

# Format schema
npx prisma format

# Check migration status
npx prisma migrate status

# View generated SQL for migration
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script

# Introspect existing database (reverse engineer)
npx prisma db pull

# Push schema changes without migrations (dev only)
npx prisma db push
```

## Best Practices

### 1. Always Generate After Schema Changes

```bash
# After editing schema.prisma
npx prisma migrate dev --name describe_change
# Client is auto-generated
```

### 2. Use Environment-Specific Databases

```bash
# .env.development
DATABASE_URL="postgresql://user:pass@localhost:5433/dev_db"

# .env.test
DATABASE_URL="postgresql://user:pass@localhost:5433/test_db"

# .env.production
DATABASE_URL="postgresql://user:pass@prod-host:5432/prod_db"
```

### 3. Singleton Prisma Client

```typescript
// src/config/database.config.ts
let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// Use in repositories
export const createPortfolioRepository = (prisma: PrismaClient) => ({
  // ...
});
```

### 4. Graceful Shutdown

```typescript
// src/server.ts
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
```

### 5. Logging in Development

```typescript
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

## Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Studio](https://www.prisma.io/studio)

## Support

If you encounter issues not covered here:

1. Check [Prisma GitHub Issues](https://github.com/prisma/prisma/issues)
2. Review [Prisma Community Forum](https://github.com/prisma/prisma/discussions)
3. Verify your environment meets prerequisites
4. Check network connectivity to binaries.prisma.sh
5. Review application logs for detailed error messages
