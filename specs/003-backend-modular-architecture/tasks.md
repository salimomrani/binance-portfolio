# Implementation Tasks: Backend Modular Architecture

**Feature**: 003-backend-modular-architecture
**Branch**: `003-backend-modular-architecture`
**Generated**: 2025-11-18

## Overview

Refactor the backend to follow a consistent layered architecture (Routes → Controller → Service → Repository → Database) with proper separation of concerns, repository pattern for data access, and explicit dependency injection.

**Tech Stack**: TypeScript 5.3+, Node.js 20+, Express.js 4.18+, Prisma 5.0+, Zod 3.22+, Jest 29+

**Migration Strategy**: Module-by-module refactoring in dependency order to minimize risk and enable incremental validation.

---

## Phase 1: Setup & Infrastructure

**Goal**: Prepare test infrastructure and verify existing code structure

### Tasks

- [X] T001 Verify backend directory structure matches plan.md expectations
- [X] T002 Create test infrastructure directory `tests/` with `setup.ts` for test database configuration
- [X] T003 [P] Create test helper file `tests/helpers.ts` with common test utilities
- [X] T004 Verify all existing modules compile and current tests pass

**Exit Criteria**: Test infrastructure ready, baseline established, all existing tests passing

---

## Phase 2: Market-Data Module (US1, US2, US3, US4)

**Goal**: Refactor market-data module as pilot implementation with full layered architecture

**Why First**: No dependencies, simple CRUD, establishes patterns for other modules

### Repository Layer (US2)

- [X] T005 [US2] Create `backend/src/modules/market-data/market-data.repository.ts` with Prisma CRUD operations (findBySymbol, findBySymbols, findAll, upsert, upsertMany, deleteStale)
- [X] T006 [US2] Create `backend/src/modules/market-data/__tests__/market-data.repository.test.ts` with integration tests (90%+ coverage)

### Service Refactoring (US2)

- [X] T007 [US2] Refactor `backend/src/modules/market-data/market-data.service.ts` to use MarketDataRepository instead of direct Prisma calls
- [X] T008 [US2] Create `backend/src/modules/market-data/__tests__/market-data.service.test.ts` with unit tests using mocked repository (95%+ coverage)

### Controller Refactoring (US1)

- [X] T009 [US1] Refactor `backend/src/modules/market-data/market-data.controller.ts` to only handle HTTP concerns (req/res)
- [X] T010 [US1] Create `backend/src/modules/market-data/__tests__/market-data.controller.test.ts` with unit tests using mocked service (90%+ coverage)

### Routes Layer (US3)

- [X] T011 [US3] Create `backend/src/modules/market-data/market-data.routes.ts` with Express router factory function
- [X] T012 [US3] Create `backend/tests/integration/market-data.integration.test.ts` with E2E tests using Supertest (80%+ coverage)

**Exit Criteria**:
- All Prisma calls in repository only
- Service uses repository only
- Controller handles HTTP only
- Routes file defines endpoints
- All tests pass (≥85% coverage)
- API functionality unchanged

---

## Phase 3: Portfolio Module (US1, US2, US3, US4)

**Goal**: Apply layered architecture to portfolio module following market-data patterns

**Why Second**: Simple CRUD, depends only on shared services

### Repository Layer (US2)

- [X] T013 [US2] Create `backend/src/modules/portfolio/portfolio.repository.ts` with CRUD operations (findAll, findById, findByIdWithHoldings, findDefaultPortfolio, create, update, delete, setAsDefault, countByUser, exists)
- [X] T014 [US2] Create `backend/src/modules/portfolio/__tests__/portfolio.repository.test.ts` with integration tests (90%+ coverage)

### Service Refactoring (US2)

- [X] T015 [US2] Refactor `backend/src/modules/portfolio/portfolio.service.ts` to use PortfolioRepository and remove all Prisma calls
- [X] T016 [US2] Create `backend/src/modules/portfolio/__tests__/portfolio.service.test.ts` with unit tests using mocked repository (95%+ coverage)

### Controller Refactoring (US1)

- [X] T017 [US1] Refactor `backend/src/modules/portfolio/portfolio.controller.ts` to only handle HTTP concerns
- [X] T018 [US1] Create `backend/src/modules/portfolio/__tests__/portfolio.controller.test.ts` with unit tests using mocked service (90%+ coverage)

