# Quickstart: Functional Backend Patterns

**Audience**: Developers working with the functional backend codebase
**Last Updated**: 2025-11-18
**Related**: `contracts/functional-patterns.md`, `contracts/migration-guide.md`

## TL;DR

The backend uses **functional patterns** instead of classes:
- **No classes**, only functions
- **Factory functions** for dependency injection
- **Named exports** for everything except routes
- **Simple object mocks** for testing

## Quick Reference

### Creating a Module

```typescript
// 1. Repository (data access)
export type UserRepository = {
  findById: (id: string) => Promise<User | null>;
};

export const createUserRepository = (prisma: PrismaClient): UserRepository => ({
  findById: async (id) => prisma.user.findUnique({ where: { id } }),
});

// 2. Service (business logic)
export type UserService = {
  getUser: (id: string) => Promise<User>;
};

export const createUserService = (repo: UserRepository): UserService => ({
  getUser: async (id) => {
    const user = await repo.findById(id);
    if (!user) throw new Error('User not found');
    return user;
  },
});

// 3. Controller (HTTP handlers)
export const createGetUserHandler = (service: UserService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await service.getUser(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };
};

// 4. Routes (wiring)
export default function createUserRoutes(handlers: UserHandlers): Router {
  const router = Router();
  router.get('/:id', handlers.getUser);
  return router;
}

// 5. App (DI composition)
const userRepo = createUserRepository(prisma);
const userService = createUserService(userRepo);
const userHandlers = {
  getUser: createGetUserHandler(userService),
};
const userRoutes = createUserRoutes(userHandlers);
app.use('/api/users', userRoutes);
```

### Testing

```typescript
// Service test - simple object mock
describe('UserService', () => {
  it('should get user', async () => {
    const mockRepo: UserRepository = {
      findById: jest.fn().mockResolvedValue({ id: '1', name: 'John' }),
    };

    const service = createUserService(mockRepo);
    const user = await service.getUser('1');

    expect(user.name).toBe('John');
  });
});
```

## Pattern Cheat Sheet

### Repository Layer

```typescript
// Type first
export type {Module}Repository = {
  findById: (id: string) => Promise<Entity | null>;
  create: (data: CreateDto) => Promise<Entity>;
};

// Factory second
export const create{Module}Repository = (prisma: PrismaClient): {Module}Repository => ({
  findById: async (id) => prisma.entity.findUnique({ where: { id } }),
  create: async (data) => prisma.entity.create({ data }),
});
```

**Rules**:
- ✅ All Prisma calls in repository
- ✅ Export type + factory function
- ✅ Accept `PrismaClient` as parameter
- ❌ No business logic

### Service Layer

```typescript
// Type with dependencies
export type {Module}Service = {
  getEntity: (id: string) => Promise<EntityDto>;
  createEntity: (data: CreateDto) => Promise<EntityDto>;
};

// Factory with injected deps
export const create{Module}Service = (
  repository: {Module}Repository,
  otherService: OtherService
): {Module}Service => ({
  getEntity: async (id) => {
    const entity = await repository.findById(id);
    if (!entity) throw new Error('Not found');
    return entity;
  },

  createEntity: async (data) => {
    // Validation
    if (!data.name) throw new Error('Name required');
    // Use repository
    return repository.create(data);
  },
});
```

**Rules**:
- ✅ All business logic in service
- ✅ Call repository for data access
- ✅ Throw errors for validation
- ❌ No HTTP concerns (req/res)

### Controller Layer

```typescript
// Individual handler factories
export const createGet{Entity}Handler = (service: {Module}Service) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entity = await service.getEntity(req.params.id);
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

// Handler collection type
export type {Module}Handlers = {
  getEntity: AsyncRequestHandler;
  createEntity: AsyncRequestHandler;
};
```

**Rules**:
- ✅ Only HTTP concerns (parsing, formatting)
- ✅ Try-catch with `next(error)`
- ✅ Standard response format
- ❌ No business logic

### Route Layer

```typescript
// DEFAULT export for routes ONLY
export default function create{Module}Routes(
  handlers: {Module}Handlers
): Router {
  const router = Router();

  router.get('/', handlers.getEntity);
  router.post('/', validateRequest(CreateSchema), handlers.createEntity);
  router.get('/:id', handlers.getEntityById);

  return router;
}
```

