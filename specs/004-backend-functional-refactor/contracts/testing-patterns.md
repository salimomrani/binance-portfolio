# Contract: Testing Patterns for Functional Code

**Version**: 1.0.0
**Status**: Normative
**Purpose**: Define testing standards for functional backend modules

## Overview

Testing functional code is **simpler** than testing classes because:
- No mocking frameworks needed (plain objects implement interfaces)
- No `this` binding issues
- Dependencies are explicit function parameters
- Pure functions are deterministic and predictable

This document defines testing patterns for Repository, Service, and Controller layers.

## 1. Repository Testing (Integration Tests)

### 1.1 Purpose

Repository tests verify **database interactions** using a real database (Prisma).

### 1.2 Pattern

```typescript
// __tests__/portfolio.repository.test.ts
import { PrismaClient } from '@prisma/client';
import { createPortfolioRepository, PortfolioRepository } from '../portfolio.repository';

describe('PortfolioRepository', () => {
  let prisma: PrismaClient;
  let repository: PortfolioRepository;

  beforeAll(async () => {
    // Connect to test database
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
        },
      },
    });

    // Create repository instance
    repository = createPortfolioRepository(prisma);
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await prisma.portfolio.deleteMany();
    await prisma.holding.deleteMany();
  });

  describe('findById', () => {
    it('should return portfolio when it exists', async () => {
      // Arrange: Create test data
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: 'test-user',
          name: 'Test Portfolio',
          description: 'Test description',
        },
      });

      // Act: Call repository method
      const result = await repository.findById(portfolio.id);

      // Assert: Verify result
      expect(result).toBeDefined();
      expect(result?.id).toBe(portfolio.id);
      expect(result?.name).toBe('Test Portfolio');
    });

    it('should return null when portfolio does not exist', async () => {
      // Act
      const result = await repository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create portfolio with valid data', async () => {
      // Arrange
      const data = {
        userId: 'test-user',
        name: 'New Portfolio',
        description: 'Description',
      };

      // Act
      const result = await repository.create(data);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('New Portfolio');
      expect(result.userId).toBe('test-user');

      // Verify in database
      const dbPortfolio = await prisma.portfolio.findUnique({
        where: { id: result.id },
      });
      expect(dbPortfolio).toBeDefined();
    });
  });

  describe('findAllWithHoldings', () => {
    it('should return portfolios with holdings', async () => {
      // Arrange: Create portfolio with holdings
      const portfolio = await prisma.portfolio.create({
        data: {
          userId: 'test-user',
          name: 'Test Portfolio',
          holdings: {
            create: [
              { symbol: 'BTC', quantity: 1.5, averagePrice: 50000 },
              { symbol: 'ETH', quantity: 10, averagePrice: 3000 },
            ],
          },
        },
        include: { holdings: true },
      });

      // Act
      const result = await repository.findAllWithHoldings('test-user');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].holdings).toHaveLength(2);
      expect(result[0].holdings[0].symbol).toBe('BTC');
    });
  });
});
```

### 1.3 Rules

1. **MUST** use real PrismaClient (no mocks)
2. **MUST** use test database (separate from development)
3. **MUST** clean up data before each test (`beforeEach`)
4. **MUST** disconnect after all tests (`afterAll`)
5. **SHOULD** test happy path and error cases
6. **SHOULD** verify data in database after mutations
7. **TARGET**: ≥90% coverage for repository layer

### 1.4 Test Database Setup

```typescript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};

// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Run migrations on test database
  // await execSync('npx prisma migrate deploy');
});

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect();
});
```

## 2. Service Testing (Unit Tests)

### 2.1 Purpose

Service tests verify **business logic** with mocked dependencies (repository, other services).

### 2.2 Pattern

