# Implementation Plan: Backend Modular Architecture

**Branch**: `003-backend-modular-architecture` | **Date**: 2025-11-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-backend-modular-architecture/spec.md`

## Summary

Refactor the backend to follow a consistent layered architecture with clear separation of concerns. Introduce a repository layer for data access abstraction, extract routes into separate files, and establish explicit dependency injection. This will improve testability, maintainability, and scalability while preserving all existing functionality.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 20+
**Primary Dependencies**: Express.js 4.18+, Prisma 5.0+, Zod 3.22+, Jest 29+
**Storage**: PostgreSQL 15+ (via Prisma ORM)
**Testing**: Jest 29+ for unit/integration tests, Supertest for HTTP tests
**Target Platform**: Linux/macOS servers, Docker containers
**Project Type**: Web application backend (REST API)
**Performance Goals**: ≤50ms p95 for simple queries, ≤200ms for complex aggregations
**Constraints**: Zero API breaking changes, maintain backward compatibility
**Scale/Scope**: 5 modules, ~30 new files (repositories + routes), ~20 files to refactor

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Security-First
- **Status**: PASS
- **Justification**: Architecture refactoring doesn't affect security model. All validation, authentication, and authorization remain unchanged. Repository pattern adds an additional abstraction layer for security auditing.

### ✅ Type Safety & Data Validation
- **Status**: PASS with IMPROVEMENT
- **Justification**: TypeScript strict mode maintained. Repository interfaces provide additional type safety. Zod validation schemas remain unchanged. Better separation makes validation easier to audit.

### ✅ Modular Architecture
- **Status**: PASS with IMPROVEMENT
- **Justification**: This is the primary goal - establishing proper modular architecture with clear boundaries. Improves separation of concerns significantly.

### ✅ API Integration Reliability
- **Status**: PASS
- **Justification**: External API integrations (Binance, CoinGecko) remain in their current locations. Repository pattern doesn't affect external API calls. Retry logic and caching unchanged.

### ✅ Testing Strategy
- **Status**: PASS with IMPROVEMENT
- **Justification**: Layered architecture significantly improves testability. Each layer can be tested independently. Repository can be mocked for fast unit tests. Integration tests use real database.

### ✅ Performance & Real-Time Updates
- **Status**: PASS
- **Justification**: Repository pattern adds one function call overhead (~0.01ms). Prisma queries remain identical. Caching strategy unchanged. Overall performance impact negligible.

### ✅ Observability & User Experience
- **Status**: PASS
- **Justification**: Logging and error handling unchanged. UX identical. Better error propagation through layers may improve debugging.

## Project Structure

### Documentation (this feature)

```text
specs/003-backend-modular-architecture/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Layered architecture research
├── data-model.md        # Module dependency graph
├── quickstart.md        # Migration guide
└── contracts/           # Test contracts and acceptance criteria
    ├── module-structure.md
    └── testing-contract.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/                      # ✅ No changes
