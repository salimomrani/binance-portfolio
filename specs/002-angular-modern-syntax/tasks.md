# Implementation Tasks: Angular Modern Syntax Update

**Feature**: 002-angular-modern-syntax
**Branch**: `002-angular-modern-syntax`
**Generated**: 2025-11-18
**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md)

## Overview

This task list breaks down the Angular modern syntax migration into atomic, testable tasks following the dependency order defined in `data-model.md`. Each task migrates a specific file or layer and includes verification steps.

**Total Tasks**: 40 tasks across 6 phases
**Estimated Duration**: 9-15 hours

## Phase 1: Setup & Preparation

**Goal**: Prepare environment and establish baseline metrics

- [X] **T001** [P1] [SETUP] Create feature branch and verify Angular 17+ installed
  - `git checkout -b 002-angular-modern-syntax`
  - Verify `package.json` has Angular 17+
  - Run `npm install` to ensure dependencies installed
  - Verify build succeeds: `npm run build`

- [X] **T002** [P1] [SETUP] Document baseline metrics for comparison
  - Run `npm run build -- --stats-json`
  - Record bundle size from `dist/stats.json`
  - Run `npm test` and record pass rate
  - Document TypeScript/ESLint warnings count
  - Save metrics to `specs/002-angular-modern-syntax/baseline-metrics.md`

- [X] **T003** [P1] [SETUP] Create testing utilities for signal components
  - Create `frontend/src/app/testing/signal-test-helpers.ts`
  - Add helper: `setComponentInput(fixture, inputName, value)`
  - Add helper: `getComponentSignal(component, signalName)`
  - Add helper: `triggerComponentOutput(component, outputName)`
  - Add tests for test helpers themselves

## Phase 2: Services Migration (Layers 1-4) ✅ COMPLETE

**Goal**: Migrate all services to use `inject()` before touching components

**NOTE**: All services in the codebase were already using modern `inject()` syntax! This phase was already complete.

### Layer 1: Infrastructure Services (P2) ✅

- [X] **T004** [P2] [US1] Migrate `api.service.ts` to use `inject()`
  - File: `frontend/src/app/core/services/api.service.ts`
  - ✅ Already using `inject(HttpClient)` (line 14)

- [X] **T005** [P2] [US1] Migrate `error.service.ts` to use `inject()`
  - File: `frontend/src/app/core/services/error.service.ts`
  - ✅ Already using `inject(NotificationService)` (line 18)

- [X] **T006** [P2] [US1] Migrate `notification.service.ts` to use `inject()`
  - File: `frontend/src/app/core/services/notification.service.ts`
  - ✅ Already using `signal()` for reactive state (no dependencies to inject)

- [X] **T007** [P2] [US1] Migrate `price-update.service.ts` to use `inject()`
  - File: `frontend/src/app/core/services/price-update.service.ts`
  - ✅ Already using `inject(MarketDataApiService)` and `signal()` (lines 20, 25-28)

### Layer 2: Domain Services (P2) ✅

- [X] **T008** [P2] [US1] Migrate `portfolio-api.service.ts` to use `inject()`
  - File: `frontend/src/app/features/portfolio/services/portfolio-api.service.ts`
  - ✅ Already using `inject(ApiService)` (line 20)

- [X] **T009** [P2] [US1] Migrate `market-data-api.service.ts` to use `inject()`
  - File: `frontend/src/app/features/market-trends/services/market-data-api.service.ts`
  - ✅ Already using `inject(ApiService)` (line 22)

- [X] **T010** [P2] [US1] Migrate domain services - verify Layer 2 complete
  - ✅ All domain services verified to use `inject()`
  - ✅ holdings-api.service.ts also uses `inject(ApiService)`

### Layer 3: Facade Services (P3) ✅

- [X] **T011** [P3] [US1] Migrate `portfolio-facade.service.ts` to use `inject()`
  - File: `frontend/src/app/features/portfolio/services/portfolio-facade.service.ts`
  - ✅ Already using `inject(Store)` (line 18)

- [X] **T012** [P3] [US1] Migrate `holdings-facade.service.ts` to use `inject()`
  - **NOTE**: This facade service does not exist in the codebase (not needed)

- [X] **T013** [P3] [US1] Migrate `market-trends-facade.service.ts` to use `inject()`
  - **NOTE**: This facade service does not exist in the codebase (not needed)

### Layer 4: NgRx Effects (P4) ✅

- [X] **T014** [P4] [US1] Migrate `portfolio.effects.ts` to use `inject()`
  - File: `frontend/src/app/features/portfolio/store/portfolio.effects.ts`
  - ✅ Already using `inject(Actions)` and `inject(PortfolioApiService)` (lines 12-13)

