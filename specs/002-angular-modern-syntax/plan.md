# Implementation Plan: Angular Modern Syntax Update

**Branch**: `002-angular-modern-syntax` | **Date**: 2025-11-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-angular-modern-syntax/spec.md`

## Summary

Modernize the Angular codebase to use Angular 17+ best practices including `inject()` for dependency injection, signal-based `input<T>()` and `output<T>()` for component APIs, `computed()` for derived state, and `effect()` for reactive side effects. This technical debt cleanup will improve code consistency, reduce boilerplate, and align with Angular's modern reactive patterns.

## Technical Context

**Language/Version**: TypeScript 5.3+, Angular 17+
**Primary Dependencies**: @angular/core 17+, RxJS 7+, @ngrx/store 18+
**Storage**: PostgreSQL (via backend), Browser LocalStorage (frontend state)
**Testing**: Jest 29+ for unit/component tests, Cypress for E2E
**Target Platform**: Web (Chrome, Firefox, Safari, Edge - modern browsers)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: No bundle size increase >5%, maintain 60fps UI rendering
**Constraints**: Zero regression - all existing functionality must work identically
**Scale/Scope**: 22 components, ~15 services, ~50 files to update

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Security-First
- **Status**: PASS
- **Justification**: Syntax updates do not affect security model. All security patterns (env vars, API key handling, input validation) remain unchanged.

### ✅ Type Safety & Data Validation
- **Status**: PASS
- **Justification**: TypeScript strict mode maintained. Signal-based APIs are fully typed. Migration actually improves type safety by making reactive dependencies explicit.

### ✅ Modular Architecture
- **Status**: PASS
- **Justification**: No architectural changes. Module boundaries and separation of concerns remain identical.

### ✅ API Integration Reliability
- **Status**: PASS
- **Justification**: No changes to API integration layer. Retry logic, caching, error handling unchanged.

### ✅ Testing Strategy
- **Status**: PASS
- **Justification**: All existing tests must pass post-migration. Test structure unchanged, only test syntax updated where needed.

### ✅ Performance & Real-Time Updates
- **Status**: PASS with IMPROVEMENT
- **Justification**: Signal-based components may improve change detection performance. OnPush strategy maintained.

### ✅ Observability & User Experience
- **Status**: PASS
- **Justification**: No impact on logging, loading states, or error boundaries. UX identical.

## Project Structure

### Documentation (this feature)

```text
specs/002-angular-modern-syntax/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Angular 17+ best practices research
├── data-model.md        # Component dependency graph
├── quickstart.md        # Migration guide for developers
└── tasks.md             # Detailed task breakdown (/speckit.tasks command)
```

### Source Code (repository root)

```text
backend/
└── [No changes - backend uses Express/Node patterns, not Angular]

frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/                # 🔄 Migrate to inject()
│   │   │   │   ├── api.service.ts
│   │   │   │   ├── error.service.ts
│   │   │   │   ├── notification.service.ts
│   │   │   │   └── price-update.service.ts
│   │   │   └── interceptors/            # 🔄 Migrate to inject()
│   │   │       ├── error.interceptor.ts
│   │   │       └── loading.interceptor.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── components/              # 🔄 Migrate to signals
│   │   │   │   ├── error-message/
│   │   │   │   ├── loading-spinner/
│   │   │   │   ├── gain-loss-badge/
│   │   │   │   ├── trend-indicator/
│   │   │   │   ├── timeframe-selector/
│   │   │   │   └── column-settings/
│   │   │   └── models/                  # ✅ No changes (types only)
│   │   │
│   │   ├── features/
│   │   │   ├── portfolio/
│   │   │   │   ├── components/          # 🔄 Migrate to signals + inject()
│   │   │   │   │   ├── portfolio-dashboard/
│   │   │   │   │   ├── portfolio-table/
│   │   │   │   │   ├── portfolio-summary/
│   │   │   │   │   ├── portfolio-stats/
│   │   │   │   │   ├── portfolio-charts/
│   │   │   │   │   │   ├── pie-chart/
│   │   │   │   │   │   └── line-chart/
│   │   │   │   │   └── view-toggle/
│   │   │   │   ├── services/            # 🔄 Migrate to inject()
│   │   │   │   │   ├── portfolio-api.service.ts
│   │   │   │   │   └── portfolio-facade.service.ts
│   │   │   │   └── store/               # 🔄 Migrate effects to inject()
│   │   │   │       └── portfolio.effects.ts
│   │   │   │
│   │   │   ├── holdings/
│   │   │   │   ├── components/          # 🔄 Migrate to signals + inject()
│   │   │   │   │   ├── add-holding-dialog/
│   │   │   │   │   ├── add-transaction-dialog/
│   │   │   │   │   └── holding-detail/
│   │   │   │   ├── services/            # 🔄 Migrate to inject()
│   │   │   │   └── store/               # 🔄 Migrate effects to inject()
│   │   │   │
│   │   │   ├── market-trends/
│   │   │   │   ├── components/          # 🔄 Migrate to signals + inject()
│   │   │   │   │   ├── crypto-detail/
│   │   │   │   │   └── market-overview/
│   │   │   │   ├── services/            # 🔄 Migrate to inject()
│   │   │   │   └── store/               # 🔄 Migrate effects to inject()
│   │   │   │
│   │   │   └── watchlist/               # 🔄 Migrate to signals + inject()
│   │   │
│   │   └── app.component.ts             # 🔄 Migrate to inject()
│   │
│   └── tests/                           # 🔄 Update test syntax where needed
│       ├── component/
│       ├── integration/
│       └── unit/
```

**Structure Decision**: Web application structure with frontend/backend separation. Migration targets frontend Angular code only. Backend Node.js/Express code uses different patterns and is out of scope.

**Legend**:
- 🔄 = Files requiring migration
- ✅ = No changes needed

**Migration Scope**:
- ~22 components (`.component.ts`)
- ~15 services (`.service.ts`)
- ~3 effects files (`.effects.ts`)
- ~2 interceptors (`.interceptor.ts`)
- ~50 total files estimated

## Complexity Tracking

This migration introduces NO new complexity. It's a pure refactoring with no violations of the constitution. All patterns are officially recommended by Angular and simplify the code.

| Aspect | Before | After | Complexity Change |
|--------|--------|-------|-------------------|
| DI Pattern | Constructor injection | `inject()` function | **Reduced** (less boilerplate) |
| Component Inputs | `@Input()` decorators | `input<T>()` signals | **Reduced** (type-safe, reactive) |
| Component Outputs | `@Output()` decorators | `output<T>()` signals | **Reduced** (consistent API) |
| Derived State | Getters / manual | `computed()` signals | **Reduced** (automatic updates) |
| Side Effects | `ngOnChanges` lifecycle | `effect()` function | **Reduced** (declarative) |

**Overall Complexity**: **REDUCED** - Modern patterns are more concise and maintainable.
