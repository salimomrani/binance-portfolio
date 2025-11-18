# Data Model: Backend Modular Architecture

**Feature**: 003-backend-modular-architecture | **Date**: 2025-11-18

## Overview

This document defines:
1. Current module structure analysis
2. Prisma schema entities and relationships
3. Repository interface definitions
4. Module dependency graph
5. Safe migration order

---

## 1. Prisma Schema Analysis

### Entity Relationship Diagram

```
┌──────────────┐
│     User     │
└──────┬───────┘
       │ 1:N
       ▼
┌──────────────┐
│  Portfolio   │ ◄─── isDefault: boolean
└──────┬───────┘
       │ 1:N
       ▼
┌──────────────┐      ┌──────────────┐
│   Holding    │ ◄──► │ MarketData   │
└──────┬───────┘  N:1 └──────────────┘
       │ 1:N          (symbol)
       ▼
┌──────────────┐
│ Transaction  │
└──────────────┘
```

### Entities

**User** (Auth/Profile)
```prisma
model User {
  id           String      @id @default(uuid())
  email        String      @unique
  passwordHash String
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  portfolios   Portfolio[]
}
```

**Portfolio** (Portfolio Aggregate Root)
```prisma
model Portfolio {
  id          String    @id @default(uuid())
  name        String
  description String?
  isDefault   Boolean   @default(false)
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  holdings    Holding[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Holding** (Holdings Aggregate Root)
```prisma
model Holding {
  id           String        @id @default(uuid())
  portfolioId  String
  portfolio    Portfolio     @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  symbol       String
  quantity     Float
  averagePrice Float
  transactions Transaction[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@unique([portfolioId, symbol])
}
```

**Transaction** (Child of Holding)
```prisma
model Transaction {
  id        String      @id @default(uuid())
  holdingId String
  holding   Holding     @relation(fields: [holdingId], references: [id], onDelete: Cascade)
  type      String      // 'BUY' | 'SELL'
  quantity  Float
  price     Float
  fee       Float       @default(0)
  date      DateTime
  notes     String?
  createdAt DateTime    @default(now())
}
```

**MarketData** (Market Data Cache)
```prisma
model MarketData {
  id              String   @id @default(uuid())
  symbol          String   @unique
  name            String
  currentPrice    Float
  priceChange24h  Float
  priceChangePercentage24h Float
  marketCap       Float?
  volume24h       Float?
  lastUpdated     DateTime @default(now())
}
```

### Aggregate Roots

**Aggregate Root**: An entity that is the entry point to a cluster of related objects.

1. **Portfolio Aggregate**: Portfolio + Holding (read-only access to holdings)
2. **Holding Aggregate**: Holding + Transaction
3. **MarketData**: Standalone entity (no children)
4. **User**: Standalone entity (portfolios are accessed separately)

**Rule**: Each aggregate root gets its own repository.

---

## 2. Repository Interfaces

### PortfolioRepository

```typescript
export class PortfolioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Query methods
  async findAll(userId: string): Promise<Portfolio[]>;
  async findById(id: string): Promise<Portfolio | null>;
  async findByIdWithHoldings(id: string): Promise<Portfolio | null>;
  async findDefaultPortfolio(userId: string): Promise<Portfolio | null>;

  // Command methods
  async create(data: CreatePortfolioData): Promise<Portfolio>;
  async update(id: string, data: UpdatePortfolioData): Promise<Portfolio>;
  async delete(id: string): Promise<void>;
  async setAsDefault(userId: string, portfolioId: string): Promise<void>;

  // Aggregate methods
  async countByUser(userId: string): Promise<number>;
  async exists(id: string): Promise<boolean>;
}

type CreatePortfolioData = {
  name: string;
  description?: string;
  userId: string;
  isDefault?: boolean;
};

