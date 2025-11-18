# Module Structure Contract

**Feature**: 003-backend-modular-architecture | **Date**: 2025-11-18

## Overview

This document defines the **REQUIRED** structure for all backend modules. Every module MUST conform to this template. This is a binding contract that ensures consistency across the codebase.

---

## Module Template

Every module MUST have the following structure:

```
backend/src/modules/[module-name]/
├── [module].routes.ts           # REQUIRED: Express routes
├── [module].controller.ts       # REQUIRED: HTTP request handlers
├── [module].service.ts          # REQUIRED: Business logic
├── [module].repository.ts       # REQUIRED: Data access layer
├── [module].validation.ts       # REQUIRED: Zod schemas
├── [module].types.ts            # OPTIONAL: TypeScript interfaces
├── [additional].service.ts      # OPTIONAL: Additional services
└── __tests__/                   # REQUIRED: Tests
    ├── [module].controller.test.ts
    ├── [module].service.test.ts
    └── [module].repository.test.ts
```

---

## File Contracts

### 1. Routes File (`[module].routes.ts`)

**Purpose**: Define Express routes and middleware

**Requirements**:
- ✅ MUST export a factory function: `createXxxRoutes(controller: XxxController): Router`
- ✅ MUST use Express `Router()`
- ✅ MUST apply middleware at route level (auth, validation)
- ✅ MUST NOT contain business logic
- ✅ MUST bind controller methods with arrow functions

**Template**:
```typescript
import { Router } from 'express';
import { XxxController } from './xxx.controller';
import { validateRequest } from '../../shared/middleware/validator';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { CreateXxxSchema, UpdateXxxSchema } from './xxx.validation';

export function createXxxRoutes(controller: XxxController): Router {
  const router = Router();

  router.use(authenticate); // Apply auth to all routes

  router.get('/', (req, res, next) => controller.getAll(req, res, next));

  router.post(
    '/',
    validateRequest(CreateXxxSchema),
    (req, res, next) => controller.create(req, res, next)
  );

  router.get('/:id', (req, res, next) => controller.getById(req, res, next));

  router.patch(
    '/:id',
    validateRequest(UpdateXxxSchema),
    (req, res, next) => controller.update(req, res, next)
  );

  router.delete('/:id', (req, res, next) => controller.delete(req, res, next));

  return router;
}
```

---

### 2. Controller File (`[module].controller.ts`)

**Purpose**: Handle HTTP requests and responses

**Requirements**:
- ✅ MUST export a class: `export class XxxController`
- ✅ MUST use constructor injection: `constructor(private readonly service: XxxService)`
- ✅ MUST handle request/response/next parameters
- ✅ MUST return consistent response format: `{ data, meta?, message? }`
- ✅ MUST delegate business logic to service
- ✅ MUST NOT contain database calls
- ✅ MUST NOT contain business logic
- ✅ MUST pass errors to `next(error)` for middleware handling

**Template**:
```typescript
import { Request, Response, NextFunction } from 'express';
import { XxxService } from './xxx.service';

export class XxxController {
  constructor(private readonly service: XxxService) {}

  /**
   * GET /api/xxx
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const items = await this.service.getAll(userId);

      res.json({
        data: items,
        meta: { count: items.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/xxx
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const dto = req.body;

      const item = await this.service.create(userId, dto);

      res.status(201).json({
        data: item,
        message: 'Created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ... other methods
}
```

**Response Format Contract**:

| Status | Format | Usage |
|--------|--------|-------|
| 200 OK | `{ data: T, meta?: {} }` | Successful GET |
| 201 Created | `{ data: T, message: string }` | Successful POST |
| 204 No Content | (empty body) | Successful DELETE |
| 4xx/5xx | (handled by error middleware) | Errors |

---

### 3. Service File (`[module].service.ts`)

**Purpose**: Implement business logic

**Requirements**:
- ✅ MUST export a class: `export class XxxService`
- ✅ MUST use constructor injection for repositories
- ✅ MUST contain business logic ONLY
- ✅ MUST delegate data access to repository
- ✅ MUST NOT contain HTTP concerns (req/res)
- ✅ MUST NOT contain Prisma calls (use repository)
- ✅ MUST throw errors for business rule violations

**Template**:
```typescript
import { XxxRepository } from './xxx.repository';
import { CalculationsService } from '../../shared/services/calculations.service';
import { CreateXxxDto, UpdateXxxDto } from './xxx.validation';

export class XxxService {
  constructor(
    private readonly repository: XxxRepository,
    private readonly calculations: CalculationsService
  ) {}

  /**
   * Get all items with business logic applied
   */
  async getAll(userId: string) {
    const items = await this.repository.findAll(userId);

    // Business logic: add calculated fields
    return items.map(item => ({
      ...item,
      calculatedValue: this.calculations.calculate(item)
    }));
  }

  /**
   * Create item with business rules
   */
  async create(userId: string, dto: CreateXxxDto) {
    // Business rule: check constraints
    const count = await this.repository.countByUser(userId);
    if (count >= 10) {
      throw new Error('Maximum 10 items allowed');
    }

    // Delegate to repository
    return this.repository.create({
      ...dto,
      userId
    });
  }

  // ... other methods
}
```