- [X] **T015** [P4] [US1] Migrate `holdings.effects.ts` to use `inject()`
  - File: `frontend/src/app/features/holdings/store/holdings.effects.ts`
  - ✅ Already using `inject(Actions)`, `inject(HoldingsApiService)`, `inject(PortfolioApiService)` (lines 13-15)

- [X] **T016** [P4] [US1] Migrate `market-trends.effects.ts` to use `inject()`
  - File: `frontend/src/app/features/market-trends/store/market-trends.effects.ts`
  - ✅ Already using `inject(Actions)` and `inject(MarketDataApiService)` (lines 12-13)
  - ✅ Phase 2 complete - all services using modern syntax!

## Phase 3: Leaf Components (Layers 5-6)

**Goal**: Migrate atomic components with no child components

### Layer 5: Atomic Components (P5)

- [ ] **T017** [P5] [US2] Migrate `loading-spinner` component to signals
  - File: `frontend/src/app/shared/components/loading-spinner/`
  - Replace `inject()` for any services
  - No inputs/outputs - just verify no regressions
  - Run tests: `npm test -- loading-spinner.component.spec.ts`
  - Commit: `refactor(shared): migrate loading-spinner to modern syntax`

- [ ] **T018** [P5] [US2] Migrate `error-message` component to signals
  - File: `frontend/src/app/shared/components/error-message/`
  - Replace `@Input() message: string` with `message = input<string>('')`
  - Update template: `{{ message }}` → `{{ message() }}`
  - Update tests to use `setInput()`
  - Run tests: `npm test -- error-message.component.spec.ts`
  - Commit: `refactor(shared): migrate error-message to signals`

- [ ] **T019** [P5] [US2] [US3] Migrate `gain-loss-badge` component to signals
  - File: `frontend/src/app/shared/components/gain-loss-badge/`
  - Replace `@Input()` with `input<T>()` for value, percentage
  - Replace getters with `computed()` for color/icon logic
  - Update template to call signals with `()`
  - Update tests
  - Run tests: `npm test -- gain-loss-badge.component.spec.ts`
  - Commit: `refactor(shared): migrate gain-loss-badge to signals`

- [ ] **T020** [P5] [US2] [US3] Migrate `trend-indicator` component to signals
  - File: `frontend/src/app/shared/components/trend-indicator/`
  - Replace `@Input() trend`, `@Input() value` with `input<T>()`
  - Replace computed properties with `computed()`
  - Update template
  - Update tests
  - Run tests: `npm test -- trend-indicator.component.spec.ts`
  - Commit: `refactor(shared): migrate trend-indicator to signals`

- [ ] **T021** [P5] [US2] Migrate `timeframe-selector` component to signals
  - File: `frontend/src/app/shared/components/timeframe-selector/`
  - Replace `@Input() selected` with `input<string>()`
  - Replace `@Output() selectionChange` with `output<string>()`
  - Update template
  - Update tests
  - Run tests: `npm test -- timeframe-selector.component.spec.ts`
  - Commit: `refactor(shared): migrate timeframe-selector to signals`

- [ ] **T022** [P5] [US2] Migrate `column-settings` component to signals
  - File: `frontend/src/app/shared/components/column-settings/`
  - Replace `@Input() columns` with `input<Column[]>([])`
  - Replace `@Output() columnsChange` with `output<Column[]>()`
  - Update template
  - Update tests
  - Run tests: `npm test -- column-settings.component.spec.ts`
  - Commit: `refactor(shared): migrate column-settings to signals`

### Layer 6: Chart Components (P6)

- [ ] **T023** [P6] [US2] Migrate `pie-chart` component to signals
  - File: `frontend/src/app/features/portfolio/components/portfolio-charts/pie-chart/`
  - Replace `inject()` for services
  - Replace `@Input() data` with `input<AllocationData[]>([])`
  - Update chart rendering logic to use signals
  - Update template
  - Update tests
  - Run tests: `npm test -- pie-chart.component.spec.ts`
  - Commit: `refactor(portfolio): migrate pie-chart to signals`

- [ ] **T024** [P6] [US2] [US3] Migrate `line-chart` component to signals
  - File: `frontend/src/app/features/portfolio/components/portfolio-charts/line-chart/`
  - Replace `@Input()` with `input<T>()` for data, timeframe
  - Use `computed()` for chart configuration
  - Update template
  - Update tests
  - Run tests: `npm test -- line-chart.component.spec.ts`
  - Commit: `refactor(portfolio): migrate line-chart to signals`