### Routes Layer (US3)

- [X] T019 [US3] Create `backend/src/modules/portfolio/portfolio.routes.ts` with Express router factory function
- [X] T020 [US3] Create `backend/tests/integration/portfolio.integration.test.ts` with E2E tests using Supertest (80%+ coverage)

**Exit Criteria**:
- Repository handles all Prisma queries
- Service uses repository + calculations
- Controller handles HTTP only
- Routes file defines endpoints
- All tests pass
- API unchanged

---

## Phase 4: Holdings + Transactions Module (US1, US2, US3, US4)

**Goal**: Refactor holdings module with two repositories (HoldingRepository, TransactionRepository)

**Why Third**: More complex - aggregate root with children, two repositories working together

### Repository Layer (US2)

- [X] T021 [US2] Create `backend/src/modules/holdings/holdings.repository.ts` with CRUD operations (findAll, findById, findBySymbol, findWithTransactions, create, update, delete, getTotalValue, getSymbols)
- [X] T022 [US2] Create `backend/src/modules/holdings/transaction.repository.ts` with CRUD operations (findAll, findById, findByDateRange, create, update, delete, getTotalInvested, getAveragePrice)
- [X] T023 [US2] Create `backend/src/modules/holdings/__tests__/holdings.repository.test.ts` with integration tests (90%+ coverage)
- [X] T024 [US2] Create `backend/src/modules/holdings/__tests__/transaction.repository.test.ts` with integration tests (90%+ coverage)

### Service Refactoring (US2)

- [X] T025 [US2] Refactor `backend/src/modules/holdings/holdings.service.ts` to use HoldingRepository and TransactionRepository
- [X] T026 [US2] Refactor `backend/src/modules/holdings/transaction.service.ts` to use TransactionRepository
- [ ] T027 [US2] Create `backend/src/modules/holdings/__tests__/holdings.service.test.ts` with unit tests using mocked repositories (95%+ coverage)
- [ ] T028 [US2] Create `backend/src/modules/holdings/__tests__/transaction.service.test.ts` with unit tests using mocked repository (95%+ coverage)

### Controller Refactoring (US1)

- [ ] T029 [US1] Refactor `backend/src/modules/holdings/holdings.controller.ts` to only handle HTTP concerns
- [ ] T030 [US1] Create `backend/src/modules/holdings/__tests__/holdings.controller.test.ts` with unit tests using mocked service (90%+ coverage)

### Routes Layer (US3)

- [ ] T031 [US3] Create `backend/src/modules/holdings/holdings.routes.ts` with Express router factory function
- [ ] T032 [US3] Create `backend/tests/integration/holdings.integration.test.ts` with E2E tests using Supertest (80%+ coverage)

**Exit Criteria**:
- Two repositories work together correctly
- Service coordinates repositories
- Transactions work correctly
- Average price calculations correct
- All tests pass
- API unchanged

---

## Phase 5: Dependency Injection & Route Mounting (US3, US4)

**Goal**: Update app.ts with explicit dependency injection and mount all refactored routes

**Why Fourth**: All modules must be refactored before wiring them together

### DI Container Setup

- [ ] T033 [US3] Refactor `backend/src/app.ts` to create explicit DI container with infrastructure layer (Prisma, cache, calculations)
- [ ] T034 [US3] Wire market-data module dependencies in app.ts (repository → service → controller → routes)
- [ ] T035 [US3] Wire portfolio module dependencies in app.ts (repository → service → controller → routes)
- [ ] T036 [US3] Wire holdings module dependencies in app.ts (repositories → services → controller → routes)
- [ ] T037 [US3] Mount all routes with proper paths (/api/market-data, /api/portfolios, /api/holdings)
- [ ] T038 [US4] Verify server starts successfully and all endpoints respond correctly

**Exit Criteria**:
- All dependencies injected explicitly
- No circular dependencies
- Server starts successfully
- All endpoints work
- No hardcoded dependencies remain

---

## Phase 6: Validation & Polish (US4)

**Goal**: Ensure comprehensive test coverage, performance, and code quality

### Testing & Coverage

