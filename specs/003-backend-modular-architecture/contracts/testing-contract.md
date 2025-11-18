# Testing Contract

**Feature**: 003-backend-modular-architecture | **Date**: 2025-11-18

## Overview

This document defines **REQUIRED** testing standards for the backend modular architecture. Every module MUST have comprehensive tests at all layers. This is a binding contract that ensures code quality and prevents regressions.

---

## Testing Pyramid

```
        /\
       /E2E\          10% - Full HTTP tests
      /------\        (Supertest, real DB)
     /  INT   \       20% - Integration tests
    /----------\      (Repository + real DB)
   /    UNIT    \     70% - Unit tests
  /--------------\    (Service/Controller, mocked)
```

---

## Test Coverage Requirements

### Minimum Coverage Targets

| Layer | Coverage Target | Test Type | Speed |
|-------|----------------|-----------|-------|
| Repository | 90%+ | Integration | Slow (50-200ms) |
| Service | 95%+ | Unit | Fast (<10ms) |
| Controller | 90%+ | Unit | Fast (<10ms) |
| Routes | 80%+ | E2E | Slow (100-500ms) |
| **Overall** | **85%+** | Mixed | - |

**Enforcement**: CI MUST fail if coverage drops below target.

---

## 1. Repository Tests (Integration)

### Purpose

Test actual database operations with Prisma and PostgreSQL.

### Requirements

- ✅ MUST use real database (test DB)
- ✅ MUST clean database before each test
- ✅ MUST test CRUD operations
- ✅ MUST test relationships (Prisma includes)
- ✅ MUST test unique constraints
- ✅ MUST test cascade deletes
- ✅ MUST NOT mock Prisma

### Template

**File**: `modules/[module]/__tests__/[module].repository.test.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { XxxRepository } from '../xxx.repository';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test_db'
    }
  }
});

describe('XxxRepository Integration Tests', () => {
  let repository: XxxRepository;
  let testUserId: string;

  beforeAll(async () => {
    await prisma.$connect();
    repository = new XxxRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database in correct order (children first)
    await prisma.childEntity.deleteMany();
    await prisma.xxx.deleteMany();
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
    it('should create an entity', async () => {
      const entity = await repository.create({
        name: 'Test Entity',
        userId: testUserId
      });

      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('Test Entity');
      expect(entity.userId).toBe(testUserId);
      expect(entity.createdAt).toBeInstanceOf(Date);
    });

    it('should enforce unique constraints', async () => {
      await repository.create({ name: 'Unique', userId: testUserId });

      await expect(
        repository.create({ name: 'Unique', userId: testUserId })
      ).rejects.toThrow(); // Prisma unique constraint error
    });
  });

  describe('findAll', () => {
    it('should return all entities for user', async () => {
      await repository.create({ name: 'Entity 1', userId: testUserId });
      await repository.create({ name: 'Entity 2', userId: testUserId });

      const entities = await repository.findAll(testUserId);

      expect(entities).toHaveLength(2);
      expect(entities[0].name).toBe('Entity 2'); // Ordered by createdAt desc
      expect(entities[1].name).toBe('Entity 1');
    });

    it('should return empty array if no entities', async () => {
      const entities = await repository.findAll(testUserId);
      expect(entities).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return entity by ID', async () => {
      const created = await repository.create({
        name: 'Test',
        userId: testUserId
      });

      const found = await repository.findById(created.id);

      expect(found).toBeDefined();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe('Test');
    });

    it('should return null if entity not found', async () => {
      const found = await repository.findById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should include relationships', async () => {
      const parent = await repository.create({
        name: 'Parent',
        userId: testUserId
      });

      await prisma.childEntity.create({
        data: {
          parentId: parent.id,
          value: 100
        }
      });

      const found = await repository.findById(parent.id);

      expect(found!.children).toBeDefined();
      expect(found!.children).toHaveLength(1);
      expect(found!.children[0].value).toBe(100);
    });
  });

  describe('update', () => {
    it('should update entity', async () => {
      const created = await repository.create({
        name: 'Original',
        userId: testUserId
      });

      const updated = await repository.update(created.id, {
        name: 'Updated'
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('Updated');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(
        created.updatedAt.getTime()
      );
    });

    it('should throw if entity not found', async () => {
      await expect(
        repository.update('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete entity', async () => {
      const created = await repository.create({
        name: 'To Delete',
        userId: testUserId
      });

      await repository.delete(created.id);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should cascade delete children', async () => {
      const parent = await repository.create({
        name: 'Parent',
        userId: testUserId
      });

      const child = await prisma.childEntity.create({
        data: {
          parentId: parent.id,
          value: 100
        }
      });

      await repository.delete(parent.id);

      const foundChild = await prisma.childEntity.findUnique({
        where: { id: child.id }
      });
      expect(foundChild).toBeNull(); // Cascade delete
    });

    it('should throw if entity not found', async () => {
      await expect(
        repository.delete('non-existent-id')
      ).rejects.toThrow();
    });
  });
});
```