type UpdatePortfolioData = {
  name?: string;
  description?: string;
};
```

### HoldingRepository

```typescript
export class HoldingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Query methods
  async findAll(portfolioId: string): Promise<Holding[]>;
  async findById(id: string): Promise<Holding | null>;
  async findBySymbol(portfolioId: string, symbol: string): Promise<Holding | null>;
  async findWithTransactions(id: string): Promise<Holding | null>;

  // Command methods
  async create(data: CreateHoldingData): Promise<Holding>;
  async update(id: string, data: UpdateHoldingData): Promise<Holding>;
  async delete(id: string): Promise<void>;

  // Aggregate methods
  async getTotalValue(portfolioId: string, prices: Map<string, number>): Promise<number>;
  async getSymbols(portfolioId: string): Promise<string[]>;
}

type CreateHoldingData = {
  portfolioId: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
};

type UpdateHoldingData = {
  quantity?: number;
  averagePrice?: number;
};
```

### TransactionRepository

```typescript
export class TransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Query methods
  async findAll(holdingId: string): Promise<Transaction[]>;
  async findById(id: string): Promise<Transaction | null>;
  async findByDateRange(
    holdingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]>;

  // Command methods
  async create(data: CreateTransactionData): Promise<Transaction>;
  async update(id: string, data: UpdateTransactionData): Promise<Transaction>;
  async delete(id: string): Promise<void>;

  // Aggregate methods
  async getTotalInvested(holdingId: string): Promise<number>;
  async getAveragePrice(holdingId: string): Promise<number>;
}

type CreateTransactionData = {
  holdingId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fee?: number;
  date: Date;
  notes?: string;
};

type UpdateTransactionData = {
  type?: 'BUY' | 'SELL';
  quantity?: number;
  price?: number;
  fee?: number;
  date?: Date;
  notes?: string;
};
```

### MarketDataRepository

```typescript
export class MarketDataRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: CacheService
  ) {}

  // Query methods
  async findBySymbol(symbol: string): Promise<MarketData | null>;
  async findBySymbols(symbols: string[]): Promise<MarketData[]>;
  async findAll(limit?: number): Promise<MarketData[]>;

  // Command methods
  async upsert(data: UpsertMarketDataData): Promise<MarketData>;
  async upsertMany(data: UpsertMarketDataData[]): Promise<void>;
  async deleteStale(olderThan: Date): Promise<number>;

  // Cache methods (integrated)
  async findBySymbolCached(symbol: string, ttl: number): Promise<MarketData | null>;
  async invalidateCache(symbol: string): Promise<void>;
}

type UpsertMarketDataData = {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap?: number;
  volume24h?: number;
};
```

---

## 3. Module Dependency Graph

### Module Relationships

```
┌─────────────────────────────────────────────────────┐
│                      Shared                          │
│  - middleware (auth, validation, error)              │
│  - services (calculations, cache)                    │
│  - types, utils                                      │
└──────────────────────┬──────────────────────────────┘
                       │ (used by all modules)
                       ▼
    ┌──────────────────┴──────────────────┐
    │                                      │
    ▼                                      ▼
┌────────────┐                      ┌────────────┐
│ Portfolio  │◄─────────────────────┤ Holdings   │
│  Module    │  (portfolioId)       │  Module    │
└────────────┘                      └──────┬─────┘
                                           │
                                           │ (transactions)
                                           ▼
                                    ┌────────────┐
                                    │Transaction │
                                    │  (child)   │
                                    └────────────┘
         ▲                                │
         │                                │
         │ (market prices)                │
         │                                │
    ┌────┴────────┐                       │
    │ Market-Data │◄──────────────────────┘
    │   Module    │
    └─────────────┘