---

### 4. Repository File (`[module].repository.ts`)

**Purpose**: Abstract data access

**Requirements**:
- ✅ MUST export a class: `export class XxxRepository`
- ✅ MUST use constructor injection: `constructor(private readonly prisma: PrismaClient)`
- ✅ MUST contain Prisma queries ONLY
- ✅ MUST NOT contain business logic
- ✅ MUST NOT contain HTTP concerns
- ✅ MUST use Prisma types: `Prisma.XxxCreateInput`, `Prisma.XxxUpdateInput`
- ✅ MUST include JSDoc comments for public methods

**Template**:
```typescript
import { PrismaClient, Xxx, Prisma } from '@prisma/client';

export class XxxRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find all items for a user
   */
  async findAll(userId: string): Promise<Xxx[]> {
    return this.prisma.xxx.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find item by ID
   */
  async findById(id: string): Promise<Xxx | null> {
    return this.prisma.xxx.findUnique({ where: { id } });
  }

  /**
   * Create item
   */
  async create(data: Prisma.XxxCreateInput): Promise<Xxx> {
    return this.prisma.xxx.create({ data });
  }

  /**
   * Update item
   */
  async update(id: string, data: Prisma.XxxUpdateInput): Promise<Xxx> {
    return this.prisma.xxx.update({ where: { id }, data });
  }

  /**
   * Delete item
   */
  async delete(id: string): Promise<void> {
    await this.prisma.xxx.delete({ where: { id } });
  }

  /**
   * Count items for user
   */
  async countByUser(userId: string): Promise<number> {
    return this.prisma.xxx.count({ where: { userId } });
  }
}
```

**Method Naming Conventions**:

| Operation | Method Name | Return Type |
|-----------|-------------|-------------|
| Query single | `findById(id)` | `Promise<T \| null>` |
| Query multiple | `findAll(userId)` | `Promise<T[]>` |
| Query specific | `findBySymbol(symbol)` | `Promise<T \| null>` |
| Create | `create(data)` | `Promise<T>` |
| Update | `update(id, data)` | `Promise<T>` |
| Delete | `delete(id)` | `Promise<void>` |
| Count | `count(criteria)` | `Promise<number>` |
| Exists | `exists(id)` | `Promise<boolean>` |

---

### 5. Validation File (`[module].validation.ts`)

**Purpose**: Define Zod schemas for DTOs

**Requirements**:
- ✅ MUST use Zod for schema validation
- ✅ MUST export schemas with suffix `Schema`: `CreateXxxSchema`, `UpdateXxxSchema`
- ✅ MUST export inferred TypeScript types with suffix `Dto`
- ✅ MUST include error messages for validation rules
- ✅ MUST use `.strict()` to prevent extra fields

**Template**:
```typescript
import { z } from 'zod';

export const CreateXxxSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters'),
    description: z
      .string()
      .max(500, 'Description must be at most 500 characters')
      .optional(),
    value: z
      .number()
      .min(0, 'Value must be positive')
  })
  .strict();

export const UpdateXxxSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters')
      .optional(),
    description: z
      .string()
      .max(500, 'Description must be at most 500 characters')
      .optional(),
    value: z
      .number()
      .min(0, 'Value must be positive')
      .optional()
  })
  .strict();

// Inferred types
export type CreateXxxDto = z.infer<typeof CreateXxxSchema>;
export type UpdateXxxDto = z.infer<typeof UpdateXxxSchema>;
```

---

### 6. Types File (`[module].types.ts`)

**Purpose**: Define TypeScript interfaces and types

**Requirements**:
- ✅ MUST export types with clear names
- ✅ MUST NOT duplicate Prisma-generated types
- ✅ SHOULD define view models, DTOs, and domain types

**Template**:
```typescript
import { Xxx } from '@prisma/client';

/**
 * Extended Xxx with calculated fields
 */
export interface XxxWithCalculations extends Xxx {
  totalValue: number;
  profitLoss: number;
}

/**
 * Summary view of Xxx
 */
export interface XxxSummary {
  id: string;
  name: string;
  value: number;
}

/**
 * Query options for Xxx
 */
export interface XxxQueryOptions {
  includeArchived?: boolean;
  sortBy?: 'name' | 'createdAt' | 'value';
  sortOrder?: 'asc' | 'desc';
}
```

---

## Dependency Injection Contract

### app.ts Structure