### Required Test Cases

For every repository:

- [ ] **Create**: Valid data, unique constraints
- [ ] **FindAll**: Returns all, empty array, filters work
- [ ] **FindById**: Found, not found, includes relationships
- [ ] **Update**: Success, not found, partial update
- [ ] **Delete**: Success, not found, cascade deletes
- [ ] **Count**: Correct count, zero count
- [ ] **Custom Queries**: Any specific finder methods

---

## 2. Service Tests (Unit)

### Purpose

Test business logic in isolation with mocked dependencies.

### Requirements

- ✅ MUST mock all repositories
- ✅ MUST mock all external services
- ✅ MUST NOT use real database
- ✅ MUST test business rules
- ✅ MUST test error cases
- ✅ MUST test authorization logic
- ✅ MUST be fast (<10ms per test)

### Template

**File**: `modules/[module]/__tests__/[module].service.test.ts`

```typescript
import { XxxService } from '../xxx.service';
import { XxxRepository } from '../xxx.repository';
import { CalculationsService } from '../../../shared/services/calculations.service';

describe('XxxService Unit Tests', () => {
  let service: XxxService;
  let mockRepository: jest.Mocked<XxxRepository>;
  let mockCalculations: jest.Mocked<CalculationsService>;

  beforeEach(() => {
    // Create complete mocks
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countByUser: jest.fn(),
      exists: jest.fn()
    } as any;

    mockCalculations = {
      calculate: jest.fn(),
      calculateTotal: jest.fn()
    } as any;

    // Inject mocks
    service = new XxxService(mockRepository, mockCalculations);
  });

  describe('getAll', () => {
    it('should return all entities with calculated values', async () => {
      const mockEntities = [
        { id: '1', name: 'Test', value: 100 }
      ];
      mockRepository.findAll.mockResolvedValue(mockEntities as any);
      mockCalculations.calculate.mockReturnValue(150);

      const result = await service.getAll('user123');

      expect(result).toHaveLength(1);
      expect(result[0].calculatedValue).toBe(150);
      expect(mockRepository.findAll).toHaveBeenCalledWith('user123');
      expect(mockCalculations.calculate).toHaveBeenCalledWith(mockEntities[0]);
    });

    it('should return empty array if no entities', async () => {
      mockRepository.findAll.mockResolvedValue([]);

      const result = await service.getAll('user123');

      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledWith('user123');
    });
  });

  describe('getById', () => {
    it('should return entity by ID', async () => {
      const mockEntity = { id: '1', name: 'Test', userId: 'user123' };
      mockRepository.findById.mockResolvedValue(mockEntity as any);

      const result = await service.getById('1', 'user123');

      expect(result.id).toBe('1');
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundError if entity not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.getById('non-existent', 'user123')
      ).rejects.toThrow('not found');
    });

    it('should throw UnauthorizedError if wrong user', async () => {
      const mockEntity = { id: '1', name: 'Test', userId: 'other-user' };
      mockRepository.findById.mockResolvedValue(mockEntity as any);

      await expect(
        service.getById('1', 'user123')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('create', () => {
    it('should create entity', async () => {
      const dto = { name: 'New Entity', value: 100 };
      const mockCreated = { id: '1', ...dto, userId: 'user123' };
      mockRepository.countByUser.mockResolvedValue(5);
      mockRepository.create.mockResolvedValue(mockCreated as any);

      const result = await service.create('user123', dto);

      expect(result.id).toBe('1');
      expect(mockRepository.create).toHaveBeenCalledWith({
        name: 'New Entity',
        value: 100,
        userId: 'user123'
      });
    });

    it('should throw error if user has too many entities', async () => {
      mockRepository.countByUser.mockResolvedValue(10);

      await expect(
        service.create('user123', { name: 'Test' })
      ).rejects.toThrow('Maximum 10');
    });

    it('should set default if first entity', async () => {
      mockRepository.countByUser.mockResolvedValue(0);
      mockRepository.create.mockResolvedValue({ id: '1' } as any);

      await service.create('user123', { name: 'First' });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true })
      );
    });
  });

  describe('update', () => {
    it('should update entity', async () => {
      const mockExisting = { id: '1', name: 'Old', userId: 'user123' };
      const mockUpdated = { id: '1', name: 'New', userId: 'user123' };
      mockRepository.findById.mockResolvedValue(mockExisting as any);
      mockRepository.update.mockResolvedValue(mockUpdated as any);

      const result = await service.update('1', 'user123', { name: 'New' });

      expect(result.name).toBe('New');
      expect(mockRepository.update).toHaveBeenCalledWith('1', { name: 'New' });
    });

    it('should throw if entity not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent', 'user123', { name: 'New' })
      ).rejects.toThrow();
    });

    it('should throw if wrong user', async () => {
      mockRepository.findById.mockResolvedValue({
        id: '1',
        userId: 'other-user'
      } as any);

      await expect(
        service.update('1', 'user123', { name: 'New' })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('delete', () => {
    it('should delete entity', async () => {
      const mockEntity = { id: '1', userId: 'user123', isDefault: false };
      mockRepository.findById.mockResolvedValue(mockEntity as any);
      mockRepository.delete.mockResolvedValue();

      await service.delete('1', 'user123');

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw if trying to delete default entity', async () => {
      mockRepository.findById.mockResolvedValue({
        id: '1',
        userId: 'user123',
        isDefault: true
      } as any);

      await expect(
        service.delete('1', 'user123')
      ).rejects.toThrow('Cannot delete default');
    });
  });
});
```