- [ ] T039 [US4] Run full test suite and verify overall coverage ≥85%
- [ ] T040 [US4] Verify repository tests achieve 90%+ coverage
- [ ] T041 [US4] Verify service tests achieve 95%+ coverage
- [ ] T042 [US4] Verify controller tests achieve 90%+ coverage
- [ ] T043 [US4] Run integration tests and verify all CRUD operations work end-to-end

### Performance & Quality

- [ ] T044 [P] Performance benchmark: Verify p95 latency ≤50ms for simple queries
- [ ] T045 [P] Performance benchmark: Verify p95 latency ≤200ms for complex aggregations
- [ ] T046 [P] Verify zero API regressions - all existing functionality works identically
- [ ] T047 [P] Run TypeScript compiler in strict mode and fix any type errors

### Documentation

- [ ] T048 Update backend README.md with layered architecture documentation
- [ ] T049 Add JSDoc comments to all repository public methods
- [ ] T050 Verify all contracts from contracts/ directory are satisfied

**Exit Criteria**:
- Overall test coverage ≥85%
- All performance goals met
- Zero API regressions
- Documentation updated
- All TypeScript strict mode errors fixed

---

## Dependencies & Execution Order

### Module Dependencies

```
Setup (Phase 1)
    ↓
Market-Data (Phase 2) ← No dependencies, can run first
    ↓
Portfolio (Phase 3) ← Depends only on shared services
    ↓
Holdings (Phase 4) ← Depends on shared services
    ↓
DI Setup (Phase 5) ← Requires all modules refactored
    ↓
Validation (Phase 6) ← Requires complete implementation
```

### Parallel Execution Opportunities

**Within Market-Data Module**:
- T006 (repository tests) can run in parallel with T007 (service refactor) after T005 completes
- T008, T010 can run in parallel after their dependencies complete

**Within Portfolio Module**:
- T014 (repository tests) can run in parallel with T015 (service refactor) after T013 completes
- T016, T018 can run in parallel after their dependencies complete

**Within Holdings Module**:
- T023, T024 (repository tests) can run in parallel after T021, T022 complete
- T027, T028 can run in parallel after T025, T026 complete

**Phase 6 Validation**:
- T044, T045, T046, T047 (all marked [P]) can run in parallel

### Critical Path

```
T001 → T002 → T005 → T007 → T009 → T011 → T013 → T015 → T017 → T019 →
T021 → T025 → T029 → T031 → T033 → T037 → T038 → T039 → T048 → T050
```

**Estimated Total Time**: 23-31 hours (4-5 working days)

---

## Implementation Strategy

### TDD Approach

Follow Test-Driven Development for each layer:
1. **Repository Layer**: Write integration tests first, then implement repository
2. **Service Layer**: Write unit tests with mocked repository first, then refactor service
3. **Controller Layer**: Write unit tests with mocked service first, then refactor controller
4. **Routes Layer**: Write E2E tests first, then create routes file

### Incremental Validation

After each module phase (2, 3, 4):
- Run module-specific tests
- Manually test API endpoints with curl/Postman
- Verify no regressions in existing functionality
- Commit module changes as atomic unit

### MVP Scope

**Minimum Viable Product**: Phase 1-3 (Setup + Market-Data + Portfolio)

This provides:
- Established patterns for layered architecture
- Working examples of repository, service, controller, routes
- Test infrastructure and examples
- 2/3 modules refactored

**Recommended**: Complete all phases (1-6) for full architecture consistency

---

## Test Coverage Requirements

| Layer | Target Coverage | Test Type | Tools |
|-------|----------------|-----------|-------|
| Repository | 90%+ | Integration | Jest + PrismaClient + Test DB |
| Service | 95%+ | Unit | Jest + Mocked Repository |
| Controller | 90%+ | Unit | Jest + Mocked Service |
| Routes | 80%+ | E2E | Supertest + Real DB |
| **Overall** | **85%+** | Mixed | Jest + Supertest |

---

## File Path Reference

### New Files to Create (~30 files)

**Market-Data Module**:
- `backend/src/modules/market-data/market-data.repository.ts`
- `backend/src/modules/market-data/market-data.routes.ts`
- `backend/src/modules/market-data/__tests__/market-data.repository.test.ts`
- `backend/src/modules/market-data/__tests__/market-data.service.test.ts`
- `backend/src/modules/market-data/__tests__/market-data.controller.test.ts`
- `backend/tests/integration/market-data.integration.test.ts`

