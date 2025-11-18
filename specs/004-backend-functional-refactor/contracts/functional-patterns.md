# Contract: Functional Patterns

**Version**: 1.0.0
**Status**: Normative
**Purpose**: Define standard functional programming patterns for backend modules

## 1. Repository Pattern

### 1.1 Type Definition

```typescript
// {module}.repository.ts
import { PrismaClient } from '@prisma/client';

export type {Module}Repository = {
  // Method signatures with explicit return types
  findById: (id: string) => Promise<Entity | null>;
  findAll: (filters?: FilterType) => Promise<Entity[]>;
  create: (data: CreateDto) => Promise<Entity>;
  update: (id: string, data: UpdateDto) => Promise<Entity>;
  delete: (id: string) => Promise<void>;
};
```

### 1.2 Implementation

```typescript
export const create{Module}Repository = (prisma: PrismaClient): {Module}Repository => ({
  findById: async (id: string) => {
    return prisma.entity.findUnique({ where: { id } });
  },

  findAll: async (filters) => {
    return prisma.entity.findMany({ where: filters });
  },

  create: async (data) => {
    return prisma.entity.create({ data });
  },

  update: async (id, data) => {
    return prisma.entity.update({ where: { id }, data });
  },

  delete: async (id) => {
    await prisma.entity.delete({ where: { id } });
  },
});
```

### 1.3 Rules

1. **MUST** export type definition before implementation
2. **MUST** accept `PrismaClient` as the only parameter
3. **MUST** return object with all repository methods
4. **MUST** handle ALL Prisma interactions (no Prisma calls outside repository)
5. **MUST** use async/await for all database operations
6. **SHOULD** add JSDoc comments for complex queries

## 2. Service Pattern

### 2.1 Type Definition

```typescript
// {module}.service.ts
import type { {Module}Repository } from './{module}.repository';
import type { OtherService } from '../other/other.service';

export type {Module}Service = {
  // Business logic methods
  getEntity: (id: string) => Promise<EntityDto>;
  createEntity: (userId: string, data: CreateDto) => Promise<EntityDto>;
  performBusinessOperation: (id: string, params: Params) => Promise<Result>;
};
```

### 2.2 Implementation

```typescript
export const create{Module}Service = (
  repository: {Module}Repository,
  otherService: OtherService
): {Module}Service => ({
  getEntity: async (id: string) => {
    const entity = await repository.findById(id);
    if (!entity) {
      throw new Error('Entity not found');
    }

    // Transform to DTO
    return {
      id: entity.id,
      name: entity.name,
      // ... other fields
    };
  },

  createEntity: async (userId: string, data: CreateDto) => {
    // Business validation
    if (!data.name) {
      throw new Error('Name is required');
    }

    // Use repository
    const entity = await repository.create({
      ...data,
      userId,
    });

    // Call other services if needed
    await otherService.doSomething(entity.id);

    return entity;
  },

  performBusinessOperation: async (id, params) => {
    // Complex business logic here
    const entity = await repository.findById(id);
    // ... calculations, transformations, orchestration
    return result;
  },
});
```

### 2.3 Rules

1. **MUST** export type definition before implementation
2. **MUST** accept all dependencies as parameters (repository, other services, utils)
3. **MUST** return object with all service methods
4. **MUST** implement ALL business logic (no business logic in controllers)
5. **MUST** call repository for data access (no direct Prisma calls)
6. **SHOULD** throw errors for business rule violations
7. **SHOULD** transform entities to DTOs before returning
8. **MAY** orchestrate multiple repository/service calls

## 3. Controller Pattern (Request Handlers)

### 3.1 Handler Factory

```typescript
// {module}.controller.ts
import type { Request, Response, NextFunction } from 'express';
import type { {Module}Service } from './{module}.service';

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const createGet{Entity}Handler = (
  service: {Module}Service
): AsyncRequestHandler => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;

      const entity = await service.getEntity(id);

      res.status(200).json({
        success: true,
        data: entity,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
};

export const createCreate{Entity}Handler = (
  service: {Module}Service
): AsyncRequestHandler => {
  return async (req, res, next) => {
    try {
      const userId = req.headers['x-user-id'] as string || 'mock-user-id';

      const entity = await service.createEntity(userId, req.body);

      res.status(201).json({
        success: true,
        data: entity,
        message: 'Entity created successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
};
```

### 3.2 Handler Collection Type

