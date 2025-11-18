# Data Model: Component Dependency Graph

**Feature**: 002-angular-modern-syntax
**Purpose**: Document component dependencies to determine safe migration order

## Overview

This document maps the dependency graph of Angular components and services to ensure migration proceeds in the correct order. Leaf components (no dependencies) should be migrated first, followed by their consumers.

## Dependency Layers

### Layer 0: Core Services (No Angular Dependencies)

These services have no component dependencies and can be migrated first.

```text
HttpClient, Store, Router (Angular framework - no changes)
```

### Layer 1: Infrastructure Services

Services that depend only on framework services.

| Service | Depends On | Migration Priority |
|---------|------------|-------------------|
| `api.service.ts` | HttpClient | **P1** (First) |
| `error.service.ts` | - | **P1** (First) |
| `notification.service.ts` | - | **P1** (First) |
| `logger.service.ts` | - | **P1** (First) |

### Layer 2: Domain Services

Services that depend on infrastructure services.

| Service | Depends On | Migration Priority |
|---------|------------|-------------------|
| `portfolio-api.service.ts` | ApiService | **P2** |
| `market-data-api.service.ts` | ApiService | **P2** |
| `price-update.service.ts` | ApiService, Store | **P2** |

### Layer 3: Facade Services

Services that abstract store complexity.

| Service | Depends On | Migration Priority |
|---------|------------|-------------------|
| `portfolio-facade.service.ts` | Store, PortfolioApi | **P3** |
| `holdings-facade.service.ts` | Store | **P3** |
| `market-trends-facade.service.ts` | Store | **P3** |

### Layer 4: NgRx Effects

Effects that coordinate service calls and state updates.

| Effect | Depends On | Migration Priority |
|--------|------------|-------------------|
| `portfolio.effects.ts` | PortfolioApi, Actions | **P4** |
| `holdings.effects.ts` | HoldingsApi, Actions | **P4** |
| `market-trends.effects.ts` | MarketDataApi, Actions | **P4** |

### Layer 5: Leaf Components (No Child Components)

Smallest, self-contained components.

| Component | Inputs | Outputs | Depends On | Priority |
|-----------|--------|---------|-----------|----------|
| `loading-spinner` | - | - | - | **P5** |
| `error-message` | `message: string` | - | - | **P5** |
| `gain-loss-badge` | `value: number`, `percentage: number` | - | - | **P5** |
| `trend-indicator` | `trend: 'up'\|'down'\|'neutral'`, `value: number` | - | - | **P5** |
| `timeframe-selector` | `selected: string` | `selectionChange` | - | **P5** |
| `column-settings` | `columns: Column[]` | `columnsChange` | - | **P5** |

### Layer 6: Chart Components

Visualization components with minimal dependencies.

| Component | Inputs | Outputs | Depends On | Priority |
|-----------|--------|---------|-----------|----------|
| `pie-chart` | `data: AllocationData[]` | - | Chart.js | **P6** |
| `line-chart` | `data: TimeSeriesData[]`, `timeframe: string` | - | Chart.js | **P6** |
| `view-toggle` | `activeView: 'table'\|'chart'` | `viewChange` | - | **P6** |

### Layer 7: Data Display Components

Components that display domain data.

| Component | Inputs | Outputs | Child Components | Priority |
|-----------|--------|---------|------------------|----------|
| `portfolio-table` | `holdings: Holding[]` | - | `gain-loss-badge`, `trend-indicator` | **P7** |
| `portfolio-summary` | `portfolio: Portfolio`, `lastUpdated: Date` | - | `gain-loss-badge` | **P7** |
| `portfolio-stats` | `stats: PortfolioStats` | - | `gain-loss-badge` | **P7** |

### Layer 8: Dialog Components

Modal/dialog components for user input.

| Component | Inputs | Outputs | Depends On | Priority |
|-----------|--------|---------|-----------|----------|
| `add-holding-dialog` | `isOpen: boolean` | `close`, `save` | Reactive Forms | **P8** |
| `add-transaction-dialog` | `isOpen: boolean`, `holdingId: string` | `close`, `save` | Reactive Forms | **P8** |

### Layer 9: Feature Detail Components

Components showing detailed views.

| Component | Inputs | Outputs | Child Components | Priority |
|-----------|--------|---------|------------------|----------|
| `holding-detail` | `holdingId: string` | - | `add-transaction-dialog`, `gain-loss-badge` | **P9** |
| `crypto-detail` | `symbol: string` | - | `line-chart`, `trend-indicator` | **P9** |
| `market-overview` | - | - | `trend-indicator` | **P9** |

