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

## Backend Architecture Patterns (003-backend-modular-architecture)

### Layered Architecture
All backend modules follow this pattern:
```
Routes → Controller → Service → Repository → Database
```

### Module Structure Template
```typescript
// Routes: Define endpoints and middleware
export function createXxxRoutes(controller: XxxController): Router

// Controller: Handle HTTP concerns (req/res)
export class XxxController {
  constructor(private readonly service: XxxService) {}
}

// Service: Implement business logic
export class XxxService {
  constructor(private readonly repository: XxxRepository) {}
}

// Repository: Abstract data access
export class XxxRepository {
  constructor(private readonly prisma: PrismaClient) {}
}

// Validation: Define Zod schemas
export const CreateXxxSchema = z.object({ ... })
```

### Dependency Injection
All dependencies are explicitly injected in `app.ts`:
```typescript
const prisma = new PrismaClient();
const repo = new XxxRepository(prisma);
const service = new XxxService(repo);
const controller = new XxxController(service);
const routes = createXxxRoutes(controller);
app.use('/api/xxx', routes);
```

### Testing Strategy
- Repository: Integration tests with real database (90%+ coverage)
- Service: Unit tests with mocked repository (95%+ coverage)
- Controller: Unit tests with mocked service (90%+ coverage)
- Routes: E2E tests with Supertest (80%+ coverage)
- Overall: 85%+ coverage required

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
- Use constructor injection for dependencies
- Follow layered architecture (Routes → Controller → Service → Repository)
- Repository layer handles ALL Prisma queries
- Service layer handles ALL business logic
- Controller layer handles ONLY HTTP concerns
- Use Zod for validation
- Response format: `{ data, meta?, message? }`
- Error handling: Pass to `next(error)` middleware

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
- 002-angular-modern-syntax: Added TypeScript 5.3+, Angular 17+ + @angular/core 17+, RxJS 7+, @ngrx/store 18+

- 003-backend-modular-architecture: Added planning documentation
- 002-angular-modern-syntax: Added planning documentation
- 001-crypto-portfolio-dashboard: Added

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
