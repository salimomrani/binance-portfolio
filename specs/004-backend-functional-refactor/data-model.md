# Data Model: Functional Type Definitions

**Feature**: 004-backend-functional-refactor
**Date**: 2025-11-18
**Purpose**: Define TypeScript types and interfaces for functional architecture patterns

## Overview

This document defines the type system for the functional backend architecture. Unlike traditional data models that describe database entities, this "data model" describes the **contracts** for functional modules: Repository types, Service types, Controller types, and their composition patterns.

## Type Hierarchy

```
Factory Function → Type Definition (Contract) → Implementation
     ↓                      ↓                          ↓
createRepo()          PortfolioRepo             { methods }
```

## 1. Repository Layer Types

Repositories handle all Prisma/database interactions.

### 1.1 Repository Type Pattern

```typescript
// Pattern: Type definition first, implementation second
export type {ModuleName}Repository = {
  // CRUD operations return Prisma types
  findById: (id: string) => Promise<Entity | null>;
  findAll: (filters?: Filters) => Promise<Entity[]>;
  create: (data: CreateDto) => Promise<Entity>;
  update: (id: string, data: UpdateDto) => Promise<Entity>;
  delete: (id: string) => Promise<void>;

  // Custom queries
  customQuery: (params: Params) => Promise<Result>;
};

// Factory function signature
export const create{ModuleName}Repository: (prisma: PrismaClient) => {ModuleName}Repository;
```

### 1.2 Portfolio Repository Type

```typescript
// portfolio.repository.ts
import { PrismaClient, Portfolio, Holding } from '@prisma/client';
import { CreatePortfolioDto, UpdatePortfolioDto } from './portfolio.validation';

export type PortfolioWithHoldings = Portfolio & {
  holdings: Holding[];
};

export type PortfolioRepository = {
  // Basic CRUD
  findById: (id: string) => Promise<Portfolio | null>;
  findByUserId: (userId: string) => Promise<Portfolio[]>;
  findAllWithHoldings: (userId: string) => Promise<PortfolioWithHoldings[]>;
  create: (data: {
    userId: string;
    name: string;
    description?: string;
  }) => Promise<Portfolio>;
  update: (id: string, data: UpdatePortfolioDto) => Promise<Portfolio>;
  delete: (id: string) => Promise<void>;

  // Custom queries
  findWithHoldingsAndPrices: (id: string) => Promise<PortfolioWithHoldings | null>;
};

// Factory function type
export type CreatePortfolioRepository = (prisma: PrismaClient) => PortfolioRepository;
```

### 1.3 Market Data Repository Type

```typescript
// market-data.repository.ts
import { PrismaClient, Price } from '@prisma/client';

export type PriceData = {
  symbol: string;
  price: number;
  timestamp: Date;
  source: 'binance' | 'coingecko';
};

export type MarketDataRepository = {
  // Price operations
  getLatestPrice: (symbol: string) => Promise<Price | null>;
  getLatestPrices: (symbols: string[]) => Promise<Map<string, Price>>;
  savePrices: (prices: PriceData[]) => Promise<void>;

  // Historical data
  getPriceHistory: (symbol: string, from: Date, to: Date) => Promise<Price[]>;
};

export type CreateMarketDataRepository = (prisma: PrismaClient) => MarketDataRepository;
```

## 2. Service Layer Types

Services contain business logic and orchestrate repository calls.

### 2.1 Service Type Pattern

```typescript
// Pattern: Dependencies injected via factory function
export type {ModuleName}Service = {
  // Business logic methods
  getEntity: (id: string) => Promise<EntityDto>;
  listEntities: (filters?: Filters) => Promise<EntityDto[]>;
  createEntity: (userId: string, data: CreateDto) => Promise<EntityDto>;
  updateEntity: (id: string, data: UpdateDto) => Promise<EntityDto>;
  deleteEntity: (id: string) => Promise<void>;

  // Business operations (calculations, transformations)
  calculateSomething: (id: string) => Promise<CalculationResult>;
};

// Factory function signature (with dependencies)
export const create{ModuleName}Service: (
  repository: {ModuleName}Repository,
  otherDeps?: OtherService
) => {ModuleName}Service;
```