```typescript
// __tests__/portfolio.service.test.ts
import type { PortfolioRepository } from '../portfolio.repository';
import type { MarketDataService } from '../../market-data/market-data.service';
import type { CalculationsService } from '../../../shared/services/calculations.service';
import { createPortfolioService, PortfolioService } from '../portfolio.service';
import { Portfolio } from '@prisma/client';

describe('PortfolioService', () => {
  let service: PortfolioService;
  let mockRepository: PortfolioRepository;
  let mockMarketData: MarketDataService;
  let mockCalculations: CalculationsService;

  beforeEach(() => {
    // Create mocks implementing type interfaces
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

    mockCalculations = {
      calculatePercentageChange: jest.fn(),
      calculateTotalValue: jest.fn(),
      calculateAllocation: jest.fn(),
    };

    // Create service with mocks
    service = createPortfolioService(mockRepository, mockMarketData, mockCalculations);
  });

  describe('getPortfolioById', () => {
    it('should return portfolio details when portfolio exists', async () => {
      // Arrange
      const mockPortfolio: Portfolio = {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test Portfolio',
        description: 'Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById = jest.fn().mockResolvedValue(mockPortfolio);

      // Act
      const result = await service.getPortfolioById('portfolio-1');

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('portfolio-1');
      expect(mockRepository.findById).toHaveBeenCalledWith('portfolio-1');
      expect(mockRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw error when portfolio not found', async () => {
      // Arrange
      mockRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(service.getPortfolioById('non-existent')).rejects.toThrow('Portfolio not found');
      expect(mockRepository.findById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('createPortfolio', () => {
    it('should create portfolio with valid data', async () => {
      // Arrange
      const createData = {
        name: 'New Portfolio',
        description: 'New Description',
      };

      const mockCreatedPortfolio: Portfolio = {
        id: 'new-portfolio-id',
        userId: 'user-1',
        name: 'New Portfolio',
        description: 'New Description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create = jest.fn().mockResolvedValue(mockCreatedPortfolio);

      // Act
      const result = await service.createPortfolio('user-1', createData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('new-portfolio-id');
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        name: 'New Portfolio',
        description: 'New Description',
      });
    });

    it('should throw error when name is too short', async () => {
      // Arrange
      const invalidData = {
        name: 'AB', // Too short
        description: 'Description',
      };

      // Act & Assert
      await expect(service.createPortfolio('user-1', invalidData)).rejects.toThrow(
        /name must be at least/i
      );

      // Verify repository was NOT called
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('calculatePortfolioStatistics', () => {
    it('should calculate statistics using holdings and prices', async () => {
      // Arrange
      const mockPortfolio = {
        id: 'portfolio-1',
        userId: 'user-1',
        name: 'Test',
        holdings: [
          { symbol: 'BTC', quantity: new Decimal(1), averagePrice: new Decimal(50000) },
          { symbol: 'ETH', quantity: new Decimal(10), averagePrice: new Decimal(3000) },
        ],
      };

      const mockPrices = new Map([
        ['BTC', { symbol: 'BTC', price: 60000, change24h: 0.2, timestamp: new Date() }],
        ['ETH', { symbol: 'ETH', price: 3500, change24h: 0.15, timestamp: new Date() }],
      ]);

      mockRepository.findWithHoldingsAndPrices = jest.fn().mockResolvedValue(mockPortfolio);
      mockMarketData.getCurrentPrices = jest.fn().mockResolvedValue(mockPrices);
      mockCalculations.calculateTotalValue = jest.fn().mockReturnValue(new Decimal(95000));
      mockCalculations.calculatePercentageChange = jest.fn().mockReturnValue(new Decimal(18.75));

      // Act
      const result = await service.calculatePortfolioStatistics('portfolio-1');

      // Assert
      expect(result.totalValue).toEqual(expect.any(Number));
      expect(mockCalculations.calculateTotalValue).toHaveBeenCalled();
      expect(mockMarketData.getCurrentPrices).toHaveBeenCalledWith(['BTC', 'ETH']);
    });
  });
});
```

### 2.3 Rules