- [ ] **T025** [P6] [US2] Migrate `view-toggle` component to signals
  - File: `frontend/src/app/features/portfolio/components/view-toggle/`
  - Replace `@Input() activeView` with `input<'table'|'chart'>()`
  - Replace `@Output() viewChange` with `output<'table'|'chart'>()`
  - Update template
  - Update tests
  - Run tests: `npm test -- view-toggle.component.spec.ts`
  - Commit: `refactor(portfolio): migrate view-toggle to signals`
  - Tag checkpoint: `git tag migration-layer-6`

## Phase 4: Composite Components (Layers 7-9)

**Goal**: Migrate components that use leaf components

### Layer 7: Data Display (P7)

- [ ] **T026** [P7] [US2] [US3] Migrate `portfolio-table` component to signals
  - File: `frontend/src/app/features/portfolio/components/portfolio-table/`
  - Replace `inject()` for services
  - Replace `@Input() holdings` with `input<Holding[]>([])`
  - Use `computed()` for sorted/filtered data
  - Update template (already uses child components with signals)
  - Update tests
  - Run tests: `npm test -- portfolio-table.component.spec.ts`
  - Commit: `refactor(portfolio): migrate portfolio-table to signals`

- [ ] **T027** [P7] [US2] [US3] Migrate `portfolio-summary` component to signals
  - File: `frontend/src/app/features/portfolio/components/portfolio-summary/`
  - Replace `@Input() portfolio`, `@Input() lastUpdated` with `input<T>()`
  - Use `computed()` for summary calculations
  - Update template
  - Update tests
  - Run tests: `npm test -- portfolio-summary.component.spec.ts`
  - Commit: `refactor(portfolio): migrate portfolio-summary to signals`

- [ ] **T028** [P7] [US2] [US3] Migrate `portfolio-stats` component to signals
  - File: `frontend/src/app/features/portfolio/components/portfolio-stats/`
  - Replace `@Input() stats` with `input<PortfolioStats>()`
  - Use `computed()` for derived stats
  - Update template
  - Update tests
  - Run tests: `npm test -- portfolio-stats.component.spec.ts`
  - Commit: `refactor(portfolio): migrate portfolio-stats to signals`

### Layer 8: Dialog Components (P8)

- [ ] **T029** [P8] [US2] Migrate `add-holding-dialog` component to signals
  - File: `frontend/src/app/features/holdings/components/add-holding-dialog/`
  - Replace `inject()` for services
  - Replace `@Input() isOpen` with `input<boolean>(false)`
  - Replace `@Output() close`, `@Output() save` with `output<void>()`
  - Update template
  - Update tests
  - Run tests: `npm test -- add-holding-dialog.component.spec.ts`
  - Commit: `refactor(holdings): migrate add-holding-dialog to signals`

- [ ] **T030** [P8] [US2] Migrate `add-transaction-dialog` component to signals
  - File: `frontend/src/app/features/holdings/components/add-transaction-dialog/`
  - Replace `inject()` for services
  - Replace `@Input() isOpen`, `@Input() holdingId` with `input<T>()`
  - Replace `@Output()` with `output<T>()`
  - Update template
  - Update tests
  - Run tests: `npm test -- add-transaction-dialog.component.spec.ts`
  - Commit: `refactor(holdings): migrate add-transaction-dialog to signals`

### Layer 9: Detail Components (P9)

- [ ] **T031** [P9] [US2] [US3] Migrate `holding-detail` component to signals
  - File: `frontend/src/app/features/holdings/components/holding-detail/`
  - Replace `inject()` for facade services
  - Replace `@Input() holdingId` with `input.required<string>()`
  - Use `computed()` for derived data
  - Use `effect()` to load data when holdingId changes
  - Update template
  - Update tests
  - Run tests: `npm test -- holding-detail.component.spec.ts`
  - Commit: `refactor(holdings): migrate holding-detail to signals`

- [ ] **T032** [P9] [US2] [US3] Migrate `crypto-detail` component to signals
  - File: `frontend/src/app/features/market-trends/components/crypto-detail/`
  - Replace `inject()` for services
  - Replace `@Input() symbol` with `input.required<string>()`
  - Use `effect()` to load data when symbol changes
  - Update template
  - Update tests
  - Run tests: `npm test -- crypto-detail.component.spec.ts`
  - Commit: `refactor(market-trends): migrate crypto-detail to signals`

- [ ] **T033** [P9] [US2] Migrate `market-overview` component to signals
  - File: `frontend/src/app/features/market-trends/components/market-overview/`
  - Replace `inject()` for services
  - Replace inputs/outputs with signals
  - Update template
  - Update tests
  - Run tests: `npm test -- market-overview.component.spec.ts`
  - Commit: `refactor(market-trends): migrate market-overview to signals`
  - Tag checkpoint: `git tag migration-layer-9`