### Layer 10: Container Components

Top-level feature containers.

| Component | Inputs | Outputs | Child Components | Priority |
|-----------|--------|---------|------------------|----------|
| `portfolio-dashboard` | - | - | `portfolio-summary`, `portfolio-table`, `portfolio-stats`, `pie-chart`, `add-holding-dialog` | **P10** |

### Layer 11: Root Component

Application root.

| Component | Depends On | Priority |
|-----------|-----------|----------|
| `app.component.ts` | Router, Store | **P11** (Last) |

## Migration Order Matrix

### Phase 1: Services (No UI Impact)
```
P1: Infrastructure Services (4 files)
  ├─ api.service.ts
  ├─ error.service.ts
  ├─ notification.service.ts
  └─ logger.service.ts

P2: Domain Services (3 files)
  ├─ portfolio-api.service.ts
  ├─ market-data-api.service.ts
  └─ price-update.service.ts

P3: Facade Services (3 files)
  ├─ portfolio-facade.service.ts
  ├─ holdings-facade.service.ts
  └─ market-trends-facade.service.ts

P4: NgRx Effects (3 files)
  ├─ portfolio.effects.ts
  ├─ holdings.effects.ts
  └─ market-trends.effects.ts
```

### Phase 2: Leaf Components (Independent)
```
P5: Atomic Components (6 files)
  ├─ loading-spinner
  ├─ error-message
  ├─ gain-loss-badge
  ├─ trend-indicator
  ├─ timeframe-selector
  └─ column-settings

P6: Chart Components (3 files)
  ├─ pie-chart
  ├─ line-chart
  └─ view-toggle
```

### Phase 3: Composite Components (Depend on Leaf)
```
P7: Data Display (3 files)
  ├─ portfolio-table
  ├─ portfolio-summary
  └─ portfolio-stats

P8: Dialog Components (2 files)
  ├─ add-holding-dialog
  └─ add-transaction-dialog

P9: Detail Components (3 files)
  ├─ holding-detail
  ├─ crypto-detail
  └─ market-overview
```

### Phase 4: Container Components (Top Level)
```
P10: Feature Containers (1 file)
  └─ portfolio-dashboard

P11: Root (1 file)
  └─ app.component.ts
```

## Dependency Validation Rules

### Safe Migration Criteria

A component is safe to migrate when:

1. ✅ All its service dependencies are migrated
2. ✅ All its child components are migrated (if any)
3. ✅ All its imported utilities are compatible
4. ✅ Tests exist and pass for the component

### Breaking Change Detection

Watch for:

- ❌ Parent components calling child signal inputs without `()`
- ❌ Templates accessing signals without `()`
- ❌ Tests using old syntax (`.componentInstance.value` vs `.componentInstance.value()`)
- ❌ Two-way binding on signal inputs (needs manual split)

## File Count Summary

| Layer | Component Count | Service Count | Total Files |
|-------|----------------|---------------|-------------|
| Services | - | 13 | 13 |
| Leaf Components | 9 | - | 9 |
| Composite Components | 8 | - | 8 |
| Container Components | 2 | - | 2 |
| **TOTAL** | **19** | **13** | **32** |

**Note**: Each component typically has 3-4 files (`.ts`, `.html`, `.scss`, `.spec.ts`), so actual file count is ~130 files.

## Testing Strategy Per Layer

### Layer 1-4 (Services & Effects)
- Unit tests must pass
- No UI testing needed
- Mock store/http as usual

### Layer 5-6 (Leaf Components)
- Component tests verify signal syntax
- No integration tests needed
- Snapshot tests update

### Layer 7-9 (Composite Components)
- Component tests verify inputs/outputs
- Integration tests with child components
- User interaction tests

### Layer 10-11 (Containers & Root)
- E2E tests verify full flows
- Integration tests with routes
- Store integration tests

## Rollback Strategy

If migration fails at any layer:

1. **Revert files** in that layer to previous commit
2. **Keep lower layers** (already migrated successfully)
3. **Fix issues** before proceeding
4. **Re-run tests** to verify stability

### Git Strategy

```bash
# Create checkpoint after each successful layer
git commit -m "feat: migrate Layer X to modern syntax"
git tag migration-layer-X

# If rollback needed
git reset --hard migration-layer-$(($X-1))
```

## Completion Criteria

Migration is complete when:

✅ All 32 files migrated
✅ All tests pass (unit, component, integration, E2E)
✅ No TypeScript errors
✅ No ESLint warnings
✅ Bundle size ≤105% of original
✅ Visual regression tests pass
✅ Performance benchmarks acceptable
