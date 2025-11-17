# Backend Module Architecture - Crypto Portfolio Dashboard

**Date**: 2025-11-17
**Feature**: 001-crypto-portfolio-dashboard

## Architecture Pattern

Each backend module follows a **layered architecture** with clear separation of concerns:

```
Module
├── controller.ts    # HTTP request handling, response formatting
├── service.ts       # Business logic, orchestration
├── repository.ts    # Data access layer (Prisma queries)
├── routes.ts        # Route definitions and middleware
├── validation.ts    # Zod schemas for input validation
└── types.ts         # TypeScript interfaces and types
```

## Layer Responsibilities

### 1. Controller Layer (`*.controller.ts`)
**Purpose**: Handle HTTP requests and responses

**Responsibilities:**
- Extract and validate request data (body, params, query)
- Call service layer methods
- Format responses using `ApiSuccess` or `ApiError`
- Handle HTTP-specific concerns (status codes, headers)

**Example:**
```typescript
// portfolio.controller.ts
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id; // From auth middleware
      const portfolio = await this.portfolioService.create(userId, req.body);
      res.status(201).json(createSuccessResponse(portfolio, 'Portfolio created'));
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;
      const portfolios = await this.portfolioService.getAll(userId);
      res.json(createSuccessResponse(portfolios));
    } catch (error) {
      next(error);
    }
  }
}
```

### 2. Service Layer (`*.service.ts`)
**Purpose**: Business logic and orchestration

**Responsibilities:**
- Implement business rules
- Coordinate between repositories
- Handle transactions
- Call external services (market data, cache)
- Transform data between layers

**Example:**
```typescript
// portfolio.service.ts
export class PortfolioService {
  constructor(
    private portfolioRepo: PortfolioRepository,
    private holdingsRepo: HoldingsRepository,
    private marketDataService: MarketDataService
  ) {}

  async create(userId: string, data: CreatePortfolioDto): Promise<Portfolio> {
    // Business logic
    const existing = await this.portfolioRepo.findByUserId(userId);
    if (existing.length >= 10) {
      throw new ConflictError('Maximum 10 portfolios per user');
    }

    return this.portfolioRepo.create({ userId, ...data });
  }

  async getPortfolioWithStats(portfolioId: string): Promise<PortfolioDetails> {
    const portfolio = await this.portfolioRepo.findById(portfolioId);
    if (!portfolio) throw new NotFoundError('Portfolio', portfolioId);

    const holdings = await this.holdingsRepo.findByPortfolioId(portfolioId);
    const symbols = holdings.map(h => h.symbol);
    const prices = await this.marketDataService.getCurrentPrices(symbols);

    // Calculate statistics
    const totalValue = holdings.reduce((sum, holding) => {
      const price = prices[holding.symbol];
      return sum.plus(multiply(holding.quantity, price));
    }, new Decimal(0));

    return { portfolio, holdings, totalValue, prices };
  }
}
```

### 3. Repository Layer (`*.repository.ts`)
**Purpose**: Data access abstraction

**Responsibilities:**
- Prisma database queries
- Data mapping (Prisma models ↔ domain entities)
- Query optimization
- Transaction handling

**Example:**
```typescript
// portfolio.repository.ts
export class PortfolioRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreatePortfolioData): Promise<Portfolio> {
    return this.prisma.portfolio.create({
      data: {
        userId: data.userId,
        name: data.name,
        description: data.description,
        isDefault: data.isDefault ?? false,
      },
    });
  }

  async findById(id: string): Promise<Portfolio | null> {
    return this.prisma.portfolio.findUnique({
      where: { id },
      include: { holdings: true },
    });
  }

  async findByUserId(userId: string): Promise<Portfolio[]> {
    return this.prisma.portfolio.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: UpdatePortfolioData): Promise<Portfolio> {
    return this.prisma.portfolio.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.portfolio.delete({
      where: { id },
    });
  }
}
```

### 4. Routes Layer (`*.routes.ts`)
**Purpose**: Define HTTP routes and apply middleware

**Responsibilities:**
- Route path definitions
- HTTP method mapping
- Middleware attachment (validation, auth, rate limiting)
- Controller method binding

**Example:**
```typescript
// portfolio.routes.ts
import { Router } from 'express';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioRepository } from './portfolio.repository';
import { validateBody, validateParams } from '@/shared/middleware/validator';
import { asyncHandler } from '@/shared/middleware/error-handler';
import { authMiddleware } from '@/shared/middleware/auth';
import {
  createPortfolioSchema,
  updatePortfolioSchema,
  portfolioIdSchema
} from './portfolio.validation';

const router = Router();

// Initialize dependencies
const portfolioRepo = new PortfolioRepository(getPrismaClient());
const holdingsRepo = new HoldingsRepository(getPrismaClient());
const marketDataService = new MarketDataService();
const portfolioService = new PortfolioService(
  portfolioRepo,
  holdingsRepo,
  marketDataService
);
const portfolioController = new PortfolioController(portfolioService);

// Routes
router.post(
  '/',
  authMiddleware,
  validateBody(createPortfolioSchema),
  asyncHandler((req, res, next) => portfolioController.create(req, res, next))
);

router.get(
  '/',
  authMiddleware,
  asyncHandler((req, res, next) => portfolioController.getAll(req, res, next))
);

router.get(
  '/:id',
  authMiddleware,
  validateParams(portfolioIdSchema),
  asyncHandler((req, res, next) => portfolioController.getById(req, res, next))
);

router.patch(
  '/:id',
  authMiddleware,
  validateParams(portfolioIdSchema),
  validateBody(updatePortfolioSchema),
  asyncHandler((req, res, next) => portfolioController.update(req, res, next))
);

router.delete(
  '/:id',
  authMiddleware,
  validateParams(portfolioIdSchema),
  asyncHandler((req, res, next) => portfolioController.delete(req, res, next))
);

export default router;
```