### Required Test Cases

For every service:

- [ ] **Business Logic**: All business rules tested
- [ ] **Authorization**: User ownership verified
- [ ] **Error Cases**: Not found, unauthorized, constraint violations
- [ ] **Calculations**: Derived values computed correctly
- [ ] **Edge Cases**: Empty arrays, null values, boundary conditions

---

## 3. Controller Tests (Unit)

### Purpose

Test HTTP request/response handling with mocked service.

### Requirements

- ✅ MUST mock service layer
- ✅ MUST test request parsing
- ✅ MUST test response formatting
- ✅ MUST test status codes
- ✅ MUST test error handling
- ✅ MUST NOT use real HTTP server

### Template

**File**: `modules/[module]/__tests__/[module].controller.test.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { XxxController } from '../xxx.controller';
import { XxxService } from '../xxx.service';

describe('XxxController Unit Tests', () => {
  let controller: XxxController;
  let mockService: jest.Mocked<XxxService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockService = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    controller = new XxxController(mockService);

    req = {
      user: { id: 'user123', email: 'test@example.com' },
      params: {},
      body: {},
      query: {}
    };

    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('getAll', () => {
    it('should return 200 with data', async () => {
      const mockData = [{ id: '1', name: 'Test' }];
      mockService.getAll.mockResolvedValue(mockData as any);

      await controller.getAll(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({
        data: mockData,
        meta: { count: 1 }
      });
      expect(mockService.getAll).toHaveBeenCalledWith('user123');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next on error', async () => {
      const error = new Error('Service error');
      mockService.getAll.mockRejectedValue(error);

      await controller.getAll(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return 200 with entity', async () => {
      req.params = { id: '1' };
      const mockEntity = { id: '1', name: 'Test' };
      mockService.getById.mockResolvedValue(mockEntity as any);

      await controller.getById(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({ data: mockEntity });
      expect(mockService.getById).toHaveBeenCalledWith('1', 'user123');
    });
  });

  describe('create', () => {
    it('should return 201 with created entity', async () => {
      req.body = { name: 'New Entity' };
      const mockCreated = { id: '1', name: 'New Entity' };
      mockService.create.mockResolvedValue(mockCreated as any);

      await controller.create(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: mockCreated,
        message: expect.any(String)
      });
      expect(mockService.create).toHaveBeenCalledWith('user123', {
        name: 'New Entity'
      });
    });
  });

  describe('update', () => {
    it('should return 200 with updated entity', async () => {
      req.params = { id: '1' };
      req.body = { name: 'Updated' };
      const mockUpdated = { id: '1', name: 'Updated' };
      mockService.update.mockResolvedValue(mockUpdated as any);

      await controller.update(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith({
        data: mockUpdated,
        message: expect.any(String)
      });
    });
  });

  describe('delete', () => {
    it('should return 204 on success', async () => {
      req.params = { id: '1' };
      mockService.delete.mockResolvedValue();

      await controller.delete(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
```