```

### Dependency Analysis

**Level 0: No Dependencies** (Leaf modules)
- `market-data` - Standalone, external API adapters

**Level 1: Single Dependency**
- `portfolio` - Depends on shared services only
- `holdings` - Depends on shared services only

**Level 2: Cross-Module Dependencies**
- `portfolio` service needs market-data for valuations
- `holdings` service needs market-data for valuations

**Shared Dependencies** (Used by all):
- `shared/middleware` - Validation, auth, error handling
- `shared/services` - Calculations, cache
- `shared/types` - Common types
- `shared/utils` - Helpers

### Migration Order

**Principle**: Refactor leaf modules first, then modules with dependencies.

**Order**:
1. **market-data** (no dependencies, simple CRUD)
2. **portfolio** (simple CRUD, depends only on shared)
3. **holdings** + **transactions** (together, they're one aggregate)
4. **Integration** (update cross-module service calls)
5. **Routes extraction** (all modules)
6. **DI setup** (app.ts)

---

## 4. Current File Structure Analysis

### Existing Files (Before Refactoring)

```bash
backend/src/
├── config/
│   ├── env.config.ts          # ✅ No changes
│   └── database.config.ts     # ✅ No changes
│
├── shared/                    # ✅ No changes (already well-structured)
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validator.middleware.ts
│   ├── services/
│   │   ├── calculations.service.ts
│   │   └── cache.service.ts
│   ├── types/
│   │   └── express.d.ts
│   └── utils/
│       └── logger.ts
│
├── modules/
│   ├── portfolio/
│   │   ├── portfolio.controller.ts    # 🔄 Refactor (remove Prisma, use service only)
│   │   ├── portfolio.service.ts       # 🔄 Refactor (use repository)
│   │   ├── portfolio.validation.ts    # ✅ Keep
│   │   ├── portfolio.types.ts         # ✅ Keep
│   │   └── binance-sync.service.ts    # ✅ Keep (special case)
│   │
│   ├── holdings/
│   │   ├── holdings.controller.ts     # 🔄 Refactor
│   │   ├── holdings.service.ts        # 🔄 Refactor
│   │   ├── holdings.validation.ts     # ✅ Keep
│   │   ├── transaction.service.ts     # 🔄 Refactor
│   │   └── transaction.validation.ts  # ✅ Keep
│   │
│   └── market-data/
│       ├── market-data.controller.ts  # 🔄 Refactor
│       ├── market-data.service.ts     # 🔄 Refactor
│       ├── market-data.cache.ts       # 🔄 Move to repository
│       ├── market-data.types.ts       # ✅ Keep
│       ├── binance.adapter.ts         # ✅ Keep
│       └── coingecko.adapter.ts       # ✅ Keep
│
├── app.ts                      # 🔄 Major refactor (DI container)
└── server.ts                   # ✅ No changes
```

### Files to Create

**Per Module** (portfolio, holdings, market-data):
1. `[module].routes.ts` - Express router factory
2. `[module].repository.ts` - Data access layer
3. `__tests__/[module].controller.test.ts` - Controller unit tests
4. `__tests__/[module].service.test.ts` - Service unit tests
5. `__tests__/[module].repository.test.ts` - Repository integration tests

**For Holdings Module**:
- Additional: `transaction.repository.ts`
- Additional: `__tests__/transaction.repository.test.ts`

**Global Test Setup**:
- `backend/tests/setup.ts` - Test database setup
- `backend/tests/integration/*.integration.test.ts` - E2E tests

**Total New Files**: ~30

---

## 5. Data Flow Diagrams

### Before: Current Architecture

```
HTTP Request
     │
     ▼
┌────────────┐
│ app.ts     │ (Route definitions inline)
└─────┬──────┘
      │
      ▼
┌────────────┐
│ Controller │ (Has Prisma calls!)
└─────┬──────┘
      │
      ▼
┌────────────┐
│  Service   │ (Has Prisma calls!)
└─────┬──────┘
      │
      ▼
┌────────────┐
│   Prisma   │
└─────┬──────┘
      │
      ▼
  Database
```

**Problems**:
- ❌ Controller has database logic
- ❌ Service has database logic
- ❌ Hard to unit test (need DB)
- ❌ Prisma queries duplicated

### After: Layered Architecture

```
HTTP Request
     │
     ▼
┌────────────┐
│ Routes     │ (Express router, middleware)
└─────┬──────┘
      │
      ▼
┌────────────┐
│ Controller │ (HTTP only: req/res)
└─────┬──────┘
      │
      ▼
┌────────────┐
│  Service   │ (Business logic only)
└─────┬──────┘
      │
      ▼
┌────────────┐
│ Repository │ (Data access only)
└─────┬──────┘
      │
      ▼
┌────────────┐
│   Prisma   │
└─────┬──────┘
      │
      ▼
  Database
```

**Benefits**:
- ✅ Clear separation of concerns
- ✅ Each layer testable independently
- ✅ Prisma queries centralized
- ✅ Easy to mock for testing

---

## 6. Migration Complexity Matrix

| Module | Files to Create | Files to Refactor | Lines of Code | Priority | Complexity |
|--------|----------------|-------------------|---------------|----------|------------|
| market-data | 4 (routes, repo, tests) | 2 (controller, service) | ~400 | P1 | Low |
| portfolio | 4 (routes, repo, tests) | 2 (controller, service) | ~500 | P2 | Low |
| holdings + transactions | 6 (routes, repos, tests) | 3 (controllers, services) | ~800 | P3 | Medium |
| app.ts (DI) | 0 | 1 (app.ts) | ~150 | P4 | Medium |
| Integration tests | 5 (E2E tests) | 0 | ~600 | P5 | Medium |
| **TOTAL** | **~30 files** | **~20 files** | **~2450** | - | - |

### Complexity Factors

**Low Complexity** (market-data, portfolio):
- Simple CRUD operations
- No transactions
- No complex relationships
- Direct Prisma queries

**Medium Complexity** (holdings):
- Holding + Transaction (two repositories)
- Service coordinates repositories
- Aggregate root with children
- Transaction support needed

**High Complexity** (integration):
- Cross-module dependencies
- Service needs to call other services
- Shared calculation logic
- Caching integration

---

## 7. Safe Migration Order (Step-by-Step)

### Step 1: Create Infrastructure (Day 1 - Morning)

**Files**:
- `backend/tests/setup.ts`
- `backend/tests/helpers.ts`

**Why First**: Needed for all integration tests

**Estimated Time**: 1 hour

---

### Step 2: Market-Data Module (Day 1 - Afternoon)

**Files to Create**:
1. `modules/market-data/market-data.repository.ts`
2. `modules/market-data/market-data.routes.ts`
3. `modules/market-data/__tests__/market-data.repository.test.ts`
4. `modules/market-data/__tests__/market-data.service.test.ts`
5. `modules/market-data/__tests__/market-data.controller.test.ts`

**Files to Refactor**:
1. `modules/market-data/market-data.service.ts` (use repository)
2. `modules/market-data/market-data.controller.ts` (remove Prisma)

**Why Second**:
- No dependencies
- Simple CRUD
- Good pilot module

**Acceptance Criteria**:
- [ ] All Prisma calls moved to repository
- [ ] Service uses repository only
- [ ] Controller uses service only
- [ ] All existing API endpoints work
- [ ] Tests: 95%+ coverage

**Estimated Time**: 3-4 hours

---

### Step 3: Portfolio Module (Day 2 - Morning)

**Files to Create**:
1. `modules/portfolio/portfolio.repository.ts`
2. `modules/portfolio/portfolio.routes.ts`
3. `modules/portfolio/__tests__/*.test.ts` (3 test files)

**Files to Refactor**:
1. `modules/portfolio/portfolio.service.ts`
2. `modules/portfolio/portfolio.controller.ts`

**Why Third**: Simple CRUD, depends only on shared services

**Acceptance Criteria**:
- [ ] Repository handles all Prisma queries
- [ ] Service uses repository + calculations
- [ ] Tests pass
- [ ] API unchanged

**Estimated Time**: 3-4 hours

---

### Step 4: Holdings + Transactions Module (Day 2 - Afternoon + Day 3 - Morning)

**Files to Create**:
1. `modules/holdings/holdings.repository.ts`
2. `modules/holdings/transaction.repository.ts`
3. `modules/holdings/holdings.routes.ts`
4. `modules/holdings/__tests__/*.test.ts` (4 test files)

**Files to Refactor**:
1. `modules/holdings/holdings.service.ts` (use HoldingRepository + TransactionRepository)
2. `modules/holdings/holdings.controller.ts`
3. `modules/holdings/transaction.service.ts` (use TransactionRepository)

**Why Fourth**: More complex (two repositories, aggregate root)

**Acceptance Criteria**:
- [ ] Two repositories work together
- [ ] Service coordinates repositories
- [ ] Transactions work correctly
- [ ] Average price calculations correct
- [ ] Tests pass

**Estimated Time**: 6-8 hours

---

### Step 5: Extract Routes + DI Setup (Day 3 - Afternoon)

**Files to Refactor**:
1. `app.ts` - Major refactor with DI container

**Pattern**:
```typescript
// app.ts - DI Container
const prisma = new PrismaClient();

// Market-data module
const marketDataRepo = new MarketDataRepository(prisma);
const marketDataService = new MarketDataService(marketDataRepo, ...);
const marketDataController = new MarketDataController(marketDataService);
const marketDataRoutes = createMarketDataRoutes(marketDataController);

// Mount routes
app.use('/api/market-data', marketDataRoutes);
app.use('/api/portfolios', portfolioRoutes);
app.use('/api/holdings', holdingRoutes);
```

**Acceptance Criteria**:
- [ ] All routes mounted correctly
- [ ] Dependencies injected explicitly
- [ ] No circular dependencies
- [ ] Server starts successfully
- [ ] All endpoints work

**Estimated Time**: 2-3 hours

---

### Step 6: Integration Tests (Day 4)

**Files to Create**:
1. `backend/tests/integration/portfolio.integration.test.ts`
2. `backend/tests/integration/holdings.integration.test.ts`
3. `backend/tests/integration/market-data.integration.test.ts`

**Acceptance Criteria**:
- [ ] Full HTTP tests with Supertest
- [ ] Real database (test DB)
- [ ] Test all CRUD operations
- [ ] Test error cases
- [ ] Test validation

**Estimated Time**: 4-6 hours

---

### Step 7: Verification & Documentation (Day 5)

**Tasks**:
1. Run full test suite
2. Performance benchmarking
3. Update README with architecture docs
4. Code review
5. Merge to main

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Coverage ≥85%
- [ ] Performance unchanged (or better)
- [ ] Documentation updated
- [ ] Zero API regressions

**Estimated Time**: 2-4 hours

---

## 8. Rollback Strategy

### Rollback Points

Each step is a safe commit point. If issues arise:

**Step 2 Issues**: Revert market-data commits
**Step 3 Issues**: Revert portfolio commits (market-data still refactored)
**Step 4 Issues**: Revert holdings commits (market-data + portfolio still refactored)
**Step 5 Issues**: Revert app.ts changes (all modules still refactored but not wired)

### Feature Flags (Optional)

```typescript
// app.ts
const USE_NEW_ARCHITECTURE = process.env.USE_NEW_ARCHITECTURE === 'true';

if (USE_NEW_ARCHITECTURE) {
  // New DI setup
  app.use('/api/portfolios', newPortfolioRoutes);
} else {
  // Old routes (fallback)
  app.use('/api/portfolios', legacyPortfolioRoutes);
}
```

**Decision**: Not needed for this refactoring (low risk, gradual rollout).

---

## 9. Database Migrations

**Question**: Are database schema changes needed?

**Answer**: NO. This is a code refactoring only. Prisma schema remains identical.

**Verification**:
```bash
# Ensure no schema changes
git diff main prisma/schema.prisma
# Should output: no changes
```

---

## 10. Summary

### Key Decisions

| Aspect | Decision |
|--------|----------|
| Migration Order | market-data → portfolio → holdings → DI → tests |
| Repository Scope | One per aggregate root (3 total) |
| Test Strategy | Integration tests for repos, unit tests for services/controllers |
| Rollback Strategy | Git revert per module |
| Database Changes | None |

### Estimated Timeline

- **Day 1**: Infrastructure + market-data (4-5 hours)
- **Day 2**: portfolio + holdings start (7-8 hours)
- **Day 3**: holdings finish + DI setup (6-8 hours)
- **Day 4**: Integration tests (4-6 hours)
- **Day 5**: Verification (2-4 hours)
- **Total**: 23-31 hours (~4-5 working days)

### Success Metrics

- ✅ 100% API compatibility maintained
- ✅ Test coverage ≥85%
- ✅ All Prisma calls in repositories
- ✅ Zero performance degradation
- ✅ All routes in separate files
- ✅ Explicit dependency injection

---

**Data Model Complete**: 2025-11-18
**Next Step**: Create quickstart.md with practical migration examples
