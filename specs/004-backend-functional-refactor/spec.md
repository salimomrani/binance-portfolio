# Feature Specification: Backend Functional Refactor

**Feature ID**: 004-backend-functional-refactor
**Status**: Planning
**Created**: 2025-11-18
**Priority**: High

## Overview

Refactor the backend codebase from class-based architecture to functional programming patterns, using plain functions with explicit dependency injection via function parameters instead of class constructors. This aligns with modern TypeScript best practices and simplifies testing and composition.

## Background

The current backend architecture (003-backend-modular-architecture) uses class-based patterns for Controllers, Services, and Repositories. While this provides structure, it introduces unnecessary complexity and ceremony. Functional patterns offer:

- **Simpler composition**: Functions compose naturally without inheritance or this binding
- **Easier testing**: Dependencies are explicit parameters, no mocking frameworks needed
- **Better tree-shaking**: Named exports enable better dead code elimination
- **Less boilerplate**: No constructor injection, class keywords, or this references
- **Type safety**: Function signatures are the contract, no hidden state

## Goals

### Primary Goals

1. Convert all backend classes to pure functions
2. Replace class-based dependency injection with function parameters
3. Use named exports (`export const`, `export function`) for all public APIs
4. Use default exports only for route definitions
5. Maintain 100% feature parity with existing class-based implementation
6. Achieve same or better test coverage (85%+ overall)

### Secondary Goals

1. Update documentation to reflect functional patterns
2. Provide migration guide for future modules
3. Update CLAUDE.md with new functional architecture patterns

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | All Controllers converted to handler functions accepting (req, res, next) | Must Have |
| FR-002 | All Services converted to pure functions accepting dependencies as parameters | Must Have |
| FR-003 | All Repositories converted to functions accepting PrismaClient as parameter | Must Have |
| FR-004 | Route definitions use factory functions that accept controller functions | Must Have |
| FR-005 | All exports use named exports except route defaults | Must Have |
| FR-006 | Dependency injection performed in app.ts using explicit function calls | Must Have |
| FR-007 | All existing tests updated to work with functional patterns | Must Have |
| FR-008 | Zero regression in functionality or API contracts | Must Have |

### Non-Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-001 | Maintain or improve test coverage (≥85% overall) | Must Have |
| NFR-002 | No performance degradation in API response times | Must Have |
| NFR-003 | Bundle size reduced or maintained (no increase) | Should Have |
| NFR-004 | All modules follow consistent functional patterns | Must Have |
| NFR-005 | Documentation updated within 24h of code changes | Must Have |

## Architecture Patterns

### Current (Class-Based)

```typescript
// portfolio.controller.ts
export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}

  async getPortfolio(req: Request, res: Response, next: NextFunction) {
    // implementation
  }
}

// portfolio.service.ts
export class PortfolioService {
  constructor(private readonly repository: PortfolioRepository) {}

  async getPortfolioById(userId: string): Promise<Portfolio> {
    // implementation
  }
}

// app.ts
const repo = new PortfolioRepository(prisma);
const service = new PortfolioService(repo);
const controller = new PortfolioController(service);
const routes = createPortfolioRoutes(controller);
```

### Target (Functional)

```typescript
// portfolio.controller.ts
export const createGetPortfolioHandler = (service: PortfolioService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // implementation
  };
};

// Or with explicit type
export type GetPortfolioHandler = RequestHandler;
export const getPortfolioHandler = (service: PortfolioService): GetPortfolioHandler => {
  return async (req, res, next) => {
    // implementation
  };
};

// portfolio.service.ts
export type PortfolioService = {
  getPortfolioById: (userId: string) => Promise<Portfolio>;
  // other methods
};

export const createPortfolioService = (repository: PortfolioRepository): PortfolioService => ({
  getPortfolioById: async (userId: string) => {
    return repository.findByUserId(userId);
  },
  // other methods
});

// portfolio.repository.ts
export type PortfolioRepository = {
  findByUserId: (userId: string) => Promise<Portfolio | null>;
  // other methods
};

export const createPortfolioRepository = (prisma: PrismaClient): PortfolioRepository => ({
  findByUserId: async (userId: string) => {
    return prisma.portfolio.findUnique({ where: { userId } });
  },
  // other methods
});

// portfolio.routes.ts
export default function createPortfolioRoutes(handlers: PortfolioHandlers): Router {
  const router = Router();
  router.get('/', handlers.getPortfolio);
  return router;
}

// app.ts
const portfolioRepo = createPortfolioRepository(prisma);
const portfolioService = createPortfolioService(portfolioRepo);
const portfolioHandlers = {
  getPortfolio: createGetPortfolioHandler(portfolioService),
  // other handlers
};
const portfolioRoutes = createPortfolioRoutes(portfolioHandlers);
app.use('/api/portfolio', portfolioRoutes);
```

## Modules to Refactor

Based on the current codebase structure:

1. **market-data** module
2. **portfolio** module
3. **binance** module
4. Any other existing modules following class-based patterns

## Success Criteria

1. All backend classes removed, replaced with functions
2. All tests passing with ≥85% coverage
3. API contracts unchanged (same endpoints, same responses)
4. Documentation updated (CLAUDE.md, module READMEs)
5. No ESLint errors or TypeScript errors
6. Performance benchmarks equal or better than baseline

## Out of Scope

- Frontend changes (remains class-based for Angular components)
- Database schema changes
- API endpoint changes
- New features or functionality
- Performance optimizations beyond maintaining current levels

## Migration Strategy

1. **Phase 0**: Research functional DI patterns in TypeScript/Express
2. **Phase 1**: Define new functional architecture patterns and contracts
3. **Phase 2**: Refactor one module as reference implementation
4. **Phase 3**: Apply pattern to all other modules
5. **Phase 4**: Update documentation and create migration guide

## Dependencies

- None (refactoring existing code)

## Timeline

- Phase 0 (Research): 1 hour
- Phase 1 (Design): 1 hour
- Phase 2 (Reference Implementation): 2 hours
- Phase 3 (Full Refactor): 3-4 hours
- Phase 4 (Documentation): 1 hour

**Total Estimate**: 8-9 hours

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking changes in API behavior | High | Comprehensive test suite, contract testing |
| Test coverage drops during refactor | Medium | Update tests incrementally with code |
| Inconsistent patterns across modules | Medium | Create reference implementation first |
| Performance regression | Low | Benchmark before/after, functions are typically faster |

## Questions for Clarification

None - this is a technical refactoring with clear scope.

## References

- Current architecture: 003-backend-modular-architecture
- CLAUDE.md guidelines
- TypeScript functional programming patterns