### Required Test Cases

For every controller:

- [ ] **Success Cases**: 200 OK, 201 Created, 204 No Content
- [ ] **Error Handling**: next() called on errors
- [ ] **Request Parsing**: params, body, query extracted correctly
- [ ] **Response Format**: `{ data, meta, message }` structure
- [ ] **User Context**: req.user.id passed to service

---

## 4. E2E Tests (Integration)

### Purpose

Test full HTTP request/response flow with real server and database.

### Requirements

- ✅ MUST use Supertest for HTTP requests
- ✅ MUST use real database (test DB)
- ✅ MUST test full middleware chain (auth, validation, error handling)
- ✅ MUST clean database before each test
- ✅ MUST test happy paths and error cases

### Template

**File**: `backend/tests/integration/[module].integration.test.ts`

```typescript
import request from 'supertest';
import { app, prisma } from '../../src/app';

describe('Xxx API Integration Tests', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        passwordHash: 'hash123'
      }
    });
    userId = user.id;

    // Generate auth token (depends on your auth system)
    authToken = 'Bearer test-token-for-user123';
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.xxx.deleteMany();
  });

  describe('POST /api/xxx', () => {
    it('should create entity with valid data', async () => {
      const response = await request(app)
        .post('/api/xxx')
        .set('Authorization', authToken)
        .send({
          name: 'Test Entity',
          value: 100
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Test Entity');
      expect(response.body.data.id).toBeDefined();

      // Verify in database
      const entity = await prisma.xxx.findUnique({
        where: { id: response.body.data.id }
      });
      expect(entity).toBeDefined();
      expect(entity!.name).toBe('Test Entity');
    });

    it('should return 400 with invalid data', async () => {
      const response = await request(app)
        .post('/api/xxx')
        .set('Authorization', authToken)
        .send({
          name: '' // Invalid: empty name
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/xxx')
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/xxx', () => {
    it('should return all entities for user', async () => {
      // Create test data
      await prisma.xxx.createMany({
        data: [
          { name: 'Entity 1', userId },
          { name: 'Entity 2', userId }
        ]
      });

      const response = await request(app)
        .get('/api/xxx')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta.count).toBe(2);
    });

    it('should return empty array if no entities', async () => {
      const response = await request(app)
        .get('/api/xxx')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/xxx/:id', () => {
    it('should return entity by ID', async () => {
      const entity = await prisma.xxx.create({
        data: { name: 'Test', userId }
      });

      const response = await request(app)
        .get(`/api/xxx/${entity.id}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(entity.id);
      expect(response.body.data.name).toBe('Test');
    });

    it('should return 404 if entity not found', async () => {
      const response = await request(app)
        .get('/api/xxx/non-existent-id')
        .set('Authorization', authToken);

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/xxx/:id', () => {
    it('should update entity', async () => {
      const entity = await prisma.xxx.create({
        data: { name: 'Original', userId }
      });

      const response = await request(app)
        .patch(`/api/xxx/${entity.id}`)
        .set('Authorization', authToken)
        .send({ name: 'Updated' });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated');

      // Verify in database
      const updated = await prisma.xxx.findUnique({
        where: { id: entity.id }
      });
      expect(updated!.name).toBe('Updated');
    });
  });

  describe('DELETE /api/xxx/:id', () => {
    it('should delete entity', async () => {
      const entity = await prisma.xxx.create({
        data: { name: 'To Delete', userId }
      });

      const response = await request(app)
        .delete(`/api/xxx/${entity.id}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(204);

      // Verify deleted
      const deleted = await prisma.xxx.findUnique({
        where: { id: entity.id }
      });
      expect(deleted).toBeNull();
    });
  });
});
```

### Required Test Cases

For every API:

- [ ] **POST**: Success (201), validation error (400), unauthorized (401)
- [ ] **GET (list)**: Success (200), empty array, unauthorized
- [ ] **GET (single)**: Success (200), not found (404)
- [ ] **PATCH**: Success (200), not found (404), validation error (400)
- [ ] **DELETE**: Success (204), not found (404)

---

## Test Configuration

### Jest Configuration

**File**: `backend/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.integration.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.types.ts',
    '!src/**/*.validation.ts',
    '!src/server.ts'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### Test Database Setup

**File**: `backend/tests/setup.ts`

```typescript
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || 'postgresql://test:test@localhost:5432/test_db'
    }
  }
});

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Helper to clean all tables
export async function cleanDatabase() {
  const tables = ['transaction', 'holding', 'portfolio', 'market_data', 'user'];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
}
```

---

## Acceptance Criteria

### For Each Module

- [ ] ✅ Repository integration tests: 90%+ coverage
- [ ] ✅ Service unit tests: 95%+ coverage
- [ ] ✅ Controller unit tests: 90%+ coverage
- [ ] ✅ E2E tests for all endpoints
- [ ] ✅ Overall coverage: 85%+
- [ ] ✅ All tests pass
- [ ] ✅ Tests run in <30 seconds
- [ ] ✅ No flaky tests

### For CI/CD

- [ ] ✅ Tests run on every commit
- [ ] ✅ Coverage reports generated
- [ ] ✅ Build fails if coverage drops below threshold
- [ ] ✅ Test database automatically created/migrated

---

## Common Anti-Patterns

### ❌ FORBIDDEN: Testing Implementation Details

```typescript
// ❌ BAD: Testing private methods
it('should call internal method', () => {
  const spy = jest.spyOn(service as any, 'privateMethod');
  service.publicMethod();
  expect(spy).toHaveBeenCalled();
});

// ✅ GOOD: Testing public behavior
it('should calculate total correctly', () => {
  const result = service.publicMethod();
  expect(result.total).toBe(100);
});
```

### ❌ FORBIDDEN: Incomplete Mocks

```typescript
// ❌ BAD: Partial mock
mockRepo = { findAll: jest.fn() } as any;

// ✅ GOOD: Complete mock
mockRepo = {
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  // ... all methods
} as any;
```

### ❌ FORBIDDEN: Shared Test State

```typescript
// ❌ BAD: Shared state between tests
let sharedEntity: Entity;

it('test 1', async () => {
  sharedEntity = await service.create();
});

it('test 2', async () => {
  await service.update(sharedEntity.id); // Depends on test 1!
});

// ✅ GOOD: Independent tests
it('test 1', async () => {
  const entity = await service.create();
  // ...
});

it('test 2', async () => {
  const entity = await service.create(); // Fresh entity
  await service.update(entity.id);
});
```

---

## Test Checklist

Use this for every module:

### Repository Tests
- [ ] CRUD operations tested
- [ ] Relationships tested (includes, cascades)
- [ ] Unique constraints tested
- [ ] Error cases tested
- [ ] Real database used
- [ ] Database cleaned before each test

### Service Tests
- [ ] All public methods tested
- [ ] Business rules validated
- [ ] Authorization checked
- [ ] Error cases handled
- [ ] All dependencies mocked
- [ ] No database calls

### Controller Tests
- [ ] HTTP status codes correct
- [ ] Response format consistent
- [ ] Request parsing works
- [ ] Errors passed to next()
- [ ] Service mocked
- [ ] No HTTP server needed

### E2E Tests
- [ ] All endpoints tested
- [ ] Happy paths covered
- [ ] Error cases covered
- [ ] Auth tested
- [ ] Validation tested
- [ ] Real HTTP + DB

---

**Contract Version**: 1.0
**Date**: 2025-11-18
**Status**: BINDING - All modules MUST have comprehensive tests
