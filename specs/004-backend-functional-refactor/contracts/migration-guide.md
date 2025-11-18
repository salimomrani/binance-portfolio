# Migration Guide: Class-Based to Functional

**Version**: 1.0.0
**Audience**: Developers refactoring existing class-based modules to functional patterns
**Prerequisites**: Read `functional-patterns.md` and `research.md`

## Overview

This guide provides step-by-step instructions for migrating a module from class-based to functional architecture. Follow these steps for each module (portfolio, market-data, holdings, etc.).

## Migration Strategy

**Approach**: Bottom-up, one module at a time

```
Phase 1: Repository
Phase 2: Service
Phase 3: Controller
Phase 4: Routes
Phase 5: App DI
Phase 6: Tests
```

**Estimated Time Per Module**: 2-3 hours

## Pre-Migration Checklist

Before starting migration of a module:

- [ ] All tests are passing
- [ ] Create feature branch from main
- [ ] Record baseline test coverage
- [ ] Commit all pending changes
- [ ] Review `functional-patterns.md` contract

## Phase 1: Refactor Repository

### Step 1.1: Read Existing Class

```typescript
// BEFORE: portfolio.repository.ts
import { PrismaClient, Portfolio } from '@prisma/client';

export class PortfolioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Portfolio | null> {
    return this.prisma.portfolio.findUnique({ where: { id } });
  }

  async create(data: any): Promise<Portfolio> {
    return this.prisma.portfolio.create({ data });
  }

  // ... other methods
}
```

### Step 1.2: Extract Type Definition

Create type definition from class methods:

```typescript
// AFTER: portfolio.repository.ts
import { PrismaClient, Portfolio } from '@prisma/client';

export type PortfolioRepository = {
  findById: (id: string) => Promise<Portfolio | null>;
  create: (data: CreatePortfolioData) => Promise<Portfolio>;
  // ... other methods (copy all public methods)
};
```

**Rule**: Every public method becomes a property in the type.

### Step 1.3: Create Factory Function

Convert class to factory function:

```typescript
export const createPortfolioRepository = (
  prisma: PrismaClient
): PortfolioRepository => ({
  findById: async (id: string) => {
    return prisma.portfolio.findUnique({ where: { id } });
  },

  create: async (data: CreatePortfolioData) => {
    return prisma.portfolio.create({ data });
  },

  // ... other methods
});
```

**Changes**:
- `constructor(private readonly prisma)` → function parameter `(prisma: PrismaClient)`
- `this.prisma` → `prisma` (closure variable)
- `async methodName()` → `methodName: async () =>`
- Class body → object literal with methods

### Step 1.4: Verification

```bash
# TypeScript should compile
npm run build

# Tests should still work (update test imports in next phase)
```

## Phase 2: Refactor Service

### Step 2.1: Read Existing Class

```typescript
// BEFORE: portfolio.service.ts
export class PortfolioService {
  constructor(
    private readonly repository: PortfolioRepository,
    private readonly marketData: MarketDataService,
    private readonly calculations: CalculationsService
  ) {}

  async getPortfolioById(id: string): Promise<PortfolioDetails> {
    const portfolio = await this.repository.findById(id);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }
    // ... business logic
    return details;
  }

  // ... other methods
}
```

### Step 2.2: Extract Type Definition

```typescript
// AFTER: portfolio.service.ts
import type { PortfolioRepository } from './portfolio.repository';
import type { MarketDataService } from '../market-data/market-data.service';
import type { CalculationsService } from '../../shared/services/calculations.service';

export type PortfolioService = {
  getPortfolioById: (id: string) => Promise<PortfolioDetails>;
  createPortfolio: (userId: string, data: CreatePortfolioDto) => Promise<Portfolio>;
  // ... all public methods
};
```

### Step 2.3: Create Factory Function

```typescript
export const createPortfolioService = (
  repository: PortfolioRepository,
  marketData: MarketDataService,
  calculations: CalculationsService
): PortfolioService => ({
  getPortfolioById: async (id: string) => {
    const portfolio = await repository.findById(id);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }
    // ... business logic (same as before)
    return details;
  },

  createPortfolio: async (userId: string, data: CreatePortfolioDto) => {
    // ... implementation
  },

  // ... other methods
});
```

