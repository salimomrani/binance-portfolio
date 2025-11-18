# Feature Specification: Backend Modular Architecture

**Feature ID**: 003-backend-modular-architecture
**Priority**: P2 - Technical Debt / Architecture
**Status**: Planning
**Created**: 2025-11-18

## Overview

Refactor the backend architecture to follow a consistent, scalable modular pattern with clear separation of concerns. Each module will have distinct layers: routes, controllers, services, repositories, and validation schemas.

## Background

The current backend has modules with some structure (controller, service, validation) but lacks:
- **Repository layer** for data access abstraction
- **Separate route files** for Express routing
- **Consistent module structure** across all modules
- **Clear dependency injection patterns**
- **Testability** through proper layering

This refactoring will establish a solid foundation for:
- ✅ Better testability (mock repositories easily)
- ✅ Easier maintenance (clear responsibilities)
- ✅ Scalability (add features without breaking existing code)
- ✅ Code reusability (repositories can be shared)
- ✅ Database abstraction (easier to switch ORMs)

## Goals

### Primary Goal
Establish a consistent, scalable backend architecture with proper separation of concerns across all modules.

### Success Criteria
- All modules follow the same structure pattern
- Repository layer abstracts Prisma data access
- Routes are separated from controllers
- Dependency injection is explicit and testable
- All existing functionality works identically
- Tests cover all layers (unit, integration)
- Code is more maintainable and readable

## User Stories

### US1: Developer - Clear Module Structure
**As a** developer
**I want** each module to have a predictable structure
**So that** I can navigate and understand the codebase quickly

**Acceptance Criteria**:
- Every module has: routes, controller, service, repository, validation
- File naming is consistent: `[module].routes.ts`, `[module].controller.ts`, etc.
- Imports follow a clear pattern
- Dependencies are injected, not hardcoded

### US2: Developer - Repository Pattern
**As a** developer
**I want** a repository layer for data access
**So that** I can test business logic without hitting the database

**Acceptance Criteria**:
- Repository handles all Prisma calls
- Service layer depends on repository interface
- Repositories can be mocked in tests
- No Prisma calls outside repositories

### US3: Developer - Route Separation
**As a** developer
**I want** routes defined in separate files
**So that** API structure is clear and maintainable

**Acceptance Criteria**:
- Each module has a `[module].routes.ts` file
- Routes file only defines endpoints and middleware
- Controller methods handle request/response logic
- `app.ts` imports and mounts module routes

### US4: Developer - Testable Architecture
**As a** developer
**I want** each layer to be independently testable
**So that** tests are fast, reliable, and maintainable

**Acceptance Criteria**:
- Unit tests for services (mock repository)
- Unit tests for controllers (mock service)
- Integration tests for repositories (real database)
- Route tests for full HTTP flow

## Architecture Layers

### Layered Architecture Pattern

```
Request → Routes → Controller → Service → Repository → Database
                        ↓
                  Validation (Zod)
                        ↓
                   Error Handler
```

### Layer Responsibilities

**1. Routes Layer** (`[module].routes.ts`)
- Define Express routes
- Apply middleware (auth, validation, rate limiting)
- Map routes to controller methods
- NO business logic

**2. Controller Layer** (`[module].controller.ts`)
- Parse request parameters
- Call service methods
- Format response
- Handle HTTP-specific concerns (status codes, headers)
- NO business logic

**3. Service Layer** (`[module].service.ts`)
- Implement business logic
- Coordinate between repositories
- Handle transactions
- Apply business rules
- NO database calls (use repository)

**4. Repository Layer** (`[module].repository.ts`) **NEW**
- Abstract Prisma/database calls
- Provide CRUD operations
- Handle query optimization
- NO business logic

**5. Validation Layer** (`[module].validation.ts`)
- Define Zod schemas
- Validate DTOs
- Transform input data
- NO business logic

### Module Structure

```
backend/src/modules/[module-name]/
├── [module].routes.ts       # Express routes
├── [module].controller.ts   # HTTP handlers
├── [module].service.ts      # Business logic
├── [module].repository.ts   # Data access (NEW)
├── [module].validation.ts   # Zod schemas
├── [module].types.ts        # TypeScript interfaces
└── __tests__/               # Tests
    ├── [module].controller.test.ts
    ├── [module].service.test.ts
    └── [module].repository.test.ts
```