### 5. Validation Layer (`*.validation.ts`)
**Purpose**: Input validation schemas

**Responsibilities:**
- Zod schema definitions
- Type inference
- Validation error messages

**Example:**
```typescript
// portfolio.validation.ts
import { z } from 'zod';

export const createPortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
});

export const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided' }
);

export const portfolioIdSchema = z.object({
  id: z.string().uuid(),
});

// Type inference
export type CreatePortfolioDto = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioDto = z.infer<typeof updatePortfolioSchema>;
```

### 6. Types Layer (`*.types.ts`)
**Purpose**: TypeScript type definitions

**Responsibilities:**
- Domain interfaces
- DTOs (Data Transfer Objects)
- Response types
- Internal types

**Example:**
```typescript
// portfolio.types.ts
import { Portfolio, Holding } from '@prisma/client';
import { Decimal } from 'decimal.js';

// Domain entities
export interface PortfolioDetails extends Portfolio {
  holdings: HoldingDetails[];
  totalValue: Decimal;
  gainLoss: {
    amount: Decimal;
    percentage: Decimal;
    isProfit: boolean;
  };
}

export interface HoldingDetails extends Holding {
  currentPrice: Decimal;
  currentValue: Decimal;
  gainLoss: Decimal;
  gainLossPercentage: Decimal;
  allocation: Decimal; // % of portfolio
}

// Request DTOs
export interface CreatePortfolioData {
  userId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdatePortfolioData {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

// Response DTOs
export interface PortfolioSummary {
  id: string;
  name: string;
  totalValue: string;
  holdingsCount: number;
  lastUpdated: string;
}
```

## Module Structure

### Complete Module Example: Portfolio

```
backend/src/modules/portfolio/
├── portfolio.controller.ts   # HTTP handlers
├── portfolio.service.ts      # Business logic
├── portfolio.repository.ts   # Data access
├── portfolio.routes.ts       # Route definitions
├── portfolio.validation.ts   # Zod schemas
└── portfolio.types.ts        # TypeScript types
```

### All Modules

```
backend/src/modules/
├── portfolio/
│   ├── portfolio.controller.ts
│   ├── portfolio.service.ts
│   ├── portfolio.repository.ts
│   ├── portfolio.routes.ts
│   ├── portfolio.validation.ts
│   └── portfolio.types.ts
├── holdings/
│   ├── holdings.controller.ts
│   ├── holdings.service.ts
│   ├── holdings.repository.ts
│   ├── holdings.routes.ts
│   ├── holdings.validation.ts
│   ├── holdings.types.ts
│   ├── transaction.controller.ts
│   ├── transaction.service.ts
│   ├── transaction.repository.ts
│   └── transaction.validation.ts
├── watchlist/
│   ├── watchlist.controller.ts
│   ├── watchlist.service.ts
│   ├── watchlist.repository.ts
│   ├── watchlist.routes.ts
│   ├── watchlist.validation.ts
│   └── watchlist.types.ts
├── market-data/
│   ├── market-data.controller.ts
│   ├── market-data.service.ts
│   ├── market-data.cache.ts
│   ├── market-data.routes.ts
│   ├── market-data.types.ts
│   ├── adapters/
│   │   ├── binance.adapter.ts
│   │   ├── coingecko.adapter.ts
│   │   └── adapter.interface.ts
│   └── market-data.validation.ts
└── auth/  (future)
    ├── auth.controller.ts
    ├── auth.service.ts
    ├── auth.repository.ts
    ├── auth.routes.ts
    ├── auth.validation.ts
    ├── auth.types.ts
    └── auth.middleware.ts
```

## Data Flow

```
Request
  ↓
Route (validation middleware)
  ↓
Controller (HTTP handling)
  ↓
Service (business logic)
  ↓
Repository (database)
  ↓
Prisma Client
  ↓
PostgreSQL

Response flows back up through the same layers
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Testability**: Easy to mock dependencies and test each layer in isolation
3. **Maintainability**: Changes to one layer don't affect others
4. **Scalability**: Easy to add new features following the same pattern
5. **Type Safety**: Strong typing throughout the stack
6. **Reusability**: Services can be reused across different controllers
7. **DI-Ready**: Structure supports dependency injection

## Testing Strategy

```
backend/tests/
├── unit/
│   ├── portfolio/
│   │   ├── portfolio.service.test.ts      # Service logic
│   │   ├── portfolio.repository.test.ts   # Database queries
│   │   └── portfolio.validation.test.ts   # Schema validation
│   └── shared/
│       ├── decimal.util.test.ts
│       └── retry.util.test.ts
├── integration/
│   ├── portfolio.integration.test.ts      # Full API endpoints
│   ├── holdings.integration.test.ts
│   └── watchlist.integration.test.ts
└── mocks/
    ├── prisma.mock.ts
    ├── market-data.mock.ts
    └── fixtures/
        ├── portfolios.fixture.ts
        └── holdings.fixture.ts
```

## Implementation Order

1. **Shared/Core** (already done)
   - Types, utilities, middleware

2. **Market Data Module** (foundation for all features)
   - Adapters → Service → Controller → Routes

3. **Portfolio Module**
   - Repository → Service → Validation → Controller → Routes

4. **Holdings Module**
   - Repository → Service → Validation → Controller → Routes
   - Transaction sub-module

5. **Watchlist Module**
   - Repository → Service → Validation → Controller → Routes

6. **Auth Module** (future)
   - Auth service → JWT middleware → Protected routes