**Changes**:
- All `private readonly` dependencies → function parameters
- `this.repository` → `repository`
- `this.marketData` → `marketData`
- `this.calculations` → `calculations`
- Remove all `this` references

### Step 2.4: Handle Private Methods

**Option 1**: Extract to helper function outside factory (RECOMMENDED)

```typescript
// Helper function outside factory (shared across all instances)
const validatePortfolioData = (data: CreatePortfolioDto): void => {
  if (!data.name || data.name.length < 3) {
    throw new Error('Portfolio name must be at least 3 characters');
  }
};

export const createPortfolioService = (...): PortfolioService => ({
  createPortfolio: async (userId, data) => {
    validatePortfolioData(data); // Use helper
    return repository.create({ ...data, userId });
  },
});
```

**Option 2**: Define inside factory (closure, per-instance)

```typescript
export const createPortfolioService = (...): PortfolioService => {
  // Private helper inside closure
  const validatePortfolioData = (data: CreatePortfolioDto): void => {
    if (!data.name || data.name.length < 3) {
      throw new Error('Portfolio name must be at least 3 characters');
    }
  };

  return {
    createPortfolio: async (userId, data) => {
      validatePortfolioData(data);
      return repository.create({ ...data, userId });
    },
  };
};
```

**Recommendation**: Use Option 1 for stateless helpers (better for memory).

## Phase 3: Refactor Controller

### Step 3.1: Read Existing Class

```typescript
// BEFORE: portfolio.controller.ts
export class PortfolioController {
  constructor(
    private readonly portfolioService: PortfolioService,
    private readonly binanceSyncService?: BinanceSyncService
  ) {}

  async getPortfolios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string || 'mock-user-id';
      const portfolios = await this.portfolioService.getPortfolios(userId);

      res.status(200).json({
        success: true,
        data: portfolios,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  // ... other handler methods
}
```

### Step 3.2: Create Handler Factories

Convert each method to a factory function:

```typescript
// AFTER: portfolio.controller.ts
import type { Request, Response, NextFunction } from 'express';
import type { PortfolioService } from './portfolio.service';
import type { BinanceSyncService } from './binance-sync.service';

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const createGetPortfoliosHandler = (
  service: PortfolioService
): AsyncRequestHandler => {
  return async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'] as string || 'mock-user-id';
      const portfolios = await service.getPortfolios(userId);

      res.status(200).json({
        success: true,
        data: portfolios,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
};

export const createGetPortfolioByIdHandler = (
  service: PortfolioService
): AsyncRequestHandler => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const portfolio = await service.getPortfolioById(id);

      res.status(200).json({
        success: true,
        data: portfolio,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
};

// ... other handler factories
```

**Changes**:
- Each method → separate factory function
- `async methodName(req, res, next)` → `const createMethodNameHandler = (service) => async (req, res, next)`
- `this.portfolioService` → `service` parameter

### Step 3.3: Create Handler Collection Type

```typescript
export type PortfolioHandlers = {
  getPortfolios: AsyncRequestHandler;
  getPortfolioById: AsyncRequestHandler;
  createPortfolio: AsyncRequestHandler;
  updatePortfolio: AsyncRequestHandler;
  deletePortfolio: AsyncRequestHandler;
  getPortfolioStatistics: AsyncRequestHandler;
  getPortfolioAllocation: AsyncRequestHandler;
  syncFromBinance: AsyncRequestHandler;
};
```

## Phase 4: Refactor Routes

### Step 4.1: Read Existing Route Factory

```typescript
// BEFORE: portfolio.routes.ts
import { Router } from 'express';
import { PortfolioController } from './portfolio.controller';

export function createPortfolioRoutes(controller: PortfolioController): Router {
  const router = Router();

  router.get('/', (req, res, next) => controller.getPortfolios(req, res, next));
  router.post('/', validateRequest(CreatePortfolioSchema), (req, res, next) =>
    controller.createPortfolio(req, res, next)
  );
  router.get('/:id', (req, res, next) => controller.getPortfolioById(req, res, next));
  // ... other routes

  return router;
}
```