**Rules**:
- ✅ Default export (ONLY file with default export)
- ✅ Accept handlers object
- ✅ Apply middleware (validation, auth)
- ❌ No business logic

### Dependency Injection (app.ts)

```typescript
// Bottom-up composition: Repository → Service → Handlers → Routes
const {module}Repo = create{Module}Repository(prisma);
const {module}Service = create{Module}Service({module}Repo, otherDeps);
const {module}Handlers = {
  getEntity: createGet{Entity}Handler({module}Service),
  createEntity: createCreate{Entity}Handler({module}Service),
};
const {module}Routes = create{Module}Routes({module}Handlers);

app.use('/api/{module}', {module}Routes);
```

**Rules**:
- ✅ Compose in app.ts
- ✅ Bottom-up order
- ✅ Explicit dependencies
- ❌ No global state

## Export Strategy

### Named Exports (Default)

Use for **everything except routes**:

```typescript
// Types
export type UserRepository = { ... };
export type UserService = { ... };

// Factory functions
export const createUserRepository = (...) => { ... };
export const createUserService = (...) => { ... };

// Handler factories
export const createGetUserHandler = (...) => { ... };

// Constants
export const MAX_USERS = 1000;
```

### Default Export (Routes Only)

Use **ONLY** for route factory:

```typescript
// ONLY in {module}.routes.ts
export default function createUserRoutes(...): Router { ... }

// Import
import createUserRoutes from './user.routes';
```

## Testing Patterns

### Repository Tests (Integration)

```typescript
import { PrismaClient } from '@prisma/client';
import { createUserRepository } from '../user.repository';

describe('UserRepository', () => {
  let prisma: PrismaClient;
  let repository: ReturnType<typeof createUserRepository>;

  beforeAll(() => {
    prisma = new PrismaClient();
    repository = createUserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should find user by id', async () => {
    const user = await repository.findById('test-id');
    expect(user).toBeDefined();
  });
});
```

### Service Tests (Unit)

```typescript
import type { UserRepository } from '../user.repository';
import { createUserService } from '../user.service';

describe('UserService', () => {
  let mockRepo: UserRepository;

  beforeEach(() => {
    // Simple object mock!
    mockRepo = {
      findById: jest.fn(),
      create: jest.fn(),
    };
  });

  it('should throw error if user not found', async () => {
    mockRepo.findById = jest.fn().mockResolvedValue(null);

    const service = createUserService(mockRepo);
    await expect(service.getUser('bad-id')).rejects.toThrow('User not found');
  });
});
```

### Controller Tests (Unit)

```typescript
import type { Request, Response, NextFunction } from 'express';
import type { UserService } from '../user.service';
import { createGetUserHandler } from '../user.controller';

describe('UserController', () => {
  let mockService: UserService;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockService = {
      getUser: jest.fn(),
      createUser: jest.fn(),
    };

    mockReq = { params: { id: 'test-id' } };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  it('should return user data', async () => {
    mockService.getUser = jest.fn().mockResolvedValue({ id: 'test-id', name: 'John' });

    const handler = createGetUserHandler(mockService);
    await handler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      data: { id: 'test-id', name: 'John' },
      timestamp: expect.any(String),
    });
  });
});
```

## Common Patterns

### Error Handling

```typescript
// Service: Throw descriptive errors
export const createUserService = (repo: UserRepository): UserService => ({
  getUser: async (id) => {
    const user = await repo.findById(id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }
    return user;
  },
});

// Controller: Catch and pass to next()
export const createGetUserHandler = (service: UserService) => {
  return async (req, res, next) => {
    try {
      const user = await service.getUser(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error); // Let error middleware handle it
    }
  };
};
```

### Validation

```typescript
// Service: Business validation
export const createUserService = (...): UserService => ({
  createUser: async (data) => {
    // Validate
    if (!data.email || !data.email.includes('@')) {
      throw new Error('Invalid email address');
    }

    // Create
    return repository.create(data);
  },
});

// Routes: Schema validation
import { validateRequest } from '../../shared/middleware/validation.middleware';
import { CreateUserSchema } from './user.validation';

export default function createUserRoutes(handlers: UserHandlers): Router {
  const router = Router();
  router.post('/', validateRequest(CreateUserSchema), handlers.createUser);
  return router;
}
```

