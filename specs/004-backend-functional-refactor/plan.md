# Implementation Plan: Backend Functional Refactor

**Branch**: `004-backend-functional-refactor` | **Date**: 2025-11-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-backend-functional-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the backend codebase from class-based architecture to functional programming patterns using plain functions with explicit dependency injection. Convert all Controllers, Services, and Repositories to pure functions with dependencies passed as parameters. Use named exports (`export const`, `export function`) throughout, with default exports only for route definitions. This simplifies composition, improves testability, and reduces boilerplate while maintaining 100% feature parity and ≥85% test coverage.

## Technical Context

**Language/Version**: TypeScript 5.3+
**Primary Dependencies**: Express.js 4.18+, Prisma 5.9+, Zod 3.22+, Jest 29+
**Storage**: PostgreSQL 15+ (via Prisma ORM)
**Testing**: Jest 29+ with ts-jest, Supertest for E2E
**Target Platform**: Node.js 20+ on Linux server
**Project Type**: Web (backend only - this refactor does not touch frontend)
**Performance Goals**: Maintain current API response times (no degradation)
**Constraints**: Zero breaking changes to API contracts, ≥85% test coverage maintained
**Scale/Scope**: 2 modules (market-data, portfolio), ~20 files to refactor, ~1500 LOC affected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Security-First ✅
- **PASS**: Refactoring does not affect API key storage or security practices
- **PASS**: Environment variables and secure vault usage unchanged
- **PASS**: Backend-only communication pattern preserved
- **PASS**: Rate limiting unchanged
- **PASS**: Input validation (Zod) unchanged

### Type Safety & Data Validation ✅
- **PASS**: TypeScript strict mode remains enabled
- **PASS**: Zod validation schemas unchanged
- **ENHANCED**: Function signatures make dependencies more explicit (improves type safety)
- **PASS**: Decimal.js for monetary values unchanged
- **PASS**: All interfaces/types preserved

### Modular Architecture ✅
- **PASS**: Separation of concerns maintained (Routes → Controller → Service → Repository)
- **ENHANCED**: Single responsibility principle strengthened by pure functions
- **PASS**: API integration layer isolation unchanged
- **PASS**: Service layer structure preserved

### API Integration Reliability ✅
- **PASS**: Binance API handling unchanged
- **PASS**: Retry logic and exponential backoff preserved
- **PASS**: Caching strategy unchanged
- **PASS**: Error handling preserved
- **PASS**: Mock API responses for testing unchanged

### Testing Strategy ✅
- **PASS**: Unit tests for business logic maintained
- **ENHANCED**: Function testing simpler (no class mocking needed)
- **PASS**: Integration tests unchanged
- **TARGET**: Maintain or exceed current coverage (≥85% overall)

### Performance & Real-Time Updates ✅
- **PASS**: WebSocket and polling unchanged
- **NEUTRAL**: Functions have zero performance overhead vs classes
- **PASS**: All optimizations preserved

### Observability & User Experience ✅
- **PASS**: Winston logging unchanged
- **PASS**: Error boundaries and handling preserved
- **PASS**: User feedback mechanisms unchanged

**GATE STATUS**: ✅ PASSED - No violations, several enhancements to type safety and testability

### Post-Design Re-evaluation

After completing Phase 1 design (research, data-model, contracts, quickstart):

**GATE STATUS**: ✅ PASSED - Design confirms no constitutional violations

- ✅ **Security-First**: No impact on security practices
- ✅ **Type Safety**: Enhanced through explicit type definitions (types separate from implementations)
- ✅ **Modular Architecture**: Maintained and simplified (better composition)
- ✅ **API Integration Reliability**: Unchanged
- ✅ **Testing Strategy**: Simplified (no mocking frameworks needed)
- ✅ **Performance**: Zero overhead vs classes
- ✅ **Observability**: Unchanged