### Step 4.2: Update to Use Handlers

```typescript
// AFTER: portfolio.routes.ts
import { Router } from 'express';
import type { PortfolioHandlers } from './portfolio.controller';
import { validateRequest } from '../../shared/middleware/validation.middleware';
import { CreatePortfolioSchema, UpdatePortfolioSchema } from './portfolio.validation';

export default function createPortfolioRoutes(
  handlers: PortfolioHandlers
): Router {
  const router = Router();

  router.get('/', handlers.getPortfolios);
  router.post('/', validateRequest(CreatePortfolioSchema), handlers.createPortfolio);
  router.get('/:id', handlers.getPortfolioById);
  router.patch('/:id', validateRequest(UpdatePortfolioSchema), handlers.updatePortfolio);
  router.delete('/:id', handlers.deletePortfolio);
  router.get('/:id/statistics', handlers.getPortfolioStatistics);
  router.get('/:id/allocation', handlers.getPortfolioAllocation);
  router.post('/sync-binance', handlers.syncFromBinance);

  return router;
}
```

**Changes**:
- Accept `handlers: PortfolioHandlers` instead of `controller: PortfolioController`
- Direct handler assignment: `router.get('/', handlers.getPortfolios)`
- Remove lambda wrappers: `(req, res, next) => controller.method(req, res, next)` → `handlers.method`
- Add `export default` for route factory

## Phase 5: Update App DI Composition

### Step 5.1: Read Existing DI Code

```typescript
// BEFORE: app.ts
import { PortfolioRepository } from './modules/portfolio/portfolio.repository';
import { PortfolioService } from './modules/portfolio/portfolio.service';
import { PortfolioController } from './modules/portfolio/portfolio.controller';
import { createPortfolioRoutes } from './modules/portfolio/portfolio.routes';

// Class-based instantiation
const portfolioRepo = new PortfolioRepository(prisma);
const portfolioService = new PortfolioService(portfolioRepo, marketDataService, calculations);
const portfolioController = new PortfolioController(portfolioService, binanceSyncService);
const portfolioRoutes = createPortfolioRoutes(portfolioController);

app.use('/api/portfolios', portfolioRoutes);
```

### Step 5.2: Update to Functional Composition

```typescript
// AFTER: app.ts
import { createPortfolioRepository } from './modules/portfolio/portfolio.repository';
import { createPortfolioService } from './modules/portfolio/portfolio.service';
import {
  createGetPortfoliosHandler,
  createGetPortfolioByIdHandler,
  createCreatePortfolioHandler,
  createUpdatePortfolioHandler,
  createDeletePortfolioHandler,
  createGetPortfolioStatisticsHandler,
  createGetPortfolioAllocationHandler,
  createSyncFromBinanceHandler,
} from './modules/portfolio/portfolio.controller';
import createPortfolioRoutes from './modules/portfolio/portfolio.routes';

// Functional composition
const portfolioRepo = createPortfolioRepository(prisma);
const portfolioService = createPortfolioService(portfolioRepo, marketDataService, calculations);
const portfolioHandlers = {
  getPortfolios: createGetPortfoliosHandler(portfolioService),
  getPortfolioById: createGetPortfolioByIdHandler(portfolioService),
  createPortfolio: createCreatePortfolioHandler(portfolioService),
  updatePortfolio: createUpdatePortfolioHandler(portfolioService),
  deletePortfolio: createDeletePortfolioHandler(portfolioService),
  getPortfolioStatistics: createGetPortfolioStatisticsHandler(portfolioService),
  getPortfolioAllocation: createGetPortfolioAllocationHandler(portfolioService),
  syncFromBinance: createSyncFromBinanceHandler(binanceSyncService),
};
const portfolioRoutes = createPortfolioRoutes(portfolioHandlers);

app.use('/api/portfolios', portfolioRoutes);
```