1. **MUST** mock all dependencies (repository, other services)
2. **MUST** create mocks that implement type interfaces
3. **MUST** test business logic (validation, calculations, orchestration)
4. **MUST** test error cases (not found, invalid input, etc.)
5. **SHOULD** verify mock calls with `toHaveBeenCalledWith()`
6. **SHOULD** test edge cases (empty arrays, null values, etc.)
7. **TARGET**: ≥95% coverage for service layer

### 2.4 Mock Creation Pattern

```typescript
// Simple object mock (no framework needed!)
const mockRepository: PortfolioRepository = {
  findById: jest.fn(),
  findByUserId: jest.fn(),
  // ... implement ALL methods from type
};

// Configure mock behavior per test
mockRepository.findById = jest.fn().mockResolvedValue(mockData);

// Or chain configuration
mockRepository.findById = jest.fn()
  .mockResolvedValueOnce(mockData1)
  .mockResolvedValueOnce(mockData2);
```

**Advantage**: TypeScript ensures mock implements complete interface!

## 3. Controller Testing (Unit Tests)

### 3.1 Purpose

Controller tests verify **HTTP handling** (request parsing, response formatting) with mocked services.

### 3.2 Pattern

```typescript
// __tests__/portfolio.controller.test.ts
import type { Request, Response, NextFunction } from 'express';
import type { PortfolioService } from '../portfolio.service';
import {
  createGetPortfoliosHandler,
  createGetPortfolioByIdHandler,
  createCreatePortfolioHandler,
} from '../portfolio.controller';

describe('PortfolioController', () => {
  let mockService: PortfolioService;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    // Mock service
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

    // Mock Express req/res/next
    mockReq = {
      params: {},
      query: {},
      body: {},
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('createGetPortfoliosHandler', () => {
    it('should return portfolios for user', async () => {
      // Arrange
      const mockPortfolios = [
        { id: 'p1', name: 'Portfolio 1', totalValue: 10000, change24h: 5 },
        { id: 'p2', name: 'Portfolio 2', totalValue: 20000, change24h: -2 },
      ];

      mockService.getPortfolios = jest.fn().mockResolvedValue(mockPortfolios);
      mockReq.headers = { 'x-user-id': 'user-123' };

      // Act
      const handler = createGetPortfoliosHandler(mockService);
      await handler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockService.getPortfolios).toHaveBeenCalledWith('user-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPortfolios,
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use default user ID when header is missing', async () => {
      // Arrange
      mockService.getPortfolios = jest.fn().mockResolvedValue([]);
      mockReq.headers = {}; // No user ID header

      // Act
      const handler = createGetPortfoliosHandler(mockService);
      await handler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockService.getPortfolios).toHaveBeenCalledWith('mock-user-id');
    });

    it('should call next() with error on service failure', async () => {
      // Arrange
      const error = new Error('Service error');
      mockService.getPortfolios = jest.fn().mockRejectedValue(error);
      mockReq.headers = { 'x-user-id': 'user-123' };

      // Act
      const handler = createGetPortfoliosHandler(mockService);
      await handler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('createGetPortfolioByIdHandler', () => {
    it('should return portfolio by ID', async () => {
      // Arrange
      const mockPortfolio = {
        id: 'p1',
        name: 'Test Portfolio',
        description: 'Description',
        holdings: [],
      };

      mockService.getPortfolioById = jest.fn().mockResolvedValue(mockPortfolio);
      mockReq.params = { id: 'p1' };

      // Act
      const handler = createGetPortfolioByIdHandler(mockService);
      await handler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockService.getPortfolioById).toHaveBeenCalledWith('p1');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPortfolio,
        timestamp: expect.any(String),
      });
    });
  });

  describe('createCreatePortfolioHandler', () => {
    it('should create portfolio with request body', async () => {
      // Arrange
      const createData = {
        name: 'New Portfolio',
        description: 'Description',
      };

      const mockCreatedPortfolio = {
        id: 'new-id',
        userId: 'user-123',
        ...createData,
      };

      mockService.createPortfolio = jest.fn().mockResolvedValue(mockCreatedPortfolio);
      mockReq.headers = { 'x-user-id': 'user-123' };
      mockReq.body = createData;

      // Act
      const handler = createCreatePortfolioHandler(mockService);
      await handler(mockReq as Request, mockRes as Response, mockNext);

      // Assert
      expect(mockService.createPortfolio).toHaveBeenCalledWith('user-123', createData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedPortfolio,
        message: 'Portfolio created successfully',
        timestamp: expect.any(String),
      });
    });
  });
});
```

