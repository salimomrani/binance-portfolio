# Research: Angular Modern Syntax Patterns

**Feature**: 002-angular-modern-syntax
**Date**: 2025-11-18
**Researcher**: AI Planning Agent

## Executive Summary

Angular 17+ introduced significant improvements to the framework's developer experience through signals and functional composition patterns. This research documents the best practices, migration patterns, and considerations for updating our codebase to modern Angular syntax.

## Key Decisions

### Decision 1: Use `inject()` for Dependency Injection

**Chosen**: Migrate all constructor-based DI to `inject()` function

**Rationale**:
- **Official Recommendation**: Angular team recommends `inject()` as the modern approach
- **Cleaner Code**: Eliminates constructor parameter lists
- **Better Testability**: Easier to mock dependencies in tests
- **Composability**: Enables functional composition patterns
- **Type Safety**: Full TypeScript inference support

**Alternatives Considered**:
1. Keep constructor injection (rejected - old pattern, more verbose)
2. Mix both patterns (rejected - inconsistency)

**Example**:
```typescript
// Before
constructor(
  private readonly http: HttpClient,
  private readonly store: Store
) {}

// After
private readonly http = inject(HttpClient);
private readonly store = inject(Store);
```

**References**:
- [Angular inject() Documentation](https://angular.dev/api/core/inject)
- [Angular DI Guide](https://angular.dev/guide/di)

---

### Decision 2: Signal-Based Component Inputs

**Chosen**: Replace all `@Input()` decorators with `input<T>()` signals

**Rationale**:
- **Reactive by Default**: Inputs are signals, enabling reactive patterns
- **Type Safety**: Better type inference than decorators
- **Performance**: Enables fine-grained reactivity
- **Composability**: Works seamlessly with `computed()` and `effect()`
- **Modern Pattern**: Aligns with Angular's future direction

**Alternatives Considered**:
1. Keep `@Input()` decorators (rejected - not reactive)
2. Use `signal()` + `@Input()` setter (rejected - unnecessary complexity)

**Example**:
```typescript
// Before
@Input() value: string = '';
@Input() required: boolean = false;

// After
value = input<string>('');
required = input<boolean>(false);

// In template: {{ value() }}
// In code: const v = this.value();
```

**Migration Notes**:
- Templates must call signals with `()`
- Two-way binding changes: `[(value)]` → manual `[value]` + `(valueChange)`
- Required inputs: `input.required<T>()`

**References**:
- [Signal Inputs Guide](https://angular.dev/guide/components/inputs)
- [Angular Signals Documentation](https://angular.dev/guide/signals)

---

### Decision 3: Signal-Based Component Outputs

**Chosen**: Replace all `@Output()` EventEmitters with `output<T>()` signals

**Rationale**:
- **Consistency**: Matches signal-based inputs pattern
- **Simpler API**: No need for EventEmitter import
- **Type Safe**: Better type inference for emitted values
- **Performance**: Optimized for signal-based change detection

**Alternatives Considered**:
1. Keep `@Output()` + EventEmitter (rejected - inconsistent with inputs)
2. Use Subject/Observable (rejected - overcomplicates simple events)

**Example**:
```typescript
// Before
@Output() valueChange = new EventEmitter<string>();

// After
valueChange = output<string>();

// Usage remains same: this.valueChange.emit(newValue)
```

**References**:
- [Signal Outputs Guide](https://angular.dev/guide/components/outputs)

---

### Decision 4: `computed()` for Derived State

**Chosen**: Replace getters and manual calculations with `computed()` signals

**Rationale**:
- **Automatic Updates**: Recalculates when dependencies change
- **Memoization**: Caches result until dependencies change
- **Performance**: Avoids unnecessary recalculations
- **Declarative**: Clearly shows data dependencies

**Alternatives Considered**:
1. Getters (rejected - recalculate on every access)
2. Manual signal updates (rejected - error-prone)

**Example**:
```typescript
// Before
get totalValue(): number {
  return this.items.reduce((sum, item) => sum + item.value, 0);
}

// After
totalValue = computed(() =>
  this.items().reduce((sum, item) => sum + item.value, 0)
);
```

**Best Practices**:
- Use for any derived value that depends on signals
- Keep computations pure (no side effects)
- Complex computations → extract to utility functions

**References**:
- [Computed Signals Guide](https://angular.dev/guide/signals#computed-signals)

---

### Decision 5: `effect()` for Side Effects

**Chosen**: Replace `ngOnChanges` with `effect()` where appropriate

**Rationale**:
- **Reactive**: Automatically tracks signal dependencies
- **Simpler**: No need to check which input changed
- **Declarative**: Side effects are explicit
- **Lifecycle Independent**: Runs whenever dependencies change

**Alternatives Considered**:
1. Keep `ngOnChanges` (rejected - verbose, manual tracking)
2. Use RxJS operators (rejected - overkill for simple cases)

**Example**:
```typescript
// Before
ngOnChanges(changes: SimpleChanges) {
  if (changes['userId']) {
    this.loadUserData(this.userId);
  }
}

// After
constructor() {
  effect(() => {
    this.loadUserData(this.userId());
  });
}
```

**When to Use**:
- ✅ Logging signal changes
- ✅ Syncing with external APIs
- ✅ Local storage updates
- ❌ DOM manipulation (use lifecycle hooks)
- ❌ Template rendering (use computed)

**References**:
- [Effect Function Guide](https://angular.dev/guide/signals#effects)

---

## Migration Strategy

### Phase-by-Phase Approach

**Phase 1: Core Services** (Low Risk)
- Migrate all `.service.ts` files to `inject()`
- No component changes yet
- Easy to test and verify

**Phase 2: Shared Components** (Medium Risk)
- Migrate simple components first
- Test each component thoroughly
- Update component tests

**Phase 3: Feature Components** (Higher Risk)
- Migrate by feature module
- Comprehensive testing after each module
- User acceptance testing

**Phase 4: Effects & Guards** (Low Risk)
- Migrate NgRx effects to `inject()`
- Update route guards
- Integration testing

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking changes | Incremental migration + comprehensive testing |
| Template syntax errors | ESLint rules for signal syntax |
| Test failures | Update tests alongside components |
| Performance regression | Before/after benchmarks |

---

## Tools & Automation

### ESLint Rules

**Recommendation**: Use Angular ESLint plugin rules

```json
{
  "@angular-eslint/prefer-standalone": "error",
  "@angular-eslint/prefer-on-push-component-change-detection": "warn"
}
```

### TypeScript Compiler

**Configuration**: Maintain strict mode

```json
{
  "strict": true,
  "strictPropertyInitialization": true,
  "noImplicitReturns": true
}
```

### Testing Framework

**No Changes**: Jest continues to work with signal-based components

```typescript
// Test example
it('should update computed value when input changes', () => {
  fixture.componentRef.setInput('value', 'new');
  fixture.detectChanges();
  expect(component.computedValue()).toBe('NEW');
});
```

---

## Performance Considerations

### Bundle Size Impact

**Expected**: ≤1% increase (signal runtime overhead)

**Measurement**: Before/after comparison using `ng build --stats-json`

### Runtime Performance

**Expected**: 5-15% improvement in change detection

**Why**: Signal-based change detection is more fine-grained than Zone.js

**Benchmark**: Use Chrome DevTools Performance tab

---

## Best Practices Summary

### DO ✅

- Use `inject()` for all dependency injection
- Use `input<T>()` for all component inputs
- Use `output<T>()` for all component outputs
- Use `computed()` for derived values
- Use `effect()` for side effects
- Call signals with `()` in templates and code
- Mark injected fields as `readonly`
- Use `input.required<T>()` for required inputs

### DON'T ❌

- Mix old and new patterns in same file
- Forget to call signals with `()`
- Use `effect()` for DOM manipulation
- Put complex logic inside signal getters
- Mutate signal values (use `.set()` or `.update()`)

---

## References & Resources

### Official Documentation
- [Angular Signals](https://angular.dev/guide/signals)
- [inject() Function](https://angular.dev/api/core/inject)
- [Signal Inputs](https://angular.dev/guide/components/inputs)
- [Signal Outputs](https://angular.dev/guide/components/outputs)

### Community Resources
- [Angular Blog: Introducing Signals](https://blog.angular.io/angular-v17-is-now-available-94d81aec9fc6)
- [YouTube: Angular Signals Deep Dive](https://www.youtube.com/watch?v=oqYQG7Q7h9Y)

### Migration Guides
- [Official Migration Guide](https://angular.dev/guide/signals#migrating-to-signals)
- [Community Migration Patterns](https://github.com/angular/angular/discussions/49685)

---

## Conclusion

The migration to modern Angular syntax is a **low-risk, high-value** refactoring that will:

✅ Improve code consistency
✅ Reduce boilerplate
✅ Enable better performance
✅ Align with Angular's future direction
✅ Improve developer experience

**Recommendation**: PROCEED with migration using phased approach documented above.