**Portfolio Module**:
- `backend/src/modules/portfolio/portfolio.repository.ts`
- `backend/src/modules/portfolio/portfolio.routes.ts`
- `backend/src/modules/portfolio/__tests__/portfolio.repository.test.ts`
- `backend/src/modules/portfolio/__tests__/portfolio.service.test.ts`
- `backend/src/modules/portfolio/__tests__/portfolio.controller.test.ts`
- `backend/tests/integration/portfolio.integration.test.ts`

**Holdings Module**:
- `backend/src/modules/holdings/holdings.repository.ts`
- `backend/src/modules/holdings/transaction.repository.ts`
- `backend/src/modules/holdings/holdings.routes.ts`
- `backend/src/modules/holdings/__tests__/holdings.repository.test.ts`
- `backend/src/modules/holdings/__tests__/transaction.repository.test.ts`
- `backend/src/modules/holdings/__tests__/holdings.service.test.ts`
- `backend/src/modules/holdings/__tests__/transaction.service.test.ts`
- `backend/src/modules/holdings/__tests__/holdings.controller.test.ts`
- `backend/tests/integration/holdings.integration.test.ts`

**Test Infrastructure**:
- `backend/tests/setup.ts`
- `backend/tests/helpers.ts`

### Files to Refactor (~8 files)

- `backend/src/modules/market-data/market-data.service.ts`
- `backend/src/modules/market-data/market-data.controller.ts`
- `backend/src/modules/portfolio/portfolio.service.ts`
- `backend/src/modules/portfolio/portfolio.controller.ts`
- `backend/src/modules/holdings/holdings.service.ts`
- `backend/src/modules/holdings/holdings.controller.ts`
- `backend/src/modules/holdings/transaction.service.ts`
- `backend/src/app.ts` (major refactor)

---

## Success Criteria

### Module-Level Success (Phases 2-4)

For each module (market-data, portfolio, holdings):
- [ ] All Prisma calls moved to repository layer
- [ ] Service uses repository only (no Prisma imports)
- [ ] Controller handles HTTP concerns only (no business logic)
- [ ] Routes file defines all endpoints with middleware
- [ ] Test coverage ≥85% for module
- [ ] All existing API endpoints work identically
- [ ] No performance degradation

### Architecture-Level Success (Phase 5)

- [ ] Explicit dependency injection in app.ts
- [ ] No hardcoded dependencies
- [ ] Clear dependency flow: Prisma → Repository → Service → Controller → Routes
- [ ] Server starts successfully
- [ ] All routes mounted correctly
- [ ] No circular dependencies

### Quality-Level Success (Phase 6)

- [ ] Overall test coverage ≥85%
- [ ] Repository tests: 90%+ coverage (integration with real DB)
- [ ] Service tests: 95%+ coverage (unit with mocked repository)
- [ ] Controller tests: 90%+ coverage (unit with mocked service)
- [ ] E2E tests: 80%+ coverage (Supertest with real DB)
- [ ] Performance: p95 ≤50ms (simple), p95 ≤200ms (complex)
- [ ] Zero API regressions
- [ ] Documentation updated

---

## Rollback Strategy

Each phase is a safe commit point:

- **Phase 2 Issues**: Revert market-data commits only
- **Phase 3 Issues**: Revert portfolio commits (market-data remains refactored)
- **Phase 4 Issues**: Revert holdings commits (market-data + portfolio remain refactored)
- **Phase 5 Issues**: Revert app.ts changes (all modules refactored but not wired)
- **Phase 6 Issues**: Fix specific failing tests or performance issues

All changes preserve API compatibility - no breaking changes allowed.

---

## Notes

- **No Database Schema Changes**: This is code refactoring only. Prisma schema remains unchanged.
- **No Breaking Changes**: All API endpoints must work identically before and after refactoring.
- **Shared Code Unchanged**: shared/middleware, shared/services, shared/types remain unchanged (already well-structured).
- **External Integrations Unchanged**: Binance and CoinGecko adapters remain in their current locations.
- **Validation Schemas Unchanged**: All Zod schemas (*.validation.ts) remain unchanged.

---

**Total Tasks**: 50
**Estimated Duration**: 23-31 hours (4-5 working days)
**Risk Level**: Low (incremental, tested, reversible)
**Breaking Changes**: Zero (backward compatible refactoring)