│   │   ├── env.config.ts
│   │   └── database.config.ts
│   │
│   ├── shared/                      # ✅ No changes (already well-structured)
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── prisma/                      # ✅ No changes
│   │   └── seed.ts
│   │
│   ├── modules/
│   │   ├── portfolio/               # 🔄 Refactor
│   │   │   ├── portfolio.routes.ts          # 🆕 NEW
│   │   │   ├── portfolio.controller.ts      # 🔄 Refactor (remove Prisma)
│   │   │   ├── portfolio.service.ts         # 🔄 Refactor (use repository)
│   │   │   ├── portfolio.repository.ts      # 🆕 NEW
│   │   │   ├── portfolio.validation.ts      # ✅ Keep
│   │   │   ├── portfolio.types.ts           # ✅ Keep
│   │   │   ├── binance-sync.service.ts      # ✅ Keep (special service)
│   │   │   └── __tests__/                   # 🆕 NEW
│   │   │       ├── portfolio.controller.test.ts
│   │   │       ├── portfolio.service.test.ts
│   │   │       └── portfolio.repository.test.ts
│   │   │
│   │   ├── holdings/                # 🔄 Refactor
│   │   │   ├── holdings.routes.ts           # 🆕 NEW
│   │   │   ├── holdings.controller.ts       # 🔄 Refactor
│   │   │   ├── holdings.service.ts          # 🔄 Refactor
│   │   │   ├── holdings.repository.ts       # 🆕 NEW
│   │   │   ├── holdings.validation.ts       # ✅ Keep
│   │   │   ├── transaction.service.ts       # 🔄 Refactor
│   │   │   ├── transaction.repository.ts    # 🆕 NEW
│   │   │   ├── transaction.validation.ts    # ✅ Keep
│   │   │   └── __tests__/                   # 🆕 NEW
│   │   │
│   │   ├── market-data/             # 🔄 Refactor
│   │   │   ├── market-data.routes.ts        # 🆕 NEW
│   │   │   ├── market-data.controller.ts    # 🔄 Refactor
│   │   │   ├── market-data.service.ts       # 🔄 Refactor
│   │   │   ├── market-data.repository.ts    # 🆕 NEW
│   │   │   ├── market-data.cache.ts         # ✅ Keep
│   │   │   ├── market-data.types.ts         # ✅ Keep
│   │   │   ├── binance.adapter.ts           # ✅ Keep
│   │   │   ├── coingecko.adapter.ts         # ✅ Keep
│   │   │   └── __tests__/                   # 🆕 NEW
│   │   │
│   │   ├── watchlist/               # 🔄 Refactor (if implemented)
│   │   │   ├── watchlist.routes.ts          # 🆕 NEW
│   │   │   ├── watchlist.controller.ts      # 🆕 NEW
│   │   │   ├── watchlist.service.ts         # 🆕 NEW
│   │   │   ├── watchlist.repository.ts      # 🆕 NEW
│   │   │   ├── watchlist.validation.ts      # 🆕 NEW
│   │   │   └── __tests__/                   # 🆕 NEW
│   │   │
│   │   └── auth/                    # 🔄 Refactor (if implemented)
│   │       ├── auth.routes.ts               # 🆕 NEW
│   │       ├── auth.controller.ts           # 🆕 NEW
│   │       ├── auth.service.ts              # 🆕 NEW
│   │       ├── auth.repository.ts           # 🆕 NEW
│   │       ├── auth.validation.ts           # 🆕 NEW
│   │       └── __tests__/                   # 🆕 NEW
│   │
│   ├── app.ts                       # 🔄 Refactor (DI, route mounting)
│   └── server.ts                    # ✅ No changes
│
└── tests/                           # 🔄 Add integration tests
    ├── integration/
    │   ├── portfolio.integration.test.ts
    │   ├── holdings.integration.test.ts
    │   └── market-data.integration.test.ts
    └── setup.ts
```

**Structure Decision**: Layered architecture with explicit separation of concerns. Each module follows the pattern: Routes → Controller → Service → Repository → Database. Dependency injection is explicit in `app.ts`.

**Legend**:
- 🆕 = New files to create
- 🔄 = Files to refactor
- ✅ = No changes needed

**Migration Scope**:
- **New files**: ~30 (repositories + routes + tests)
- **Files to refactor**: ~20 (controllers, services, app.ts)
- **5 modules**: portfolio, holdings, market-data, (watchlist), (auth)

## Complexity Tracking

This refactoring introduces **controlled complexity** that significantly improves maintainability:

| Aspect | Before | After | Complexity Change |
|--------|--------|-------|-------------------|
| Layers | 3 (routes+controller, service, db) | 5 (routes, controller, service, repository, db) | **+2 layers** (justified) |
| Testability | Difficult (hardcoded Prisma) | Easy (mockable repositories) | **Reduced** |
| Code Duplication | Medium (Prisma queries repeated) | Low (centralized in repositories) | **Reduced** |
| Dependency Management | Implicit (hardcoded) | Explicit (DI) | **Increased** (beneficial) |
| File Count | ~20 files/module | ~30 files/module | **+50%** (justified) |
| Lines of Code | N/A | +~20% (abstraction layer) | **Increased** (justified) |

**Overall Complexity**: **INCREASED** but **JUSTIFIED** and **BENEFICIAL**

### Justification for Added Complexity

| Added Complexity | Why Needed | Simpler Alternative Rejected Because |
|-----------------|------------|-------------------------------------|
| Repository layer | Abstracts data access, enables testing | Direct Prisma in services: Not testable without DB |
| Separate routes files | Clear API structure, easier to modify | Routes in controllers: Coupling, hard to overview |
| Explicit DI | Testability, flexibility, maintainability | Hardcoded dependencies: Impossible to mock |
| Additional tests | Ensure quality at each layer | Fewer tests: Bugs slip through, hard to debug |

**Constitution Alignment**: This complexity aligns with **Principle III: Modular Architecture** which mandates "clear separation" and "single responsibility". The added structure is the *correct* implementation of these principles.

## Phase 0: Research Completed

See [research.md](./research.md) for detailed findings on:
- Repository pattern best practices
- Dependency injection patterns in Express
- Testing strategies for layered architecture
- Performance implications of abstraction layers

## Phase 1: Design Complete

See [data-model.md](./data-model.md) for:
- Module dependency graph
- Migration order (repositories first, then routes)
- Interface definitions for each layer

See [contracts/](./contracts/) for:
- Module structure contract
- Testing requirements
- Acceptance criteria