**Requirements**:
- ✅ MUST create infrastructure layer first (Prisma, cache, shared services)
- ✅ MUST create repositories second (depend on Prisma)
- ✅ MUST create services third (depend on repositories)
- ✅ MUST create controllers fourth (depend on services)
- ✅ MUST create routes last (depend on controllers)
- ✅ MUST mount routes with `app.use('/api/xxx', xxxRoutes)`
- ✅ MUST add error handler LAST

**Template**:
```typescript
// 1. Infrastructure
const prisma = new PrismaClient();
const cache = new CacheService();
const calculations = new CalculationsService();

// 2. Module DI
const xxxRepository = new XxxRepository(prisma);
const xxxService = new XxxService(xxxRepository, calculations);
const xxxController = new XxxController(xxxService);
const xxxRoutes = createXxxRoutes(xxxController);

// 3. Mount routes
app.use('/api/xxx', xxxRoutes);

// 4. Error handler (MUST BE LAST)
app.use(errorHandler);
```

---

## Acceptance Criteria

### For Each Module

- [ ] ✅ All files follow naming convention: `[module].[layer].ts`
- [ ] ✅ Routes file exports factory function
- [ ] ✅ Controller delegates to service only
- [ ] ✅ Service delegates to repository for data access
- [ ] ✅ Repository contains Prisma calls only
- [ ] ✅ Validation uses Zod schemas
- [ ] ✅ Tests exist for all three layers
- [ ] ✅ No circular dependencies
- [ ] ✅ No Prisma calls outside repositories
- [ ] ✅ All endpoints work (verified with integration tests)

### For DI Container (app.ts)

- [ ] ✅ Dependencies created in correct order
- [ ] ✅ All routes mounted
- [ ] ✅ Error handler mounted last
- [ ] ✅ Server starts successfully
- [ ] ✅ Health check endpoint works

---

## Anti-Patterns (Forbidden)

### ❌ FORBIDDEN: Business Logic in Controller

```typescript
// ❌ BAD: Controller has business logic
async createPortfolio(req: Request, res: Response) {
  const count = await this.service.count(req.user.id);
  if (count >= 10) { // Business logic!
    return res.status(400).json({ error: 'Too many portfolios' });
  }
  // ...
}

// ✅ GOOD: Business logic in service
async createPortfolio(req: Request, res: Response) {
  const portfolio = await this.service.create(req.user.id, req.body);
  res.status(201).json({ data: portfolio });
}
```

### ❌ FORBIDDEN: Prisma in Service

```typescript
// ❌ BAD: Service has Prisma calls
async getPortfolios(userId: string) {
  return this.prisma.portfolio.findMany({ where: { userId } });
}

// ✅ GOOD: Service uses repository
async getPortfolios(userId: string) {
  return this.repository.findAll(userId);
}
```

### ❌ FORBIDDEN: Hardcoded Dependencies

```typescript
// ❌ BAD: Hardcoded Prisma
export class PortfolioRepository {
  private prisma = new PrismaClient(); // Hardcoded!
}

// ✅ GOOD: Injected dependency
export class PortfolioRepository {
  constructor(private readonly prisma: PrismaClient) {}
}
```

### ❌ FORBIDDEN: Business Logic in Repository

```typescript
// ❌ BAD: Repository has business logic
async create(data: any) {
  if (data.value < 0) { // Business logic!
    throw new Error('Value must be positive');
  }
  return this.prisma.xxx.create({ data });
}

// ✅ GOOD: Repository only does data access
async create(data: Prisma.XxxCreateInput) {
  return this.prisma.xxx.create({ data });
}
```

---

## Checklist Summary

Use this checklist when creating or reviewing a module:

### File Structure
- [ ] `[module].routes.ts` exists
- [ ] `[module].controller.ts` exists
- [ ] `[module].service.ts` exists
- [ ] `[module].repository.ts` exists
- [ ] `[module].validation.ts` exists
- [ ] `__tests__/` directory exists with 3+ test files

### Separation of Concerns
- [ ] Routes only define endpoints and middleware
- [ ] Controller only handles HTTP (req/res)
- [ ] Service only contains business logic
- [ ] Repository only contains Prisma queries
- [ ] No Prisma calls outside repository

### Dependency Injection
- [ ] All dependencies injected via constructor
- [ ] No hardcoded dependencies
- [ ] Dependencies flow: Repository ← Service ← Controller ← Routes

### Testing
- [ ] Repository has integration tests (with real DB)
- [ ] Service has unit tests (mocked repository)
- [ ] Controller has unit tests (mocked service)
- [ ] All tests pass
- [ ] Coverage ≥80%

### API Consistency
- [ ] Response format: `{ data, meta?, message? }`
- [ ] Error handling: `next(error)`
- [ ] Status codes: 200 (GET), 201 (POST), 204 (DELETE)

---

**Contract Version**: 1.0
**Date**: 2025-11-18
**Status**: BINDING - All modules MUST conform to this structure