### Private Helpers

```typescript
// Extract helper outside factory (RECOMMENDED - better for memory)
const validateUserData = (data: CreateUserDto): void => {
  if (!data.name || data.name.length < 3) {
    throw new Error('Name must be at least 3 characters');
  }
};

export const createUserService = (repo: UserRepository): UserService => ({
  createUser: async (data) => {
    validateUserData(data); // Use helper
    return repo.create(data);
  },
});

// Or inside factory (closure - per instance)
export const createUserService = (repo: UserRepository): UserService => {
  const validateUserData = (data: CreateUserDto): void => {
    // ... validation
  };

  return {
    createUser: async (data) => {
      validateUserData(data);
      return repo.create(data);
    },
  };
};
```

## File Structure

```
backend/src/modules/user/
├── user.types.ts            # Domain types, DTOs
├── user.validation.ts       # Zod schemas
├── user.repository.ts       # Type + factory
├── user.service.ts          # Type + factory
├── user.controller.ts       # Handler factories
├── user.routes.ts           # Route factory (default export)
└── __tests__/
    ├── user.repository.test.ts
    ├── user.service.test.ts
    └── user.controller.test.ts
```

## Common Mistakes

### ❌ Using `this`

```typescript
// WRONG - no `this` in functional code
export const createUserService = (repo) => ({
  getUser: async (id) => {
    return this.repo.findById(id); // ❌ this is undefined!
  },
});

// CORRECT - use closure
export const createUserService = (repo) => ({
  getUser: async (id) => {
    return repo.findById(id); // ✅ closure variable
  },
});
```

### ❌ Using Classes

```typescript
// WRONG - no classes
export class UserService {
  constructor(private repo: UserRepository) {}
  async getUser(id: string) { ... }
}

// CORRECT - factory function
export const createUserService = (repo: UserRepository): UserService => ({
  getUser: async (id: string) => { ... },
});
```

### ❌ Default Exports Everywhere

```typescript
// WRONG - default export for service
export default function createUserService(...) { ... }

// CORRECT - named export
export const createUserService = (...) => { ... };

// Exception: ONLY routes use default export
export default function createUserRoutes(...): Router { ... }
```

### ❌ Missing Type Definitions

```typescript
// WRONG - no type definition
export const createUserService = (repo) => ({
  getUser: async (id) => { ... },
});

// CORRECT - type first
export type UserService = {
  getUser: (id: string) => Promise<User>;
};

export const createUserService = (repo: UserRepository): UserService => ({
  getUser: async (id) => { ... },
});
```

### ❌ Complex Mocks in Tests

```typescript
// WRONG - using jest.Mocked (unnecessary complexity)
const mockRepo: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
} as jest.Mocked<UserRepository>;

// CORRECT - simple object mock
const mockRepo: UserRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  // ... all methods
};
```

## Benefits Recap

### Why Functional?

1. **Simpler composition**: Functions compose naturally
2. **Easier testing**: Simple object mocks, no mocking frameworks
3. **Better tree-shaking**: Named exports enable dead code elimination
4. **Type safety**: Function signatures are the contract
5. **No `this` issues**: No binding problems
6. **Less boilerplate**: No class/constructor ceremony

### Comparison

| Class-Based | Functional |
|-------------|------------|
| `new Service(deps)` | `createService(deps)` |
| `this.dependency.method()` | `dependency.method()` |
| `jest.Mocked<Service>` | Simple object: `Service` |
| Constructor injection | Function parameters |
| Prototype methods | Object properties |
| `export class Service` | `export const createService` + `export type Service` |

## Resources

- **Detailed patterns**: `contracts/functional-patterns.md`
- **Migration guide**: `contracts/migration-guide.md`
- **Testing guide**: `contracts/testing-patterns.md`
- **Research**: `research.md`
- **Type definitions**: `data-model.md`

## Quick Commands

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Lint
npm run lint

# Dev server
npm run dev
```

## Need Help?

1. Check `functional-patterns.md` for detailed patterns
2. Check `migration-guide.md` for step-by-step refactoring
3. Check `testing-patterns.md` for testing examples
4. Look at existing modules (portfolio, market-data) as reference
5. Ask team members familiar with functional patterns

---

**Remember**: Type first, factory second, test with simple mocks!
