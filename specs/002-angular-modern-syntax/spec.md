# Feature Specification: Angular Modern Syntax Update

**Feature ID**: 002-angular-modern-syntax
**Priority**: P2 - Technical Debt
**Status**: Planning
**Created**: 2025-11-18

## Overview

Update the Angular codebase to use modern Angular 17+ syntax patterns and best practices, replacing older patterns with their modern equivalents for better performance, developer experience, and future maintainability.

## Background

The current codebase was built with Angular 17 but still uses some older patterns. Angular 17+ introduced significant improvements including:
- `inject()` function for dependency injection (replacing constructor injection)
- Signal-based inputs with `input<T>()` (replacing `@Input` decorators)
- Signal-based outputs with `output<T>()` (replacing `@Output` decorators)
- `effect()` for reactive side effects (replacing ngOnChanges in many cases)
- `computed()` for derived state (replacing getters and manual calculations)

## Goals

### Primary Goal
Modernize the Angular codebase to use latest syntax patterns consistently across all components, services, and features.

### Success Criteria
- All components use `inject()` instead of constructor-based DI
- All component inputs use signal-based `input<T>()`
- All component outputs use signal-based `output<T>()`
- Derived state uses `computed()` where applicable
- Side effects use `effect()` where appropriate
- Code remains fully functional with no regression
- All tests pass after migration
- Build succeeds without warnings

## User Stories

### US1: Developer - Modern Dependency Injection
**As a** developer
**I want** to use `inject()` for dependency injection
**So that** code is more concise, testable, and follows Angular best practices

**Acceptance Criteria**:
- All services injected with `inject()` function
- No constructor-based injection remains
- Readonly fields for injected dependencies
- Code compiles without errors

### US2: Developer - Signal-Based Component API
**As a** developer
**I want** to use signal-based inputs and outputs
**So that** components are more reactive and performant

**Acceptance Criteria**:
- All `@Input()` replaced with `input<T>()`
- All `@Output()` replaced with `output<T>()`
- Templates updated to call signals with `()`
- Change detection strategy remains OnPush
- All component tests pass

### US3: Developer - Reactive Derived State
**As a** developer
**I want** to use `computed()` for derived values
**So that** calculations are automatic and memoized

**Acceptance Criteria**:
- Getters replaced with `computed()` where appropriate
- Manual calculations replaced with computed signals
- No unnecessary recalculations occur
- Performance maintained or improved

## Scope

### In Scope

**Frontend Components**:
- All components in `frontend/src/app/`
- All services in `frontend/src/app/`
- All guards, interceptors, and resolvers

**Patterns to Update**:
1. Constructor injection → `inject()`
2. `@Input()` → `input<T>()`
3. `@Output()` → `output<T>()`
4. Getters/manual calculations → `computed()`
5. `ngOnChanges` → `effect()` (where applicable)

### Out of Scope
- Backend code (Node.js/Express)
- Third-party libraries
- Angular framework itself
- Testing framework changes
- Build configuration changes

## Technical Requirements

### Code Quality
- All TypeScript strict mode checks must pass
- No ESLint warnings
- No console errors or warnings
- All existing tests must pass

### Performance
- No degradation in bundle size
- No increase in render time
- Change detection optimizations maintained

### Compatibility
- Angular 17+ compatibility maintained
- No breaking changes to component APIs
- Backward compatible with existing usage

## Migration Strategy

### Phase 1: Services
Update all services to use `inject()` instead of constructor injection.

### Phase 2: Core Components
Update core shared components (loading, error, notifications, etc.)

### Phase 3: Feature Components
Update feature-specific components by feature module:
- Portfolio components
- Holdings components
- Market trends components
- Watchlist components

### Phase 4: Validation
- Run full test suite
- Manual testing of all features
- Performance benchmarking

## Examples

### Before (Old Syntax)
```typescript
@Component({...})
export class MyComponent implements OnInit, OnChanges {
  @Input() value: string = '';
  @Output() valueChange = new EventEmitter<string>();

  constructor(
    private readonly service: MyService,
    private readonly http: HttpClient
  ) {}

  ngOnInit() {
    this.service.loadData();
  }

  get computedValue(): string {
    return this.value.toUpperCase();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value']) {
      console.log('Value changed:', this.value);
    }
  }
}
```

### After (Modern Syntax)
```typescript
@Component({...})
export class MyComponent {
  private readonly service = inject(MyService);
  private readonly http = inject(HttpClient);

  value = input<string>('');
  valueChange = output<string>();

  protected readonly computedValue = computed(() =>
    this.value().toUpperCase()
  );

  constructor() {
    this.service.loadData();

    effect(() => {
      console.log('Value changed:', this.value());
    });
  }
}
```

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing functionality | High | Medium | Comprehensive testing after each phase |
| Template syntax errors | Medium | Low | Update templates alongside components |
| Performance regression | High | Low | Performance benchmarking before/after |
| Test failures | Medium | Medium | Fix tests incrementally per component |

## Dependencies

- Angular 17+ already installed
- TypeScript 5.3+ configured
- Existing test suite functional

## Success Metrics

- 100% of components migrated to modern syntax
- 0 ESLint/TypeScript errors
- 100% test pass rate maintained
- 0 console warnings in browser
- ≤5% increase in bundle size (if any)

## Timeline Estimate

- Phase 1 (Services): 2-4 hours
- Phase 2 (Core Components): 2-3 hours
- Phase 3 (Feature Components): 4-6 hours
- Phase 4 (Validation): 1-2 hours
- **Total**: 9-15 hours

## References

- [Angular Signals Documentation](https://angular.dev/guide/signals)
- [Angular inject() Function](https://angular.dev/api/core/inject)
- [Signal-based Inputs](https://angular.dev/guide/components/inputs)
- [Signal-based Outputs](https://angular.dev/guide/components/outputs)
