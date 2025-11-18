# Crypto Portfolio Backend

RESTful API backend for cryptocurrency portfolio management, built with TypeScript, Express.js, and Prisma ORM.

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Environment Variables](#environment-variables)

## Architecture

This backend follows a **functional layered architecture** with clear separation of concerns:

```
Routes → Controller (Handlers) → Service → Repository → Database
```

### Architectural Principles

1. **Functional Programming**: All code uses **functions, NOT classes**
2. **Explicit Dependency Injection**: Dependencies are injected via factory functions
3. **Repository Pattern**: All database access is abstracted through repositories
4. **Type Safety**: TypeScript strict mode with comprehensive type definitions
5. **Testability**: Each layer can be tested independently with simple object mocks

### Layer Responsibilities

| Layer | Responsibility | Testing Strategy |
|-------|---------------|------------------|
| **Routes** | Define HTTP endpoints, mount handlers | E2E tests with Supertest (80%+ coverage) |
| **Controller (Handlers)** | Handle HTTP concerns (req/res), validation | Unit tests with mocked service (90%+ coverage) |
| **Service** | Business logic, orchestration | Unit tests with mocked repository (95%+ coverage) |
| **Repository** | Data access (Prisma queries) | Integration tests with real DB (90%+ coverage) |

### Functional Module Pattern

All backend modules follow this pattern:

```typescript
// 1. Type Definition
export type XxxService = {
  getEntity: (id: string) => Promise<EntityDto>;
  createEntity: (data: CreateDto) => Promise<EntityDto>;
};

// 2. Factory Function
export const createXxxService = (repository: XxxRepository): XxxService => ({
  getEntity: async (id) => {
    const entity = await repository.findById(id);
    if (!entity) throw new Error('Entity not found');
    return entity;
  },
  createEntity: async (data) => repository.create(data),
});

// 3. Handler Factory Functions
export const createGetEntityHandler = (service: XxxService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entity = await service.getEntity(req.params.id);
      res.json({ success: true, data: entity, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  };
};

// 4. Routes (Default Export)
export default function createXxxRoutes(handlers: XxxHandlers): Router {
  const router = Router();
  router.get('/:id', handlers.getEntity);
  router.post('/', validateRequest(CreateXxxSchema), handlers.createEntity);
  return router;
}
```

### Dependency Injection

Dependencies are explicitly composed in `src/app.ts`:

```typescript
const prisma = new PrismaClient();

// Bottom-up composition: Repository → Service → Handlers → Routes
const xxxRepo = createXxxRepository(prisma);
const xxxService = createXxxService(xxxRepo);
const xxxHandlers = {
  getEntity: createGetEntityHandler(xxxService),
  createEntity: createCreateEntityHandler(xxxService),
};
const xxxRoutes = createXxxRoutes(xxxHandlers);

app.use('/api/xxx', xxxRoutes);
```

**Benefits**:
- No circular dependencies
- Easy to test (mock with simple objects)
- Clear dependency flow
- Runtime flexibility

### Export Strategy

- **Named exports**: Use for types, factory functions, handlers (everything except routes)
- **Default export**: Use ONLY for route factory functions

```typescript
// Named exports (standard)
export type XxxService = { ... };
export const createXxxService = (...) => { ... };
export const createGetXxxHandler = (...) => { ... };

// Default export (routes only)
export default function createXxxRoutes(...): Router { ... }
```

## Tech Stack

### Core
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3+ (strict mode)
- **Framework**: Express.js 4.18+
- **ORM**: Prisma 5.0+
- **Database**: PostgreSQL 15+

### Development
- **Testing**: Jest 29+, Supertest
- **Linting**: ESLint 8+
- **Formatting**: Prettier 3+
- **Process Manager**: tsx (for development)

### Libraries
- **Validation**: Zod 3.22+
- **Logging**: Winston 3+
- **Decimal Math**: Decimal.js 10+
- **HTTP Client**: Axios 1+
- **Security**: Helmet, CORS, express-rate-limit

## Project Structure

```
backend/
├── src/
│   ├── config/               # Configuration files
│   │   ├── env.config.ts     # Environment variable validation (Zod)
│   │   └── database.config.ts
│   │
│   ├── shared/               # Shared utilities and middleware
│   │   ├── middleware/       # Express middleware (error handler, rate limiter, validator)
│   │   ├── services/         # Shared services (logger, cache, calculations)
│   │   ├── types/            # Shared TypeScript types (API responses, errors)
│   │   └── utils/            # Utility functions (decimal, retry, crypto symbols)
│   │
│   ├── modules/              # Feature modules (layered architecture)
│   │   ├── [module]/
│   │   │   ├── [module].routes.ts       # Express routes (default export)
│   │   │   ├── [module].controller.ts   # HTTP handlers (named exports)
│   │   │   ├── [module].service.ts      # Business logic (factory function)
│   │   │   ├── [module].repository.ts   # Data access (factory function)
│   │   │   ├── [module].validation.ts   # Zod schemas
│   │   │   ├── [module].types.ts        # Module-specific types
│   │   │   └── __tests__/               # Unit & integration tests
│   │   │       ├── [module].controller.test.ts
│   │   │       ├── [module].service.test.ts
│   │   │       └── [module].repository.test.ts
│   │   │
│   │   ├── portfolio/        # Portfolio management
│   │   ├── holdings/         # Holdings & transactions
│   │   ├── market-data/      # Price data & market info
│   │   ├── watchlist/        # Watchlist management
│   │   └── earnings/         # Binance Earn integration
│   │
│   ├── prisma/               # Database
│   │   └── seed.ts           # Seed data
│   │
│   ├── app.ts                # Express app setup, DI container, route mounting
│   └── server.ts             # Server startup with graceful shutdown
│
├── tests/
│   ├── integration/          # E2E API tests with Supertest
│   ├── helpers.ts            # Test utilities
│   └── setup.ts              # Jest configuration
│
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── migrations/           # Migration history
│
├── .env.example              # Environment variables template
├── jest.config.js            # Jest configuration
├── tsconfig.json             # TypeScript configuration (strict mode)
├── .eslintrc.json            # ESLint rules
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

5. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

6. **Seed the database (optional)**
   ```bash
   npx prisma db seed
   ```

7. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`.

## Development

### Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Start production server
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Run tests with coverage report
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Adding a New Module

To add a new feature module, follow this structure:

1. **Create module directory**
   ```bash
   mkdir -p src/modules/my-feature/__tests__
   ```

2. **Create files** (in this order):
   - `my-feature.types.ts` - Type definitions
   - `my-feature.validation.ts` - Zod schemas
   - `my-feature.repository.ts` - Data access layer
   - `my-feature.service.ts` - Business logic
   - `my-feature.controller.ts` - HTTP handlers
   - `my-feature.routes.ts` - Route definitions

3. **Wire dependencies in `src/app.ts`**:
   ```typescript
   const myFeatureRepo = createMyFeatureRepository(prisma);
   const myFeatureService = createMyFeatureService(myFeatureRepo);
   const myFeatureHandlers = {
     get: createGetHandler(myFeatureService),
     create: createCreateHandler(myFeatureService),
   };
   const myFeatureRoutes = createMyFeatureRoutes(myFeatureHandlers);
   app.use('/api/my-feature', myFeatureRoutes);
   ```

4. **Write tests**:
   - Repository: Integration tests with real database
   - Service: Unit tests with mocked repository
   - Controller: Unit tests with mocked service
   - Routes: E2E tests with Supertest

## Testing

### Test Strategy

| Layer | Test Type | Tools | Coverage Target |
|-------|-----------|-------|----------------|
| Repository | Integration | Jest + Prisma + Test DB | 90%+ |
| Service | Unit | Jest + Simple object mocks | 95%+ |
| Controller | Unit | Jest + Simple object mocks | 90%+ |
| Routes | E2E | Jest + Supertest | 80%+ |
| **Overall** | **Mixed** | **Jest + Supertest** | **85%+** |

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/modules/portfolio/__tests__/portfolio.service.test.ts

# Run integration tests only
npm test -- tests/integration
```

### Writing Tests

**Simple Object Mocks** (no mocking frameworks needed):

```typescript
// Mock repository
const mockRepo: MyRepository = {
  findById: jest.fn(),
  create: jest.fn(),
};

// Mock service
const mockService: MyService = {
  getEntity: jest.fn(),
  createEntity: jest.fn(),
};

// Use in tests
mockRepo.findById.mockResolvedValue(mockEntity);
const service = createMyService(mockRepo);
await service.getEntity('123');
expect(mockRepo.findById).toHaveBeenCalledWith('123');
```

## API Documentation

### Response Format

All API responses follow this format:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-18T12:00:00.000Z"
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "timestamp": "2025-11-18T12:00:00.000Z"
}

// Paginated
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrevious": false
  },
  "timestamp": "2025-11-18T12:00:00.000Z"
}
```

### Endpoints

#### Health Check
- `GET /health` - Health check endpoint

#### Portfolio
- `GET /api/portfolios` - List user portfolios
- `POST /api/portfolios` - Create portfolio
- `GET /api/portfolios/:id` - Get portfolio details
- `PATCH /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio

#### Holdings
- `GET /api/portfolios/:portfolioId/holdings` - List holdings
- `POST /api/portfolios/:portfolioId/holdings` - Add holding
- `GET /api/portfolios/:portfolioId/holdings/:id` - Get holding details
- `PATCH /api/portfolios/:portfolioId/holdings/:id` - Update holding
- `DELETE /api/portfolios/:portfolioId/holdings/:id` - Delete holding

#### Market Data
- `GET /api/market/prices/:symbol` - Get current price
- `GET /api/market/prices?symbols=BTC,ETH` - Batch price query
- `GET /api/market/history/:symbol` - Historical price data

#### Watchlist
- `GET /api/watchlist` - Get user watchlist
- `POST /api/watchlist` - Add to watchlist
- `DELETE /api/watchlist/:id` - Remove from watchlist

## Database

### Schema Management

```bash
# Create a new migration
npx prisma migrate dev --name description_of_changes

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# Open Prisma Studio (DB GUI)
npx prisma studio
```

### Database Models

See `prisma/schema.prisma` for the complete schema. Key models:
- **User**: User accounts
- **Portfolio**: User portfolios
- **Holding**: Cryptocurrency holdings
- **Transaction**: Buy/sell transactions
- **WatchlistItem**: Watchlist entries
- **PriceCache**: Cached price data
- **PriceHistory**: Historical prices
- **EarnPosition**: Binance Earn positions
- **EarnReward**: Earn rewards

## Environment Variables

Required environment variables (see `.env.example`):

### Server Configuration
- `NODE_ENV` - Environment (development, production, test)
- `PORT` - Server port (default: 3000)
- `API_PREFIX` - API prefix (default: /api)

### Database
- `DATABASE_URL` - PostgreSQL connection string

### Redis (Optional)
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password

### Logging
- `LOG_LEVEL` - Logging level (error, warn, info, debug)
- `LOG_FILE_PATH` - Log file path

### Security
- `JWT_SECRET` - JWT signing secret (if auth is implemented)
- `BCRYPT_ROUNDS` - Bcrypt salt rounds (default: 10)

### External APIs
- `BINANCE_API_KEY` - Binance API key
- `BINANCE_API_SECRET` - Binance API secret
- `COINGECKO_API_KEY` - CoinGecko API key (optional)

### Rate Limiting
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000 = 15 min)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

## Performance

### Performance Goals
- **Simple queries** (findById, findAll): p95 ≤ 50ms
- **Complex aggregations** (calculations, joins): p95 ≤ 200ms
- **External API calls**: Cached with 60s TTL

### Optimization Strategies
1. **Database Indexing**: Key fields indexed for fast lookups
2. **Redis Caching**: Price data cached (60s TTL)
3. **Connection Pooling**: Prisma connection pool (10 connections)
4. **Query Optimization**: Select only required fields
5. **Batch Operations**: Use `findMany` instead of multiple `findById`

## Security

### Security Measures
- **Helmet**: HTTP security headers
- **CORS**: Configured for frontend origin only
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection**: Protected by Prisma (parameterized queries)
- **XSS**: Output encoding by Express
- **Error Handling**: Sanitized error messages (no stack traces in production)

### Best Practices
- Never commit secrets (.env in .gitignore)
- Use environment variables for sensitive config
- Validate all user inputs with Zod
- Log security events (failed auth, rate limit hits)
- Regular dependency audits (`npm audit`)

## Troubleshooting

### Common Issues

**Prisma Client Not Generated**
```bash
npx prisma generate
```

**Database Connection Failed**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify credentials and database exists

**Port Already in Use**
```bash
# Change PORT in .env or kill process using the port
lsof -ti:3000 | xargs kill -9
```

**TypeScript Errors**
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

## Contributing

### Code Style
- Use functional programming patterns (NO classes)
- Follow layered architecture (Routes → Controller → Service → Repository)
- Use factory functions for dependency injection
- Export types before implementations
- Add JSDoc comments to public methods
- Use TypeScript strict mode
- Format with Prettier
- Lint with ESLint

### Commit Guidelines
- Use conventional commits (feat:, fix:, docs:, refactor:, test:, chore:)
- Reference issue numbers in commits
- Keep commits atomic and focused

### Pull Request Process
1. Create feature branch from `main`
2. Write tests (TDD preferred)
3. Ensure all tests pass (`npm test`)
4. Ensure lint passes (`npm run lint`)
5. Update documentation if needed
6. Submit PR with clear description

## License

[Specify your license here]

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review test files for usage examples