**Changes**:
- `new ClassName()` → `createClassName()`
- Import individual handler factories
- Create `handlers` object matching `PortfolioHandlers` type
- Pass `handlers` to `createPortfolioRoutes`

## Phase 6: Update Tests

### Step 6.1: Update Repository Tests

```typescript
// BEFORE
import { PortfolioRepository } from '../portfolio.repository';

describe('PortfolioRepository', () => {
  let repository: PortfolioRepository;

  beforeAll(() => {
    repository = new PortfolioRepository(prisma);
  });
});

// AFTER
import { createPortfolioRepository } from '../portfolio.repository';

describe('PortfolioRepository', () => {
  let repository: ReturnType<typeof createPortfolioRepository>;

  beforeAll(() => {
    repository = createPortfolioRepository(prisma);
  });
});
```

**Changes**:
- `new PortfolioRepository(prisma)` → `createPortfolioRepository(prisma)`
- Type: `PortfolioRepository` → `ReturnType<typeof createPortfolioRepository>`
  (or just use the exported `PortfolioRepository` type)

### Step 6.2: Update Service Tests

```typescript
// BEFORE
import { PortfolioService } from '../portfolio.service';
import { PortfolioRepository } from '../portfolio.repository';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let mockRepository: jest.Mocked<PortfolioRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      // ... mock all methods
    } as jest.Mocked<PortfolioRepository>;

    service = new PortfolioService(mockRepository, mockMarketData, mockCalculations);
  });
});

// AFTER
import type { PortfolioRepository } from '../portfolio.repository';
import type { MarketDataService } from '../../market-data/market-data.service';
import { createPortfolioService } from '../portfolio.service';

describe('PortfolioService', () => {
  let service: ReturnType<typeof createPortfolioService>;
  let mockRepository: PortfolioRepository;
  let mockMarketData: MarketDataService;

  beforeEach(() => {
    // Simple object mock (no jest.Mocked needed!)
    mockRepository = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findAllWithHoldings: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findWithHoldingsAndPrices: jest.fn(),
    };

    mockMarketData = {
      getCurrentPrice: jest.fn(),
      getCurrentPrices: jest.fn(),
      getPriceHistory: jest.fn(),
      refreshPrices: jest.fn(),
    };

    service = createPortfolioService(mockRepository, mockMarketData, mockCalculations);
  });
});
```

**Changes**:
- `new PortfolioService()` → `createPortfolioService()`
- `jest.Mocked<Type>` → plain `Type` (simpler!)
- Mock object implements type interface directly

### Step 6.3: Update Controller Tests

```typescript
// BEFORE
import { PortfolioController } from '../portfolio.controller';
import { PortfolioService } from '../portfolio.service';

describe('PortfolioController', () => {
  let controller: PortfolioController;
  let mockService: jest.Mocked<PortfolioService>;

  beforeEach(() => {
    mockService = {
      getPortfolios: jest.fn(),
      // ...
    } as jest.Mocked<PortfolioService>;

    controller = new PortfolioController(mockService);
  });

  it('should return portfolios', async () => {
    mockService.getPortfolios.mockResolvedValue([...]);

    await controller.getPortfolios(mockReq, mockRes, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: expect.any(Array),
    });
  });
});

// AFTER
import type { PortfolioService } from '../portfolio.service';
import { createGetPortfoliosHandler } from '../portfolio.controller';

describe('PortfolioController', () => {
  let mockService: PortfolioService;

  beforeEach(() => {
    mockService = {
      getPortfolios: jest.fn(),
      getPortfolioById: jest.fn(),
      createPortfolio: jest.fn(),
      updatePortfolio: jest.fn(),
      deletePortfolio: jest.fn(),
      calculatePortfolioStatistics: jest.fn(),
      getPortfolioAllocation: jest.fn(),
      calculatePortfolioSummary: jest.fn(),
    };
  });

  it('should return portfolios', async () => {
    mockService.getPortfolios = jest.fn().mockResolvedValue([...]);

    const handler = createGetPortfoliosHandler(mockService);
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: expect.any(Array),
      timestamp: expect.any(String),
    });
  });
});
```