## Scope

### In Scope

**Modules to Refactor**:
1. ✅ `portfolio` - Portfolio management
2. ✅ `holdings` - Cryptocurrency holdings
3. ✅ `market-data` - Price data and market info
4. ✅ `watchlist` - Watch list management (if implemented)
5. ✅ `auth` - Authentication (if implemented)

**Files to Create/Update per Module**:
- Create: `[module].repository.ts` (NEW)
- Create: `[module].routes.ts` (NEW)
- Update: `[module].controller.ts` (refactor to use service only)
- Update: `[module].service.ts` (refactor to use repository only)
- Keep: `[module].validation.ts` (already exists)
- Keep: `[module].types.ts` (already exists)

### Out of Scope
- Frontend code
- Shared utilities and middleware (already well-structured)
- Prisma schema changes
- Database migrations
- Authentication/authorization logic changes

## Technical Requirements

### Repository Pattern

```typescript
// portfolio.repository.ts
import { PrismaClient, Portfolio, Prisma } from '@prisma/client';

export class PortfolioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(userId: string): Promise<Portfolio[]> {
    return this.prisma.portfolio.findMany({
      where: { userId },
      include: { holdings: true }
    });
  }

  async findById(id: string): Promise<Portfolio | null> {
    return this.prisma.portfolio.findUnique({
      where: { id },
      include: { holdings: true }
    });
  }

  async create(data: Prisma.PortfolioCreateInput): Promise<Portfolio> {
    return this.prisma.portfolio.create({ data });
  }

  async update(id: string, data: Prisma.PortfolioUpdateInput): Promise<Portfolio> {
    return this.prisma.portfolio.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.portfolio.delete({ where: { id } });
  }
}
```

### Service Layer

```typescript
// portfolio.service.ts
import { PortfolioRepository } from './portfolio.repository';
import { CreatePortfolioDto } from './portfolio.validation';
import { CalculationsService } from '../../shared/services/calculations.service';

export class PortfolioService {
  constructor(
    private readonly repository: PortfolioRepository,
    private readonly calculations: CalculationsService
  ) {}

  async getPortfolios(userId: string) {
    const portfolios = await this.repository.findAll(userId);

    // Business logic: calculate totals
    return portfolios.map(p => ({
      ...p,
      totalValue: this.calculations.calculateTotalValue(p.holdings)
    }));
  }

  async createPortfolio(userId: string, dto: CreatePortfolioDto) {
    // Business logic: validate and transform
    const data = {
      name: dto.name,
      description: dto.description,
      userId,
      isDefault: false
    };

    return this.repository.create(data);
  }
}
```

### Controller Layer

```typescript
// portfolio.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PortfolioService } from './portfolio.service';

export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}

  async getPortfolios(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id; // From auth middleware
      const portfolios = await this.service.getPortfolios(userId);
      res.json({ data: portfolios });
    } catch (error) {
      next(error);
    }
  }

  async createPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const portfolio = await this.service.createPortfolio(userId, req.body);
      res.status(201).json({ data: portfolio });
    } catch (error) {
      next(error);
    }
  }
}
```

### Routes Layer

```typescript
// portfolio.routes.ts
import { Router } from 'express';
import { PortfolioController } from './portfolio.controller';
import { validateRequest } from '../../shared/middleware/validator';
import { CreatePortfolioSchema } from './portfolio.validation';

export function createPortfolioRoutes(controller: PortfolioController): Router {
  const router = Router();

  router.get('/', (req, res, next) => controller.getPortfolios(req, res, next));

  router.post('/',
    validateRequest(CreatePortfolioSchema),
    (req, res, next) => controller.createPortfolio(req, res, next)
  );

  router.get('/:id', (req, res, next) => controller.getPortfolioById(req, res, next));

  router.patch('/:id',
    validateRequest(UpdatePortfolioSchema),
    (req, res, next) => controller.updatePortfolio(req, res, next)
  );

  router.delete('/:id', (req, res, next) => controller.deletePortfolio(req, res, next));

  return router;
}
```

### Dependency Injection