**Enhancements**:
1. Type safety improved through explicit contracts (types before implementations)
2. Testing simplified (plain object mocks vs complex mocking frameworks)
3. Composition improved (functions compose naturally)
4. Tree-shaking enabled (named exports allow dead code elimination)

**Conclusion**: Functional refactor aligns with and enhances constitutional principles. Proceed to implementation.

## Project Structure

### Documentation (this feature)

```text
specs/004-backend-functional-refactor/
├── spec.md              # Feature specification (already created)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - functional DI patterns research
├── data-model.md        # Phase 1 output - refactored type definitions
├── quickstart.md        # Phase 1 output - migration guide for developers
└── contracts/           # Phase 1 output - functional module contracts
    ├── functional-patterns.md      # Standard patterns for functions
    ├── migration-guide.md          # Step-by-step refactoring guide
    └── testing-patterns.md         # Testing functional code
```

### Source Code (repository root)

This is a backend-only refactor. The structure remains the same; only the implementation patterns change.

```text
backend/
├── src/
│   ├── config/                    # Configuration (unchanged)
│   ├── shared/                    # Shared utilities
│   │   ├── middleware/            # Express middleware (unchanged)
│   │   ├── services/              # Shared services (refactor to functions)
│   │   ├── types/                 # TypeScript types (unchanged)
│   │   └── utils/                 # Utility functions (unchanged)
│   ├── modules/                   # Feature modules (REFACTOR ALL)
│   │   ├── market-data/           # Market data module
│   │   │   ├── market-data.routes.ts         # Router factory (refactor)
│   │   │   ├── market-data.controller.ts     # Handler functions (refactor)
│   │   │   ├── market-data.service.ts        # Business logic functions (refactor)
│   │   │   ├── market-data.repository.ts     # Data access functions (refactor)
│   │   │   ├── market-data.types.ts          # Types (unchanged)
│   │   │   ├── market-data.cache.ts          # Cache functions (refactor if class)
│   │   │   ├── binance.adapter.ts            # Adapter functions (refactor if class)
│   │   │   ├── coingecko.adapter.ts          # Adapter functions (refactor if class)
│   │   │   └── __tests__/                    # Tests (refactor assertions)
│   │   ├── portfolio/             # Portfolio module
│   │   │   ├── portfolio.routes.ts           # Router factory (refactor)
│   │   │   ├── portfolio.controller.ts       # Handler functions (refactor)
│   │   │   ├── portfolio.service.ts          # Business logic functions (refactor)
│   │   │   ├── portfolio.repository.ts       # Data access functions (refactor)
│   │   │   ├── binance-sync.service.ts       # Sync functions (refactor)
│   │   │   ├── portfolio.types.ts            # Types (unchanged)
│   │   │   ├── portfolio.validation.ts       # Zod schemas (unchanged)
│   │   │   └── __tests__/                    # Tests (refactor assertions)
│   │   └── holdings/              # Holdings module (if exists, refactor same pattern)
│   ├── app.ts                     # DI container - MAJOR REFACTOR (function composition)
│   └── server.ts                  # Server startup (minimal changes)
└── tests/                         # Integration tests (update to use functions)

frontend/                          # Frontend (UNCHANGED - Angular remains class-based)
├── src/
│   └── app/
└── tests/
```

**Structure Decision**: Web application (backend + frontend). This refactor **only affects backend** code. We maintain the layered architecture (Routes → Controller → Service → Repository) but implement each layer using functions instead of classes. The frontend remains unchanged as Angular components naturally use class-based patterns.

**Files to Refactor** (estimated 22 files):
- `backend/src/modules/market-data/` (7 files)
- `backend/src/modules/portfolio/` (8 files)
- `backend/src/modules/holdings/` (if exists, ~5 files)
- `backend/src/shared/services/` (2-3 files if class-based)
- `backend/src/app.ts` (1 file - DI composition)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**N/A** - No constitution violations. This refactor aligns with and enhances constitutional principles (type safety, modularity, testability).
