# binance-portfolio Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-18

## Active Technologies
- TypeScript 5.3+, Angular 17+ + @angular/core 17+, RxJS 7+, @ngrx/store 18+ (002-angular-modern-syntax)
- PostgreSQL (via backend), Browser LocalStorage (frontend state) (002-angular-modern-syntax)

### Frontend
- TypeScript 5.3+
- Angular 17+
- @angular/core 17+
- RxJS 7+
- @ngrx/store 18+
- TailwindCSS 3+

### Backend
- TypeScript 5.3+
- Node.js 20+
- Express.js 4.18+
- Prisma 5.0+ (ORM)
- PostgreSQL 15+
- Zod 3.22+ (validation)
- Jest 29+ (testing)

### Storage
- PostgreSQL (primary database)
- Browser LocalStorage (client-side caching)

## Project Structure

```text
backend/
├── src/
│   ├── config/               # Configuration files
│   ├── shared/               # Shared middleware, services, types, utils
│   ├── modules/              # Feature modules (layered architecture)
│   │   ├── [module]/
│   │   │   ├── [module].routes.ts      # Express routes
│   │   │   ├── [module].controller.ts  # HTTP handlers
│   │   │   ├── [module].service.ts     # Business logic
│   │   │   ├── [module].repository.ts  # Data access
│   │   │   ├── [module].validation.ts  # Zod schemas
│   │   │   └── __tests__/              # Tests
│   ├── app.ts                # DI container, route mounting
│   └── server.ts             # Server startup
└── tests/                    # Integration tests

frontend/
├── src/
│   ├── app/
│   │   ├── core/             # Singleton services, guards
│   │   ├── shared/           # Shared components, pipes, directives
│   │   └── features/         # Feature modules
│   └── assets/
└── tests/
```

## Backend Architecture Patterns (004-backend-functional-refactor)

### Layered Architecture
All backend modules follow this pattern:
```
Routes → Controller (Handlers) → Service → Repository → Database
```

### Functional Module Pattern
**Use functions, NOT classes.** All backend code uses functional patterns with factory functions for dependency injection.

```typescript
// Repository: Type definition + factory function
export type XxxRepository = {
  findById: (id: string) => Promise<Entity | null>;
  create: (data: CreateDto) => Promise<Entity>;
};

export const createXxxRepository = (prisma: PrismaClient): XxxRepository => ({
  findById: async (id) => prisma.entity.findUnique({ where: { id } }),
  create: async (data) => prisma.entity.create({ data }),
});

// Service: Type definition + factory function
export type XxxService = {
  getEntity: (id: string) => Promise<EntityDto>;
  createEntity: (data: CreateDto) => Promise<EntityDto>;
};

export const createXxxService = (repository: XxxRepository): XxxService => ({
  getEntity: async (id) => {
    const entity = await repository.findById(id);
    if (!entity) throw new Error('Entity not found');
    return entity;
  },
  createEntity: async (data) => repository.create(data),
});

// Controller: Handler factory functions
export const createGetEntityHandler = (service: XxxService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entity = await service.getEntity(req.params.id);
      res.json({ success: true, data: entity, timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  };
};

// Routes: Default export with handler collection
export default function createXxxRoutes(handlers: XxxHandlers): Router {
  const router = Router();
  router.get('/:id', handlers.getEntity);
  router.post('/', validateRequest(CreateXxxSchema), handlers.createEntity);
  return router;
}

// Validation: Define Zod schemas
export const CreateXxxSchema = z.object({ ... })
```

### Dependency Injection (Functional Composition)
All dependencies are explicitly composed in `app.ts` using factory functions:
```typescript
const prisma = new PrismaClient();

// Bottom-up composition: Repository → Service → Handlers → Routes
const xxxRepo = createXxxRepository(prisma);
const xxxService = createXxxService(xxxRepo);
const xxxHandlers = {
  getEntity: createGetEntityHandler(xxxService),
  createEntity: createCreateEntityHandler(xxxService),
};
const xxxRoutes = createXxxRoutes(xxxHandlers);

app.use('/api/xxx', xxxRoutes);
```

### Export Strategy
- **Named exports**: Use for types, factory functions, handlers (everything except routes)
- **Default export**: Use ONLY for route factory functions
```typescript
// Named exports (standard)
export type XxxService = { ... };
export const createXxxService = (...) => { ... };
export const createGetXxxHandler = (...) => { ... };

// Default export (routes only)
export default function createXxxRoutes(...): Router { ... }
```

### Testing Strategy
- Repository: Integration tests with real database (90%+ coverage)
- Service: Unit tests with simple object mocks (95%+ coverage)
- Controller: Unit tests with mocked service (90%+ coverage)
- Routes: E2E tests with Supertest (80%+ coverage)
- Overall: 85%+ coverage required

**Testing is simpler**: Use plain objects for mocks (no mocking frameworks needed)
```typescript
// Simple object mock
const mockRepo: XxxRepository = {
  findById: jest.fn(),
  create: jest.fn(),
};
const service = createXxxService(mockRepo);
```

## Angular Modern Syntax (002-angular-modern-syntax)

### Component Patterns
```typescript
// Use inject() for dependency injection
private readonly service = inject(MyService);

// Use signal-based inputs
value = input<string>('');
requiredValue = input.required<number>();

// Use signal-based outputs
valueChange = output<string>();

// Use computed() for derived state
protected readonly computedValue = computed(() => this.value().toUpperCase());

// Use effect() for reactive side effects
constructor() {
  effect(() => console.log('Value:', this.value()));
}
```

## Commands

# Backend
npm run dev          # Start dev server
npm run build        # Build TypeScript
npm test             # Run tests
npm run test:cov     # Run tests with coverage

# Frontend
npm start            # Start dev server
npm run build        # Build for production
npm test             # Run tests

## Code Style

### Backend
- Use TypeScript strict mode
- **Use functions, NOT classes** - functional programming patterns only
- Use factory functions for dependency injection (e.g., `createXxxService(deps)`)
- Use **named exports** for everything except routes (which use default export)
- Follow layered architecture (Routes → Handlers → Service → Repository)
- Repository layer handles ALL Prisma queries
- Service layer handles ALL business logic
- Controller layer (handlers) handles ONLY HTTP concerns
- Export types before implementations: `export type XxxService = { ... }`
- Use Zod for validation
- Response format: `{ success, data, timestamp, message? }`
- Error handling: Pass to `next(error)` middleware
- Testing: Use simple object mocks (no mocking frameworks needed)

### Frontend
- Use Angular standalone components
- Use modern dependency injection: `inject()`
- Use signal-based inputs: `input<T>()`
- Use signal-based outputs: `output<T>()`
- Use `computed()` for derived state
- Use `effect()` for side effects
- Use OnPush change detection strategy
- Follow reactive programming patterns

## Recent Changes
- 004-backend-functional-refactor: Refactored backend to use functional patterns (factory functions, named exports, no classes)
- 002-angular-modern-syntax: Added TypeScript 5.3+, Angular 17+ + @angular/core 17+, RxJS 7+, @ngrx/store 18+
- 003-backend-modular-architecture: Added planning documentation
- 002-angular-modern-syntax: Added planning documentation
- 001-crypto-portfolio-dashboard: Added

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