```typescript
export type {Module}Handlers = {
  getEntity: AsyncRequestHandler;
  createEntity: AsyncRequestHandler;
  updateEntity: AsyncRequestHandler;
  deleteEntity: AsyncRequestHandler;
  // ... other handlers
};
```

### 3.3 Rules

1. **MUST** export individual handler factory functions
2. **MUST** accept service as parameter
3. **MUST** return async function `(req, res, next) => Promise<void>`
4. **MUST** wrap all logic in try-catch and call `next(error)` on error
5. **MUST** use standard response format: `{ success, data, timestamp, message? }`
6. **MUST** handle ONLY HTTP concerns (req/res, status codes, headers)
7. **MUST NOT** contain business logic (delegate to service)
8. **SHOULD** define handler collection type for routes

## 4. Route Pattern

### 4.1 Route Factory

```typescript
// {module}.routes.ts
import { Router } from 'express';
import type { {Module}Handlers } from './{module}.controller';
import { validateRequest } from '../../shared/middleware/validation.middleware';
import { CreateSchema, UpdateSchema } from './{module}.validation';

export default function create{Module}Routes(
  handlers: {Module}Handlers
): Router {
  const router = Router();

  router.get('/', handlers.getEntity);
  router.post('/', validateRequest(CreateSchema), handlers.createEntity);
  router.get('/:id', handlers.getEntityById);
  router.patch('/:id', validateRequest(UpdateSchema), handlers.updateEntity);
  router.delete('/:id', handlers.deleteEntity);

  return router;
}
```

### 4.2 Rules

1. **MUST** use default export for route factory
2. **MUST** accept handlers object as parameter
3. **MUST** return Express Router
4. **MUST** define all routes for the module
5. **SHOULD** apply validation middleware where needed
6. **SHOULD** apply auth middleware where needed
7. **MAY** group related routes

## 5. Dependency Injection Pattern

### 5.1 App-Level Composition

```typescript
// app.ts
import { PrismaClient } from '@prisma/client';
import express, { Express } from 'express';

// Import factories
import { create{Module}Repository } from './modules/{module}/{module}.repository';
import { create{Module}Service } from './modules/{module}/{module}.service';
import {
  createGet{Entity}Handler,
  createCreate{Entity}Handler,
  // ... other handlers
} from './modules/{module}/{module}.controller';
import create{Module}Routes from './modules/{module}/{module}.routes';

// Shared dependencies
const prisma = new PrismaClient();

// Module composition (bottom-up: repo → service → handlers → routes)
const {module}Repo = create{Module}Repository(prisma);
const {module}Service = create{Module}Service({module}Repo, otherDeps);
const {module}Handlers = {
  getEntity: createGet{Entity}Handler({module}Service),
  createEntity: createCreate{Entity}Handler({module}Service),
  // ... other handlers
};
const {module}Routes = create{Module}Routes({module}Handlers);

// Mount routes
app.use('/api/{module}', {module}Routes);
```

### 5.2 Rules

1. **MUST** compose dependencies in app.ts
2. **MUST** follow bottom-up composition: Repository → Service → Handlers → Routes
3. **MUST** create handlers object matching handler collection type
4. **MUST** pass all dependencies explicitly (no globals)
5. **SHOULD** group composition by module
6. **SHOULD** create shared dependencies once (prisma, logger, etc.)

## 6. Export Strategy

### 6.1 Named Exports (Default for Everything)

```typescript
// Use named exports for:
// - Type definitions
export type {Module}Repository = { ... };

// - Factory functions
export const create{Module}Repository = (...) => { ... };

// - Handler factories
export const createGet{Entity}Handler = (...) => { ... };

// - Constants
export const MAX_ITEMS = 100;

// - Utility functions
export const formatEntity = (...) => { ... };
```

### 6.2 Default Export (ONLY for Routes)

```typescript
// ONLY use default export for route factory
export default function create{Module}Routes(...) { ... }
```

### 6.3 Rules

1. **MUST** use named exports for all types
2. **MUST** use named exports for all factory functions
3. **MUST** use named exports for all handler factories
4. **MUST** use default export ONLY for route factory
5. **SHOULD** use `type` import for type-only imports: `import type { X } from './y'`

## 7. Error Handling Pattern

### 7.1 Service Layer

```typescript
export const create{Module}Service = (repository: {Module}Repository): {Module}Service => ({
  getEntity: async (id: string) => {
    const entity = await repository.findById(id);

    if (!entity) {
      // Throw descriptive errors
      throw new Error(`Entity not found: ${id}`);
    }

    return entity;
  },

  createEntity: async (data: CreateDto) => {
    // Validate business rules
    if (!data.name || data.name.length < 3) {
      throw new Error('Name must be at least 3 characters');
    }

    return repository.create(data);
  },
});
```