## Phase 5: Container & Root (Layers 10-11)

**Goal**: Migrate top-level container components

- [ ] **T034** [P10] [US1] [US2] [US3] Migrate `portfolio-dashboard` component to signals
  - File: `frontend/src/app/features/portfolio/components/portfolio-dashboard/`
  - Replace `inject()` for facade services (PortfolioFacade, Store, Router)
  - Convert any inputs/outputs to signals
  - Use `computed()` for view model transformations
  - Use `effect()` for data loading on init
  - Update template (child components already use signals)
  - Update tests
  - Run tests: `npm test -- portfolio-dashboard.component.spec.ts`
  - Commit: `refactor(portfolio): migrate portfolio-dashboard to signals`

- [ ] **T035** [P11] [US1] Migrate `app.component.ts` to use `inject()`
  - File: `frontend/src/app/app.component.ts`
  - Replace constructor DI with `inject(Router, Store)`
  - Verify routing still works
  - Run tests: `npm test -- app.component.spec.ts`
  - Commit: `refactor(app): migrate app.component to inject()`
  - Tag checkpoint: `git tag migration-complete`

## Phase 6: Validation & Cleanup

**Goal**: Verify migration success and document results

- [ ] **T036** [P1] [VERIFY] Run full test suite and fix any failures
  - Run: `npm test`
  - Ensure 100% pass rate (same as baseline)
  - Fix any broken tests
  - Document any expected test changes
  - Commit: `test: fix tests for signal syntax`

- [ ] **T037** [P1] [VERIFY] Analyze bundle size changes
  - Run: `npm run build -- --stats-json`
  - Compare bundle size to baseline (T002)
  - Verify ≤5% increase (if any)
  - Document results in `specs/002-angular-modern-syntax/metrics-comparison.md`

- [ ] **T038** [P1] [VERIFY] Performance benchmarking
  - Start app: `npm start`
  - Use Chrome DevTools Performance tab
  - Record metrics for key user flows:
    - Portfolio dashboard load time
    - Table sorting/filtering
    - Chart rendering
  - Compare to baseline
  - Verify no regression
  - Document results

- [ ] **T039** [P1] [VERIFY] Visual regression testing
  - Start app: `npm start`
  - Manually test all features:
    - Portfolio dashboard (table view, chart view)
    - Add holding dialog
    - Add transaction dialog
    - Market trends page
    - Crypto detail page
  - Verify UI identical to before migration
  - Document any visual differences

- [ ] **T040** [P1] [DOCS] Update documentation
  - Update `CLAUDE.md` with modern syntax guidelines
  - Add examples of signal-based components
  - Add testing examples for signals
  - Update `README.md` if needed
  - Commit: `docs: add modern Angular syntax guidelines`
  - Push branch: `git push origin 002-angular-modern-syntax`

## Success Criteria

Migration is complete when:

- ✅ All 40 tasks completed
- ✅ All services use `inject()` (no constructor DI)
- ✅ All components use signal-based inputs/outputs
- ✅ Computed values use `computed()`
- ✅ Side effects use `effect()` where appropriate
- ✅ All tests pass (100% pass rate)
- ✅ TypeScript compilation succeeds with 0 errors
- ✅ ESLint passes with 0 warnings
- ✅ Bundle size ≤105% of baseline
- ✅ Visual regression: UI identical to pre-migration
- ✅ Performance: No degradation in key metrics

## Rollback Plan

If migration fails:

1. Identify failing layer (e.g., Layer 7)
2. Reset to previous checkpoint: `git reset --hard migration-layer-6`
3. Fix issues in isolated feature branch
4. Re-run tests
5. Proceed when stable

## Notes

- **Order matters**: Follow dependency layers strictly (services → leaf → composite → container)
- **Test after each task**: Never proceed if tests fail
- **Commit frequently**: Each task = 1 commit for easy rollback
- **Tag checkpoints**: After completing each layer
- **Don't batch**: Migrate one file at a time, verify, commit
- **Template updates**: Always update templates to call signals with `()`
- **Test updates**: Use `fixture.componentRef.setInput()` for signal inputs

## References

- [spec.md](./spec.md) - Feature specification
- [plan.md](./plan.md) - Implementation plan
- [data-model.md](./data-model.md) - Dependency graph
- [quickstart.md](./quickstart.md) - Migration patterns
- [research.md](./research.md) - Angular 17+ best practices