**Changes**:
- Test individual handler factories instead of controller class
- `new PortfolioController()` → `createGetPortfoliosHandler(service)`
- Call handler: `await handler(mockReq, mockRes, mockNext)`

## Phase 7: Cleanup

### Step 7.1: Remove Class Keywords

Search and remove:
- `class` keyword declarations
- `constructor` methods
- `private readonly` modifiers
- `this.` references

### Step 7.2: Verify Exports

Ensure:
- [ ] All types exported with `export type`
- [ ] All factory functions exported with `export const`
- [ ] Routes exported with `export default function`

### Step 7.3: Run Tests

```bash
npm test
npm run test:coverage
```

Ensure:
- [ ] All tests passing
- [ ] Coverage ≥ baseline (should be same or better)

### Step 7.4: Build and Lint

```bash
npm run build
npm run lint
```

Ensure:
- [ ] No TypeScript errors
- [ ] No ESLint errors

## Common Issues and Solutions

### Issue 1: `this` is undefined

**Problem**:
```typescript
// Forgot to remove `this`
return async (id) => {
  return this.repository.findById(id); // ERROR: this is undefined
};
```

**Solution**: Remove all `this.` references
```typescript
return async (id) => {
  return repository.findById(id); // Use closure variable
};
```

### Issue 2: Type errors with mocks

**Problem**:
```typescript
mockRepository = {
  findById: jest.fn(),
  // Missing other methods
};
// TypeScript error: Type '...' is not assignable to type 'PortfolioRepository'
```

**Solution**: Implement ALL methods from type
```typescript
mockRepository = {
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  // ... all methods from PortfolioRepository type
};
```

### Issue 3: Circular dependencies

**Problem**:
```typescript
// moduleA.service.ts
import { createModuleBService } from '../moduleB/moduleB.service';

// moduleB.service.ts
import { createModuleAService } from '../moduleA/moduleA.service';
```

**Solution**: Use type imports + inject at composition
```typescript
// moduleA.service.ts
import type { ModuleBService } from '../moduleB/moduleB.service';

export const createModuleAService = (moduleB: ModuleBService) => { ... };

// app.ts - compose to break cycle
const moduleAService = createModuleAService(moduleBService);
const moduleBService = createModuleBService(moduleAService);
```

### Issue 4: Handler not matching type

**Problem**:
```typescript
// Created handler but forgot to add to handlers object
const portfolioHandlers = {
  getPortfolios: createGetPortfoliosHandler(service),
  // Missing other handlers
};
// TypeScript error: Type is missing properties
```

**Solution**: Add all handlers to match `PortfolioHandlers` type
```typescript
const portfolioHandlers: PortfolioHandlers = {
  getPortfolios: createGetPortfoliosHandler(service),
  getPortfolioById: createGetPortfolioByIdHandler(service),
  createPortfolio: createCreatePortfolioHandler(service),
  // ... all handlers
};
```

## Verification Checklist

After migrating a module:

- [ ] All class keywords removed
- [ ] All `this.` references removed
- [ ] Types exported before implementations
- [ ] Factory functions use `export const`
- [ ] Routes use `export default`
- [ ] App.ts updated with functional composition
- [ ] All tests updated and passing
- [ ] Test coverage ≥ baseline
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors
- [ ] API contracts unchanged (same endpoints, responses)
- [ ] Manual testing passes (smoke test endpoints)

## Module Migration Order

Recommended order:

1. **Portfolio module** (most complete, good reference)
2. **Market-data module** (dependencies, adapters)
3. **Holdings module** (if exists)
4. **Shared services** (calculations, logger if class-based)

## Rollback Plan

If migration fails:

1. Stash or commit functional changes
2. Revert to last working commit
3. Identify issues (TypeScript errors, test failures)
4. Fix issues in isolation
5. Retry migration with fixes

## Summary

This migration transforms class-based modules to functional patterns by:
1. Extracting type definitions from classes
2. Converting classes to factory functions
3. Removing `this` references (use closures)
4. Updating tests to use simple object mocks
5. Composing dependencies in app.ts

**Next**: Follow this guide for each module, starting with portfolio.