### 7.2 Controller Layer

```typescript
export const createGet{Entity}Handler = (service: {Module}Service): AsyncRequestHandler => {
  return async (req, res, next) => {
    try {
      const entity = await service.getEntity(req.params.id);
      res.json({ success: true, data: entity });
    } catch (error) {
      // Pass errors to Express error handler
      next(error);
    }
  };
};
```

### 7.3 Rules

1. **MUST** throw errors in service layer for business rule violations
2. **MUST** catch errors in controller layer and pass to `next(error)`
3. **MUST** use descriptive error messages
4. **SHOULD** use custom error classes for different error types
5. **SHOULD** let Express error middleware handle formatting

## 8. Testing Pattern

### 8.1 Repository Tests (Integration)

```typescript
// {module}.repository.test.ts
import { PrismaClient } from '@prisma/client';
import { create{Module}Repository } from './{module}.repository';

describe('{Module}Repository', () => {
  let prisma: PrismaClient;
  let repository: ReturnType<typeof create{Module}Repository>;

  beforeAll(async () => {
    prisma = new PrismaClient();
    repository = create{Module}Repository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should find entity by id', async () => {
    const entity = await repository.findById('test-id');
    expect(entity).toBeDefined();
  });
});
```

### 8.2 Service Tests (Unit)

```typescript
// {module}.service.test.ts
import type { {Module}Repository } from './{module}.repository';
import { create{Module}Service } from './{module}.service';

describe('{Module}Service', () => {
  let mockRepository: {Module}Repository;
  let service: ReturnType<typeof create{Module}Service>;

  beforeEach(() => {
    // Create mock implementing repository type
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    service = create{Module}Service(mockRepository);
  });

  it('should throw error if entity not found', async () => {
    mockRepository.findById = jest.fn().mockResolvedValue(null);

    await expect(service.getEntity('test-id')).rejects.toThrow('Entity not found');
  });
});
```

### 8.3 Controller Tests (Unit)

```typescript
// {module}.controller.test.ts
import type { Request, Response, NextFunction } from 'express';
import type { {Module}Service } from './{module}.service';
import { createGet{Entity}Handler } from './{module}.controller';

describe('{Module}Controller', () => {
  let mockService: {Module}Service;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockService = {
      getEntity: jest.fn(),
      createEntity: jest.fn(),
    };

    mockReq = { params: { id: 'test-id' } };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should return entity data', async () => {
    const entity = { id: 'test-id', name: 'Test' };
    mockService.getEntity = jest.fn().mockResolvedValue(entity);

    const handler = createGet{Entity}Handler(mockService);
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: entity,
      timestamp: expect.any(String),
    });
  });
});
```

## 9. File Naming Convention

- `{module}.types.ts` - Type definitions (DTOs, domain types)
- `{module}.validation.ts` - Zod schemas
- `{module}.repository.ts` - Repository type + factory
- `{module}.service.ts` - Service type + factory
- `{module}.controller.ts` - Handler factories
- `{module}.routes.ts` - Route factory (default export)
- `__tests__/{module}.repository.test.ts` - Repository integration tests
- `__tests__/{module}.service.test.ts` - Service unit tests
- `__tests__/{module}.controller.test.ts` - Controller unit tests

## 10. Checklist for New Modules

When creating a new functional module:

- [ ] Define types in `{module}.types.ts`
- [ ] Define validation schemas in `{module}.validation.ts`
- [ ] Create repository type + factory in `{module}.repository.ts`
- [ ] Create service type + factory in `{module}.service.ts`
- [ ] Create handler factories in `{module}.controller.ts`
- [ ] Create route factory in `{module}.routes.ts` (default export)
- [ ] Compose in `app.ts` (repo → service → handlers → routes)
- [ ] Write repository integration tests (≥90% coverage)
- [ ] Write service unit tests (≥95% coverage)
- [ ] Write controller unit tests (≥90% coverage)
- [ ] Update CLAUDE.md if introducing new patterns

## Summary

These patterns ensure:
- **Consistency**: All modules follow the same structure
- **Testability**: Dependencies are explicit and mockable
- **Type Safety**: TypeScript enforces contracts
- **Simplicity**: No classes, no `this`, no inheritance
- **Composability**: Functions compose naturally

**Violations**: Any deviation from these patterns must be documented in `plan.md` Complexity Tracking section with justification.