```typescript
// app.ts
import { PrismaClient } from '@prisma/client';
import { PortfolioRepository } from './modules/portfolio/portfolio.repository';
import { PortfolioService } from './modules/portfolio/portfolio.service';
import { PortfolioController } from './modules/portfolio/portfolio.controller';
import { createPortfolioRoutes } from './modules/portfolio/portfolio.routes';

const prisma = new PrismaClient();
const calculations = new CalculationsService();

// Dependency injection
const portfolioRepo = new PortfolioRepository(prisma);
const portfolioService = new PortfolioService(portfolioRepo, calculations);
const portfolioController = new PortfolioController(portfolioService);
const portfolioRoutes = createPortfolioRoutes(portfolioController);

app.use('/api/portfolios', portfolioRoutes);
```

## Testing Strategy

### Repository Tests (Integration)
```typescript
// portfolio.repository.test.ts
describe('PortfolioRepository', () => {
  let prisma: PrismaClient;
  let repository: PortfolioRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = new PortfolioRepository(prisma);
  });

  it('should create portfolio', async () => {
    const data = { name: 'Test', userId: '123' };
    const portfolio = await repository.create(data);
    expect(portfolio.name).toBe('Test');
  });
});
```

### Service Tests (Unit)
```typescript
// portfolio.service.test.ts
describe('PortfolioService', () => {
  let service: PortfolioService;
  let mockRepo: jest.Mocked<PortfolioRepository>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      create: jest.fn(),
      // ... other methods
    } as any;
    service = new PortfolioService(mockRepo, new CalculationsService());
  });

  it('should get portfolios with calculated totals', async () => {
    mockRepo.findAll.mockResolvedValue([{ id: '1', holdings: [] }]);
    const result = await service.getPortfolios('user123');
    expect(result[0].totalValue).toBeDefined();
  });
});
```

### Controller Tests (Unit)
```typescript
// portfolio.controller.test.ts
describe('PortfolioController', () => {
  let controller: PortfolioController;
  let mockService: jest.Mocked<PortfolioService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockService = {
      getPortfolios: jest.fn(),
      // ... other methods
    } as any;
    controller = new PortfolioController(mockService);

    req = { user: { id: 'user123' } };
    res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  it('should return portfolios', async () => {
    mockService.getPortfolios.mockResolvedValue([]);
    await controller.getPortfolios(req as Request, res as Response, next);
    expect(res.json).toHaveBeenCalledWith({ data: [] });
  });
});
```

## Migration Strategy

### Phase 1: Create Repository Layer
1. Create `[module].repository.ts` for each module
2. Move all Prisma calls from service to repository
3. Update service to use repository
4. Write repository integration tests

### Phase 2: Extract Routes
1. Create `[module].routes.ts` for each module
2. Move route definitions from controller/app.ts
3. Update `app.ts` to import and mount routes
4. Test all endpoints still work

### Phase 3: Refactor Controllers
1. Ensure controllers only handle HTTP concerns
2. Move business logic to services if needed
3. Write controller unit tests

### Phase 4: Add Dependency Injection
1. Update `app.ts` with explicit DI
2. Remove hardcoded dependencies
3. Make everything testable

### Phase 5: Comprehensive Testing
1. Add unit tests for all layers
2. Add integration tests
3. Verify 100% existing functionality

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing API | High | Medium | Comprehensive testing, gradual rollout |
| Performance degradation | Medium | Low | Benchmark before/after |
| Increased complexity | Low | Low | Clear documentation, consistent patterns |
| Test coverage gaps | Medium | Medium | Required tests for each layer |

## Success Metrics

- ✅ 100% of modules follow new structure
- ✅ All Prisma calls in repository layer only
- ✅ All routes in separate `.routes.ts` files
- ✅ Test coverage ≥80% (unit + integration)
- ✅ Zero API regressions
- ✅ Code duplication reduced
- ✅ Build time unchanged or faster

## Timeline Estimate

- Phase 1 (Repositories): 4-6 hours
- Phase 2 (Routes): 2-3 hours
- Phase 3 (Controllers): 2-3 hours
- Phase 4 (DI): 1-2 hours
- Phase 5 (Testing): 4-6 hours
- **Total**: 13-20 hours

## References

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Dependency Injection in Node.js](https://www.freecodecamp.org/news/a-quick-intro-to-dependency-injection-what-it-is-and-when-to-use-it-7578c84fa88f/)
- [Layered Architecture](https://www.oreilly.com/library/view/software-architecture-patterns/9781491971437/ch01.html)