### 2.2 Portfolio Service Type

```typescript
// portfolio.service.ts
import { Portfolio } from '@prisma/client';
import {
  CreatePortfolioDto,
  UpdatePortfolioDto,
  PortfolioSummary,
  PortfolioDetails,
  PortfolioStatistics,
  AllocationData
} from './portfolio.types';
import { PortfolioRepository } from './portfolio.repository';
import { MarketDataService } from '../market-data/market-data.service';
import { CalculationsService } from '../../shared/services/calculations.service';

export type PortfolioService = {
  // CRUD operations
  createPortfolio: (userId: string, data: CreatePortfolioDto) => Promise<Portfolio>;
  getPortfolios: (userId: string) => Promise<PortfolioSummary[]>;
  getPortfolioById: (id: string) => Promise<PortfolioDetails>;
  updatePortfolio: (id: string, data: UpdatePortfolioDto) => Promise<Portfolio>;
  deletePortfolio: (id: string) => Promise<void>;

  // Business operations
  calculatePortfolioStatistics: (id: string) => Promise<PortfolioStatistics>;
  getPortfolioAllocation: (id: string) => Promise<AllocationData[]>;
  calculatePortfolioSummary: (id: string) => Promise<PortfolioSummary>;
};

// Factory function type
export type CreatePortfolioService = (
  repository: PortfolioRepository,
  marketData: MarketDataService,
  calculations: CalculationsService
) => PortfolioService;
```

### 2.3 Market Data Service Type

```typescript
// market-data.service.ts
import { MarketDataRepository } from './market-data.repository';
import { BinanceAdapter } from './binance.adapter';
import { CoingeckoAdapter } from './coingecko.adapter';
import { MarketDataCache } from './market-data.cache';

export type PriceInfo = {
  symbol: string;
  price: number;
  change24h: number;
  timestamp: Date;
};

export type MarketDataService = {
  // Price fetching
  getCurrentPrice: (symbol: string) => Promise<PriceInfo>;
  getCurrentPrices: (symbols: string[]) => Promise<Map<string, PriceInfo>>;

  // Historical data
  getPriceHistory: (symbol: string, from: Date, to: Date) => Promise<PriceInfo[]>;

  // Cache management
  refreshPrices: (symbols: string[]) => Promise<void>;
};

export type CreateMarketDataService = (
  repository: MarketDataRepository,
  binanceAdapter: BinanceAdapter,
  coingeckoAdapter: CoingeckoAdapter,
  cache: MarketDataCache
) => MarketDataService;
```

## 3. Controller Layer Types

Controllers handle HTTP requests and responses. Each endpoint has its own handler factory.

### 3.1 Handler Type Pattern

```typescript
import { Request, Response, NextFunction } from 'express';

// Standard Express async handler
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Handler factory pattern
export const create{Action}Handler: (service: {ModuleName}Service) => AsyncRequestHandler;
```

### 3.2 Portfolio Handlers Type

```typescript
// portfolio.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PortfolioService } from './portfolio.service';
import { BinanceSyncService } from './binance-sync.service';

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

// Individual handler factories
export type CreateGetPortfoliosHandler = (service: PortfolioService) => AsyncRequestHandler;
export type CreateGetPortfolioByIdHandler = (service: PortfolioService) => AsyncRequestHandler;
export type CreateCreatePortfolioHandler = (service: PortfolioService) => AsyncRequestHandler;
export type CreateUpdatePortfolioHandler = (service: PortfolioService) => AsyncRequestHandler;
export type CreateDeletePortfolioHandler = (service: PortfolioService) => AsyncRequestHandler;
export type CreateGetPortfolioStatisticsHandler = (service: PortfolioService) => AsyncRequestHandler;
export type CreateGetPortfolioAllocationHandler = (service: PortfolioService) => AsyncRequestHandler;
export type CreateSyncFromBinanceHandler = (
  binanceSyncService?: BinanceSyncService
) => AsyncRequestHandler;

// Handler collection type (for routes)
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

### 3.3 Market Data Handlers Type

```typescript
// market-data.controller.ts
import { Request, Response, NextFunction } from 'express';
import { MarketDataService } from './market-data.service';

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export type CreateGetPriceHandler = (service: MarketDataService) => AsyncRequestHandler;
export type CreateGetPricesHandler = (service: MarketDataService) => AsyncRequestHandler;
export type CreateGetPriceHistoryHandler = (service: MarketDataService) => AsyncRequestHandler;