### 3.3 Rules

1. **MUST** mock service dependencies
2. **MUST** mock Express req/res/next
3. **MUST** test HTTP status codes
4. **MUST** test response format
5. **MUST** test error handling (call to `next(error)`)
6. **SHOULD** test request parsing (params, query, body, headers)
7. **SHOULD** test edge cases (missing headers, invalid params)
8. **TARGET**: ≥90% coverage for controller layer

### 3.4 Mock Request/Response Pattern

```typescript
// Minimal mock (only what's needed)
const mockReq: Partial<Request> = {
  params: { id: 'test-id' },
  body: { name: 'Test' },
  headers: { 'x-user-id': 'user-123' },
};

// Mock response with method chaining
const mockRes: Partial<Response> = {
  status: jest.fn().mockReturnThis(), // Enable chaining: res.status(200).json(...)
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
};

// Mock next function
const mockNext: jest.MockedFunction<NextFunction> = jest.fn();
```

## 4. Route Testing (E2E Tests)

### 4.1 Purpose

Route tests verify **complete request flow** using Supertest (HTTP client for testing).

### 4.2 Pattern

```typescript
// __tests__/portfolio.routes.test.ts
import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../../app';

describe('Portfolio Routes (E2E)', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Setup test app with real dependencies
    prisma = new PrismaClient();
    app = createApp(); // Factory function that creates app
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database
    await prisma.portfolio.deleteMany();
    await prisma.holding.deleteMany();
  });

  describe('GET /api/portfolios', () => {
    it('should return empty array when no portfolios', async () => {
      const response = await request(app)
        .get('/api/portfolios')
        .set('x-user-id', 'test-user')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should return user portfolios', async () => {
      // Arrange: Create test data
      await prisma.portfolio.createMany({
        data: [
          { userId: 'test-user', name: 'Portfolio 1' },
          { userId: 'test-user', name: 'Portfolio 2' },
          { userId: 'other-user', name: 'Other Portfolio' },
        ],
      });

      // Act
      const response = await request(app)
        .get('/api/portfolios')
        .set('x-user-id', 'test-user')
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Portfolio 1');
    });
  });

  describe('POST /api/portfolios', () => {
    it('should create portfolio with valid data', async () => {
      const createData = {
        name: 'New Portfolio',
        description: 'Test description',
      };

      const response = await request(app)
        .post('/api/portfolios')
        .set('x-user-id', 'test-user')
        .send(createData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Portfolio');
      expect(response.body.message).toBe('Portfolio created successfully');

      // Verify in database
      const portfolios = await prisma.portfolio.findMany({
        where: { userId: 'test-user' },
      });
      expect(portfolios).toHaveLength(1);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '', // Empty name
      };

      const response = await request(app)
        .post('/api/portfolios')
        .set('x-user-id', 'test-user')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});
```

### 4.3 Rules

1. **MUST** use Supertest for HTTP requests
2. **MUST** use real database (test database)
3. **MUST** clean database before each test
4. **SHOULD** test happy path and error cases
5. **SHOULD** verify database state after mutations
6. **SHOULD** test authentication/authorization if applicable
7. **TARGET**: ≥80% coverage for E2E tests (critical paths)

## 5. Coverage Requirements

### 5.1 Target Coverage

