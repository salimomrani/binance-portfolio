# Quickstart: Backend Modular Architecture Migration

**Feature**: 003-backend-modular-architecture | **Date**: 2025-11-18

## Overview

This is a practical, step-by-step guide for developers implementing the backend modular architecture. It includes complete code examples, common patterns, and troubleshooting tips.

---

## Table of Contents

1. [Migration Checklist](#1-migration-checklist)
2. [Pattern 1: Create Repository](#2-pattern-1-create-repository)
3. [Pattern 2: Refactor Service](#3-pattern-2-refactor-service)
4. [Pattern 3: Refactor Controller](#4-pattern-3-refactor-controller)
5. [Pattern 4: Create Routes](#5-pattern-4-create-routes)
6. [Pattern 5: Setup DI](#6-pattern-5-setup-di)
7. [Pattern 6: Write Tests](#7-pattern-6-write-tests)
8. [Common Patterns](#8-common-patterns)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Migration Checklist

Use this checklist for each module:

### Per Module Checklist

**Portfolio Module**:
- [ ] Create `portfolio.repository.ts`
- [ ] Write repository integration tests
- [ ] Refactor `portfolio.service.ts` to use repository
- [ ] Write service unit tests
- [ ] Refactor `portfolio.controller.ts` to use service only
- [ ] Write controller unit tests
- [ ] Create `portfolio.routes.ts`
- [ ] Update `app.ts` with DI
- [ ] Run E2E tests
- [ ] Verify all endpoints work

**Repeat for**: holdings, market-data

---

## 2. Pattern 1: Create Repository

### Step 1: Create Repository File

**File**: `modules/portfolio/portfolio.repository.ts`

```typescript
import { PrismaClient, Portfolio, Prisma } from '@prisma/client';

/**
 * Portfolio Repository
 * Handles all database operations for portfolios
 */
export class PortfolioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find all portfolios for a user
   */
  async findAll(userId: string): Promise<Portfolio[]> {
    return this.prisma.portfolio.findMany({
      where: { userId },
      include: { holdings: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find portfolio by ID
   */
  async findById(id: string): Promise<Portfolio | null> {
    return this.prisma.portfolio.findUnique({
      where: { id },
      include: { holdings: true }
    });
  }

  /**
   * Find default portfolio for a user
   */
  async findDefaultPortfolio(userId: string): Promise<Portfolio | null> {
    return this.prisma.portfolio.findFirst({
      where: { userId, isDefault: true },
      include: { holdings: true }
    });
  }

  /**
   * Create a new portfolio
   */
  async create(data: Prisma.PortfolioCreateInput): Promise<Portfolio> {
    return this.prisma.portfolio.create({
      data,
      include: { holdings: true }
    });
  }

  /**
   * Update portfolio
   */
  async update(
    id: string,
    data: Prisma.PortfolioUpdateInput
  ): Promise<Portfolio> {
    return this.prisma.portfolio.update({
      where: { id },
      data,
      include: { holdings: true }
    });
  }

  /**
   * Delete portfolio
   */
  async delete(id: string): Promise<void> {
    await this.prisma.portfolio.delete({ where: { id } });
  }

  /**
   * Set portfolio as default (unset others)
   */
  async setAsDefault(userId: string, portfolioId: string): Promise<void> {
    await this.prisma.$transaction([
      // Unset all defaults for user
      this.prisma.portfolio.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      }),
      // Set new default
      this.prisma.portfolio.update({
        where: { id: portfolioId },
        data: { isDefault: true }
      })
    ]);
  }

  /**
   * Check if portfolio exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.portfolio.count({ where: { id } });
    return count > 0;
  }

  /**
   * Count portfolios for a user
   */
  async countByUser(userId: string): Promise<number> {
    return this.prisma.portfolio.count({ where: { userId } });
  }
}
```

### Key Points

✅ **Constructor Injection**: Repository receives PrismaClient via constructor
✅ **JSDoc Comments**: Document public methods
✅ **Prisma Types**: Use `Prisma.PortfolioCreateInput` for type safety
✅ **Include Relations**: Add `include: { holdings: true }` where needed
✅ **Transaction Support**: Use `prisma.$transaction` for multi-step operations

---

## 3. Pattern 2: Refactor Service

### Before (Old Service)

```typescript
// ❌ OLD: Service has Prisma calls
import { PrismaClient } from '@prisma/client';
import { CalculationsService } from '../../shared/services/calculations.service';

export class PortfolioService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly calculations: CalculationsService
  ) {}

  async getPortfolios(userId: string) {
    // ❌ Direct Prisma call in service
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      include: { holdings: true }
    });

    return portfolios.map(p => ({
      ...p,
      totalValue: this.calculations.calculateTotalValue(p.holdings)
    }));
  }
}
```

### After (Refactored Service)

```typescript
// ✅ NEW: Service uses repository
import { PortfolioRepository } from './portfolio.repository';
import { CalculationsService } from '../../shared/services/calculations.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from './portfolio.validation';

export class PortfolioService {
  constructor(
    private readonly repository: PortfolioRepository, // ✅ Inject repository
    private readonly calculations: CalculationsService
  ) {}

  /**
   * Get all portfolios for a user with calculated values
   */
  async getPortfolios(userId: string) {
    // ✅ Use repository
    const portfolios = await this.repository.findAll(userId);

    // ✅ Business logic: add calculated fields
    return portfolios.map(p => ({
      ...p,
      totalValue: this.calculations.calculateTotalValue(p.holdings),
      profitLoss: this.calculations.calculateProfitLoss(p.holdings),
      profitLossPercentage: this.calculations.calculateProfitLossPercentage(p.holdings)
    }));
  }

  /**
   * Get portfolio by ID with calculated values
   */
  async getPortfolioById(id: string, userId: string) {
    const portfolio = await this.repository.findById(id);

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    if (portfolio.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return {
      ...portfolio,
      totalValue: this.calculations.calculateTotalValue(portfolio.holdings),
      profitLoss: this.calculations.calculateProfitLoss(portfolio.holdings)
    };
  }

  /**
   * Create a new portfolio
   */
  async createPortfolio(userId: string, dto: CreatePortfolioDto) {
    // Business logic: check if user has too many portfolios
    const count = await this.repository.countByUser(userId);
    if (count >= 10) {
      throw new Error('Maximum 10 portfolios allowed');
    }

    // Business logic: set as default if first portfolio
    const isDefault = count === 0;

    return this.repository.create({
      name: dto.name,
      description: dto.description,
      userId,
      isDefault
    });
  }

  /**
   * Update portfolio
   */
  async updatePortfolio(id: string, userId: string, dto: UpdatePortfolioDto) {
    // Check ownership
    const existing = await this.repository.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new Error('Portfolio not found or unauthorized');
    }

    return this.repository.update(id, {
      name: dto.name,
      description: dto.description
    });
  }

  /**
   * Delete portfolio
   */
  async deletePortfolio(id: string, userId: string) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new Error('Portfolio not found or unauthorized');
    }

    // Business logic: cannot delete default portfolio
    if (existing.isDefault) {
      throw new Error('Cannot delete default portfolio');
    }

    await this.repository.delete(id);
  }

  /**
   * Set portfolio as default
   */
  async setAsDefault(id: string, userId: string) {
    const existing = await this.repository.findById(id);
    if (!existing || existing.userId !== userId) {
      throw new Error('Portfolio not found or unauthorized');
    }

    await this.repository.setAsDefault(userId, id);
  }
}
```

### Key Changes

✅ **Remove Prisma**: Replace `PrismaClient` with `PortfolioRepository`
✅ **Business Logic Only**: Service focuses on business rules
✅ **Authorization**: Check user ownership
✅ **Validation**: Apply business constraints (max portfolios, cannot delete default)
✅ **Calculations**: Use CalculationsService for derived values

---

## 4. Pattern 3: Refactor Controller

### Before (Old Controller)

```typescript
// ❌ OLD: Controller has service + validation logic
export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}

  async getPortfolios(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const portfolios = await this.service.getPortfolios(userId);
      res.json({ data: portfolios });
    } catch (error) {
      next(error);
    }
  }
}
```

### After (Refactored Controller)

```typescript
// ✅ NEW: Controller focuses on HTTP concerns
import { Request, Response, NextFunction } from 'express';
import { PortfolioService } from './portfolio.service';

export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}

  /**
   * GET /api/portfolios
   * Get all portfolios for authenticated user
   */
  async getPortfolios(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id; // Auth middleware ensures req.user exists

      const portfolios = await this.service.getPortfolios(userId);

      res.json({
        data: portfolios,
        meta: { count: portfolios.length }
      });
    } catch (error) {
      next(error); // Pass to error middleware
    }
  }

  /**
   * GET /api/portfolios/:id
   * Get portfolio by ID
   */
  async getPortfolioById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const portfolio = await this.service.getPortfolioById(id, userId);

      res.json({ data: portfolio });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/portfolios
   * Create a new portfolio
   */
  async createPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const dto = req.body; // Already validated by middleware

      const portfolio = await this.service.createPortfolio(userId, dto);

      res.status(201).json({
        data: portfolio,
        message: 'Portfolio created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/portfolios/:id
   * Update portfolio
   */
  async updatePortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const dto = req.body;

      const portfolio = await this.service.updatePortfolio(id, userId, dto);

      res.json({
        data: portfolio,
        message: 'Portfolio updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/portfolios/:id
   * Delete portfolio
   */
  async deletePortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.service.deletePortfolio(id, userId);

      res.status(204).send(); // No content
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/portfolios/:id/set-default
   * Set portfolio as default
   */
  async setAsDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      await this.service.setAsDefault(id, userId);

      res.json({ message: 'Default portfolio updated' });
    } catch (error) {
      next(error);
    }
  }
}
```

### Key Points

✅ **HTTP Only**: Controller handles request/response, status codes
✅ **Delegate to Service**: All business logic in service
✅ **Consistent Responses**: Use `{ data, meta, message }` format
✅ **Error Handling**: Pass errors to middleware with `next(error)`
✅ **JSDoc**: Document each endpoint

---

## 5. Pattern 4: Create Routes

### Create Routes File

**File**: `modules/portfolio/portfolio.routes.ts`

```typescript
import { Router } from 'express';
import { PortfolioController } from './portfolio.controller';
import { validateRequest } from '../../shared/middleware/validator';
import { authenticate } from '../../shared/middleware/auth.middleware';
import {
  CreatePortfolioSchema,
  UpdatePortfolioSchema
} from './portfolio.validation';

/**
 * Create portfolio routes
 * Factory function that receives controller and returns configured router
 */
export function createPortfolioRoutes(controller: PortfolioController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticate);

  /**
   * GET /api/portfolios
   * List all portfolios for authenticated user
   */
  router.get('/', (req, res, next) =>
    controller.getPortfolios(req, res, next)
  );

  /**
   * POST /api/portfolios
   * Create a new portfolio
   */
  router.post(
    '/',
    validateRequest(CreatePortfolioSchema),
    (req, res, next) => controller.createPortfolio(req, res, next)
  );

  /**
   * GET /api/portfolios/:id
   * Get portfolio by ID
   */
  router.get('/:id', (req, res, next) =>
    controller.getPortfolioById(req, res, next)
  );

  /**
   * PATCH /api/portfolios/:id
   * Update portfolio
   */
  router.patch(
    '/:id',
    validateRequest(UpdatePortfolioSchema),
    (req, res, next) => controller.updatePortfolio(req, res, next)
  );

  /**
   * DELETE /api/portfolios/:id
   * Delete portfolio
   */
  router.delete('/:id', (req, res, next) =>
    controller.deletePortfolio(req, res, next)
  );

  /**
   * POST /api/portfolios/:id/set-default
   * Set portfolio as default
   */
  router.post('/:id/set-default', (req, res, next) =>
    controller.setAsDefault(req, res, next)
  );

  return router;
}
```

### Key Points

✅ **Factory Function**: `createPortfolioRoutes(controller)` for DI
✅ **Middleware**: Apply auth, validation at route level
✅ **Arrow Functions**: Bind controller methods correctly
✅ **JSDoc**: Document each route

---

## 6. Pattern 5: Setup DI

### Update app.ts

**File**: `backend/src/app.ts`

```typescript
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import helmet from 'helmet';

// Middleware
import { errorHandler } from './shared/middleware/error.middleware';
import { logger } from './shared/utils/logger';

// Shared services
import { CalculationsService } from './shared/services/calculations.service';
import { CacheService } from './shared/services/cache.service';

// Portfolio module
import { PortfolioRepository } from './modules/portfolio/portfolio.repository';
import { PortfolioService } from './modules/portfolio/portfolio.service';
import { PortfolioController } from './modules/portfolio/portfolio.controller';
import { createPortfolioRoutes } from './modules/portfolio/portfolio.routes';

// Holdings module
import { HoldingRepository } from './modules/holdings/holdings.repository';
import { TransactionRepository } from './modules/holdings/transaction.repository';
import { HoldingService } from './modules/holdings/holdings.service';
import { HoldingController } from './modules/holdings/holdings.controller';
import { createHoldingRoutes } from './modules/holdings/holdings.routes';

// Market-data module
import { MarketDataRepository } from './modules/market-data/market-data.repository';
import { MarketDataService } from './modules/market-data/market-data.service';
import { MarketDataController } from './modules/market-data/market-data.controller';
import { createMarketDataRoutes } from './modules/market-data/market-data.routes';
import { BinanceAdapter } from './modules/market-data/binance.adapter';
import { CoingeckoAdapter } from './modules/market-data/coingecko.adapter';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// DEPENDENCY INJECTION CONTAINER
// ============================================================================

// Infrastructure layer
const prisma = new PrismaClient();
const cache = new CacheService();
const calculations = new CalculationsService();

// External adapters
const binanceAdapter = new BinanceAdapter();
const coingeckoAdapter = new CoingeckoAdapter();

// --- Portfolio Module ---
const portfolioRepository = new PortfolioRepository(prisma);
const portfolioService = new PortfolioService(portfolioRepository, calculations);
const portfolioController = new PortfolioController(portfolioService);
const portfolioRoutes = createPortfolioRoutes(portfolioController);

// --- Holdings Module ---
const holdingRepository = new HoldingRepository(prisma);
const transactionRepository = new TransactionRepository(prisma);
const holdingService = new HoldingService(
  holdingRepository,
  transactionRepository,
  calculations
);
const holdingController = new HoldingController(holdingService);
const holdingRoutes = createHoldingRoutes(holdingController);

// --- Market-Data Module ---
const marketDataRepository = new MarketDataRepository(prisma, cache);
const marketDataService = new MarketDataService(
  marketDataRepository,
  binanceAdapter,
  coingeckoAdapter
);
const marketDataController = new MarketDataController(marketDataService);
const marketDataRoutes = createMarketDataRoutes(marketDataController);

// ============================================================================
// MOUNT ROUTES
// ============================================================================

app.use('/api/portfolios', portfolioRoutes);
app.use('/api/holdings', holdingRoutes);
app.use('/api/market-data', marketDataRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server...');
  await prisma.$disconnect();
  process.exit(0);
});

export { app, prisma };
```

### Key Structure

1. **Infrastructure Layer**: Create shared dependencies (Prisma, cache, calculations)
2. **External Adapters**: Create API adapters
3. **Per Module**:
   - Create repository (depends on Prisma)
   - Create service (depends on repository + shared services)
   - Create controller (depends on service)
   - Create routes (depends on controller)
4. **Mount Routes**: Use `app.use()`

✅ **Clear Hierarchy**: Dependencies flow top-down
✅ **Single Responsibility**: Each section handles one concern
✅ **Easy to Test**: Replace any dependency for testing

---

## 7. Pattern 6: Write Tests

### Repository Integration Test

**File**: `modules/portfolio/__tests__/portfolio.repository.test.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { PortfolioRepository } from '../portfolio.repository';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_TEST } }
});

describe('PortfolioRepository', () => {
  let repository: PortfolioRepository;
  let testUserId: string;

  beforeAll(async () => {
    await prisma.$connect();
    repository = new PortfolioRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.transaction.deleteMany();
    await prisma.holding.deleteMany();
    await prisma.portfolio.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hash123'
      }
    });
    testUserId = user.id;
  });

  describe('create', () => {
    it('should create a portfolio', async () => {
      const portfolio = await repository.create({
        name: 'My Portfolio',
        description: 'Test portfolio',
        userId: testUserId
      });

      expect(portfolio.id).toBeDefined();
      expect(portfolio.name).toBe('My Portfolio');
      expect(portfolio.userId).toBe(testUserId);
    });
  });

  describe('findAll', () => {
    it('should return all portfolios for user', async () => {
      await repository.create({
        name: 'Portfolio 1',
        userId: testUserId
      });
      await repository.create({
        name: 'Portfolio 2',
        userId: testUserId
      });

      const portfolios = await repository.findAll(testUserId);

      expect(portfolios).toHaveLength(2);
      expect(portfolios[0].name).toBe('Portfolio 2'); // Ordered by createdAt desc
    });
  });

  describe('setAsDefault', () => {
    it('should set portfolio as default and unset others', async () => {
      const p1 = await repository.create({
        name: 'P1',
        userId: testUserId,
        isDefault: true
      });
      const p2 = await repository.create({
        name: 'P2',
        userId: testUserId
      });

      await repository.setAsDefault(testUserId, p2.id);

      const updated1 = await repository.findById(p1.id);
      const updated2 = await repository.findById(p2.id);

      expect(updated1?.isDefault).toBe(false);
      expect(updated2?.isDefault).toBe(true);
    });
  });
});
```

### Service Unit Test

**File**: `modules/portfolio/__tests__/portfolio.service.test.ts`

```typescript
import { PortfolioService } from '../portfolio.service';
import { PortfolioRepository } from '../portfolio.repository';
import { CalculationsService } from '../../../shared/services/calculations.service';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let mockRepository: jest.Mocked<PortfolioRepository>;
  let mockCalculations: jest.Mocked<CalculationsService>;

  beforeEach(() => {
    // Create mocks
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      setAsDefault: jest.fn(),
      countByUser: jest.fn(),
      exists: jest.fn(),
      findDefaultPortfolio: jest.fn()
    } as any;

    mockCalculations = {
      calculateTotalValue: jest.fn(),
      calculateProfitLoss: jest.fn(),
      calculateProfitLossPercentage: jest.fn()
    } as any;

    // Create service with mocks
    service = new PortfolioService(mockRepository, mockCalculations);
  });

  describe('getPortfolios', () => {
    it('should return portfolios with calculated values', async () => {
      const mockPortfolios = [
        { id: '1', name: 'Test', holdings: [] }
      ];
      mockRepository.findAll.mockResolvedValue(mockPortfolios as any);
      mockCalculations.calculateTotalValue.mockReturnValue(10000);
      mockCalculations.calculateProfitLoss.mockReturnValue(500);
      mockCalculations.calculateProfitLossPercentage.mockReturnValue(5.0);

      const result = await service.getPortfolios('user123');

      expect(result).toHaveLength(1);
      expect(result[0].totalValue).toBe(10000);
      expect(result[0].profitLoss).toBe(500);
      expect(mockRepository.findAll).toHaveBeenCalledWith('user123');
    });
  });

  describe('createPortfolio', () => {
    it('should create portfolio as default if first', async () => {
      mockRepository.countByUser.mockResolvedValue(0); // First portfolio
      mockRepository.create.mockResolvedValue({ id: '1', name: 'Test' } as any);

      await service.createPortfolio('user123', {
        name: 'My Portfolio',
        description: 'Test'
      });

      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'My Portfolio',
        description: 'Test',
        userId: 'user123',
        isDefault: true // Should be default
      });
    });

    it('should throw error if user has 10+ portfolios', async () => {
      mockRepository.countByUser.mockResolvedValue(10);

      await expect(
        service.createPortfolio('user123', { name: 'Test' })
      ).rejects.toThrow('Maximum 10 portfolios allowed');
    });
  });
});
```

### Controller Unit Test

**File**: `modules/portfolio/__tests__/portfolio.controller.test.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { PortfolioController } from '../portfolio.controller';
import { PortfolioService } from '../portfolio.service';

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let mockService: jest.Mocked<PortfolioService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockService = {
      getPortfolios: jest.fn(),
      getPortfolioById: jest.fn(),
      createPortfolio: jest.fn(),
      updatePortfolio: jest.fn(),
      deletePortfolio: jest.fn(),
      setAsDefault: jest.fn()
    } as any;

    controller = new PortfolioController(mockService);

    req = {
      user: { id: 'user123', email: 'test@example.com' },
      params: {},
      body: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('getPortfolios', () => {
    it('should return 200 with portfolios', async () => {
      const mockPortfolios = [{ id: '1', name: 'Test' }];
      mockService.getPortfolios.mockResolvedValue(mockPortfolios as any);

      await controller.getPortfolios(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({
        data: mockPortfolios,
        meta: { count: 1 }
      });
      expect(mockService.getPortfolios).toHaveBeenCalledWith('user123');
    });

    it('should call next on error', async () => {
      const error = new Error('Database error');
      mockService.getPortfolios.mockRejectedValue(error);

      await controller.getPortfolios(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createPortfolio', () => {
    it('should return 201 on success', async () => {
      const mockPortfolio = { id: '1', name: 'New Portfolio' };
      mockService.createPortfolio.mockResolvedValue(mockPortfolio as any);

      req.body = { name: 'New Portfolio', description: 'Test' };

      await controller.createPortfolio(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: mockPortfolio,
        message: 'Portfolio created successfully'
      });
    });
  });
});
```

---

## 8. Common Patterns

### Pattern: Repository with Caching

```typescript
export class MarketDataRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: CacheService
  ) {}

  async findBySymbol(symbol: string): Promise<MarketData | null> {
    // Try cache first
    const cacheKey = `market-data:${symbol}`;
    const cached = await this.cache.get<MarketData>(cacheKey);
    if (cached) return cached;

    // Query database
    const data = await this.prisma.marketData.findUnique({
      where: { symbol }
    });

    // Cache result
    if (data) {
      await this.cache.set(cacheKey, data, 300); // 5 min TTL
    }

    return data;
  }
}
```

### Pattern: Service with Multiple Repositories

```typescript
export class HoldingService {
  constructor(
    private readonly holdingRepo: HoldingRepository,
    private readonly transactionRepo: TransactionRepository,
    private readonly calculations: CalculationsService
  ) {}

  async createHolding(portfolioId: string, dto: CreateHoldingDto) {
    // Create holding
    const holding = await this.holdingRepo.create({
      portfolioId,
      symbol: dto.symbol,
      quantity: dto.quantity,
      averagePrice: dto.price
    });

    // Create initial transaction
    await this.transactionRepo.create({
      holdingId: holding.id,
      type: 'BUY',
      quantity: dto.quantity,
      price: dto.price,
      date: new Date()
    });

    return holding;
  }
}
```

### Pattern: Controller Error Responses

```typescript
// Use custom error classes
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Service throws specific errors
async getPortfolioById(id: string) {
  const portfolio = await this.repository.findById(id);
  if (!portfolio) {
    throw new NotFoundError('Portfolio not found');
  }
  return portfolio;
}

// Error middleware handles them
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  // ... other error types
}
```

---

## 9. Troubleshooting

### Issue 1: "Cannot find module './portfolio.repository'"

**Cause**: TypeScript compilation issue

**Solution**:
```bash
# Rebuild TypeScript
cd backend
npm run build

# Or run in watch mode
npm run dev
```

### Issue 2: Circular Dependencies

**Symptom**: `ReferenceError: Cannot access 'X' before initialization`

**Solution**: Check import order in `app.ts`. Ensure repositories are created before services.

```typescript
// ✅ CORRECT ORDER
const repo = new Repository(prisma);
const service = new Service(repo);

// ❌ WRONG ORDER
const service = new Service(repo); // repo not defined yet!
const repo = new Repository(prisma);
```

### Issue 3: Tests Failing with "Cannot read property 'findMany' of undefined"

**Cause**: Mock not set up correctly

**Solution**:
```typescript
// ❌ BAD: Partial mock
mockRepo = { findAll: jest.fn() } as any;

// ✅ GOOD: Complete mock
mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  // ... all methods
} as any;
```

### Issue 4: "PrismaClient is already connected"

**Cause**: Multiple PrismaClient instances

**Solution**: Singleton pattern
```typescript
// backend/src/db.ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// app.ts
import { getPrisma } from './db';
const prisma = getPrisma();
```

### Issue 5: Routes Not Mounting

**Symptom**: 404 on all endpoints

**Solution**: Check route mounting order
```typescript
// ❌ BAD: Routes mounted after error handler
app.use(errorHandler);
app.use('/api/portfolios', portfolioRoutes); // Won't work!

// ✅ GOOD: Routes before error handler
app.use('/api/portfolios', portfolioRoutes);
app.use(errorHandler); // Must be last!
```

---

## Next Steps

1. ✅ Follow this guide to refactor one module at a time
2. ✅ Write tests as you go (don't batch at the end)
3. ✅ Commit after each module is complete
4. ✅ Run integration tests frequently
5. ✅ Update `CLAUDE.md` with new architecture patterns

**Ready to start?** Begin with the market-data module (simplest).

---

**Quickstart Complete**: 2025-11-18
**Next Step**: Create contracts/ directory with acceptance criteria