export type MarketDataHandlers = {
  getPrice: AsyncRequestHandler;
  getPrices: AsyncRequestHandler;
  getPriceHistory: AsyncRequestHandler;
};
```

## 4. Route Layer Types

Routes wire handlers to Express routes.

### 4.1 Route Factory Pattern

```typescript
import { Router } from 'express';

// Route factory type (default export)
export default function create{ModuleName}Routes(
  handlers: {ModuleName}Handlers
): Router;
```

### 4.2 Example Route Factories

```typescript
// portfolio.routes.ts
import { Router } from 'express';
import { PortfolioHandlers } from './portfolio.controller';
import { validateRequest } from '../../shared/middleware/validation.middleware';
import { CreatePortfolioSchema, UpdatePortfolioSchema } from './portfolio.validation';

export default function createPortfolioRoutes(handlers: PortfolioHandlers): Router {
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

// market-data.routes.ts
import { Router } from 'express';
import { MarketDataHandlers } from './market-data.controller';

export default function createMarketDataRoutes(handlers: MarketDataHandlers): Router {
  const router = Router();

  router.get('/price/:symbol', handlers.getPrice);
  router.get('/prices', handlers.getPrices);
  router.get('/history/:symbol', handlers.getPriceHistory);

  return router;
}
```

## 5. Dependency Injection Composition

### 5.1 App-Level DI Pattern

```typescript
// app.ts - Compose all dependencies
import { PrismaClient } from '@prisma/client';
import express from 'express';

// Import factory functions
import { createPortfolioRepository } from './modules/portfolio/portfolio.repository';
import { createPortfolioService } from './modules/portfolio/portfolio.service';
import {
  createGetPortfoliosHandler,
  createCreatePortfolioHandler,
  // ... other handler factories
} from './modules/portfolio/portfolio.controller';
import createPortfolioRoutes from './modules/portfolio/portfolio.routes';

// Shared dependencies
const prisma = new PrismaClient();
const calculations = createCalculationsService();

// Portfolio module composition
const portfolioRepo = createPortfolioRepository(prisma);
const portfolioService = createPortfolioService(portfolioRepo, marketDataService, calculations);
const portfolioHandlers = {
  getPortfolios: createGetPortfoliosHandler(portfolioService),
  createPortfolio: createCreatePortfolioHandler(portfolioService),
  // ... other handlers
};
const portfolioRoutes = createPortfolioRoutes(portfolioHandlers);

// Mount routes
app.use('/api/portfolios', portfolioRoutes);
```

## 6. Shared Service Types

### 6.1 Calculations Service

```typescript
// shared/services/calculations.service.ts
import Decimal from 'decimal.js';

export type CalculationsService = {
  calculatePercentageChange: (initial: Decimal, current: Decimal) => Decimal;
  calculateTotalValue: (holdings: Array<{ quantity: Decimal; price: Decimal }>) => Decimal;
  calculateAllocation: (value: Decimal, totalValue: Decimal) => Decimal;
};

export const createCalculationsService = (): CalculationsService => ({
  calculatePercentageChange: (initial, current) => {
    if (initial.isZero()) return new Decimal(0);
    return current.minus(initial).div(initial).mul(100);
  },

  calculateTotalValue: (holdings) => {
    return holdings.reduce(
      (sum, h) => sum.plus(h.quantity.mul(h.price)),
      new Decimal(0)
    );
  },

  calculateAllocation: (value, totalValue) => {
    if (totalValue.isZero()) return new Decimal(0);
    return value.div(totalValue).mul(100);
  },
});
```

## 7. Type Export Strategy

### 7.1 Module Exports Pattern

Each module exports:
1. **Types**: Repository type, Service type, Handler types
2. **Factory functions**: `createRepository`, `createService`, `createHandlers`
3. **Default export**: Route factory (only in routes file)

```typescript
// portfolio.repository.ts
export type PortfolioRepository = { ... };
export const createPortfolioRepository = (prisma: PrismaClient): PortfolioRepository => { ... };

// portfolio.service.ts
export type PortfolioService = { ... };
export const createPortfolioService = (
  repo: PortfolioRepository,
  ...
): PortfolioService => { ... };

// portfolio.controller.ts
export type PortfolioHandlers = { ... };
export const createGetPortfoliosHandler = (service: PortfolioService) => { ... };
// ... other handler factories

// portfolio.routes.ts
export default function createPortfolioRoutes(handlers: PortfolioHandlers): Router { ... }
```

### 7.2 Type-Only Imports

Use type-only imports when only importing types:

```typescript
import type { PortfolioRepository } from './portfolio.repository';
import type { MarketDataService } from '../market-data/market-data.service';

// Actual import for factory function
import { createPortfolioService } from './portfolio.service';
```

**Benefit**: Better tree-shaking, clearer intent

## 8. Testing Type Patterns

### 8.1 Mock Type Pattern

```typescript
// __tests__/portfolio.service.test.ts
import type { PortfolioRepository } from '../portfolio.repository';
import type { MarketDataService } from '../../market-data/market-data.service';
import { createPortfolioService } from '../portfolio.service';

describe('PortfolioService', () => {
  let mockRepo: PortfolioRepository;
  let mockMarketData: MarketDataService;

  beforeEach(() => {
    // Create mock that implements the type
    mockRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      // ... implement all methods from PortfolioRepository type
    };

    mockMarketData = {
      getCurrentPrice: jest.fn(),
      getCurrentPrices: jest.fn(),
      // ... implement all methods
    };
  });

  it('should do something', async () => {
    const service = createPortfolioService(mockRepo, mockMarketData, mockCalculations);
    // test service
  });
});
```

**Advantage**: TypeScript ensures mock implements complete interface

## 9. Migration Mapping

### 9.1 Class → Function Mapping

| Class Pattern | Functional Pattern |
|---------------|-------------------|
| `class XxxRepository` | `type XxxRepository = { ... }` + `const createXxxRepository` |
| `class XxxService` | `type XxxService = { ... }` + `const createXxxService` |
| `class XxxController` | Individual handler factories: `createGetXxxHandler`, etc. |
| `constructor(deps)` | Factory function parameters: `(deps) => { ... }` |
| `this.dependency.method()` | `dependency.method()` (no `this`) |
| `export class Xxx` | `export const createXxx` + `export type Xxx` |
| `new XxxService(deps)` | `createXxxService(deps)` |

### 9.2 Type Definition Location

- **Before (classes)**: No explicit type (class IS the type)
- **After (functions)**: Type defined separately from implementation

```typescript
// Before
export class PortfolioService {
  constructor(private repo: PortfolioRepository) {}
  async getPortfolio(id: string) { ... }
}

// After
export type PortfolioService = {
  getPortfolio: (id: string) => Promise<Portfolio>;
};
export const createPortfolioService = (repo: PortfolioRepository): PortfolioService => ({
  getPortfolio: async (id) => { ... },
});
```

## Summary

This functional type system provides:
- **Clear contracts**: Types define interfaces, factories implement them
- **Explicit dependencies**: All deps visible in function parameters
- **Easy testing**: Mocks implement type interfaces
- **Type safety**: TypeScript enforces complete implementations
- **Tree-shaking**: Named exports enable dead code elimination

**Next**: See `contracts/functional-patterns.md` for detailed implementation patterns and `contracts/migration-guide.md` for step-by-step refactoring instructions.