| Layer | Coverage Target | Reason |
|-------|----------------|--------|
| Repository | ≥90% | Critical data access layer |
| Service | ≥95% | Core business logic |
| Controller | ≥90% | HTTP handling |
| Routes | ≥80% | E2E happy paths |
| **Overall** | **≥85%** | Project requirement |

### 5.2 Check Coverage

```bash
npm run test:coverage
```

Output:
```
----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------|---------|----------|---------|---------|-------------------
All files             |   88.24 |    82.35 |   90.91 |   87.50 |
 portfolio.repository |   92.31 |    85.71 |   100   |   91.67 | 45-47
 portfolio.service    |   96.67 |    90.00 |   100   |   96.15 | 123
 portfolio.controller |   91.67 |    80.00 |   87.50 |   90.91 | 78,145
```

### 5.3 Uncovered Lines

**Rule**: Document why lines are uncovered or add tests.

Example:
```typescript
// Uncovered: Error case that requires real API failure
// TODO: Add integration test with API mock
```

## 6. Test Organization

### 6.1 Directory Structure

```
backend/src/modules/portfolio/
├── __tests__/
│   ├── portfolio.repository.test.ts  # Integration tests
│   ├── portfolio.service.test.ts     # Unit tests
│   ├── portfolio.controller.test.ts  # Unit tests
│   └── portfolio.routes.test.ts      # E2E tests (optional)
├── portfolio.repository.ts
├── portfolio.service.ts
├── portfolio.controller.ts
└── portfolio.routes.ts
```

### 6.2 Test File Naming

- `{module}.repository.test.ts` - Repository integration tests
- `{module}.service.test.ts` - Service unit tests
- `{module}.controller.test.ts` - Controller unit tests
- `{module}.routes.test.ts` - E2E route tests (optional)

### 6.3 Test Descriptions

Use descriptive test names:

```typescript
// Good: Descriptive
it('should return portfolio when it exists', async () => { ... });
it('should throw error when portfolio not found', async () => { ... });

// Bad: Vague
it('should work', async () => { ... });
it('test findById', async () => { ... });
```

## 7. Common Testing Patterns

### 7.1 Testing Async Functions

```typescript
it('should handle async operation', async () => {
  // Always use async/await in tests
  const result = await service.getPortfolio('id');
  expect(result).toBeDefined();
});
```

### 7.2 Testing Errors

```typescript
it('should throw error for invalid input', async () => {
  await expect(service.createPortfolio('', invalidData)).rejects.toThrow('Invalid');
});

// Or with specific error type
await expect(service.getPortfolio('bad-id')).rejects.toThrow(NotFoundError);
```

### 7.3 Testing Mock Calls

```typescript
it('should call repository with correct params', async () => {
  await service.getPortfolio('portfolio-1');

  expect(mockRepository.findById).toHaveBeenCalledWith('portfolio-1');
  expect(mockRepository.findById).toHaveBeenCalledTimes(1);
});
```

### 7.4 Testing Return Values

```typescript
it('should return formatted data', async () => {
  const result = await service.getPortfolio('id');

  expect(result).toMatchObject({
    id: 'id',
    name: expect.any(String),
    totalValue: expect.any(Number),
  });
});
```

## 8. Migration Testing Checklist

When migrating tests from class-based to functional:

- [ ] Update imports: `import { create... }` instead of `import { Class }`
- [ ] Update instance creation: `createService(deps)` instead of `new Service(deps)`
- [ ] Simplify mocks: Plain objects instead of `jest.Mocked<Class>`
- [ ] Update type annotations: Use exported types
- [ ] Run tests: `npm test`
- [ ] Check coverage: `npm run test:coverage`
- [ ] Verify coverage ≥ baseline

## Summary

Testing functional code is simpler:
- **Repository**: Integration tests with real database
- **Service**: Unit tests with simple object mocks
- **Controller**: Unit tests with mocked services and req/res
- **Routes**: E2E tests with Supertest (optional but recommended)

**Coverage target**: ≥85% overall, with higher requirements for critical layers.

**Next**: Apply these patterns when refactoring tests during migration.
