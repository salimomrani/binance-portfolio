# Migration Contract: Angular Modern Syntax

**Feature**: 002-angular-modern-syntax
**Type**: Refactoring Contract
**Acceptance Test**: All files migrated, all tests pass, zero regressions

## Contract Scope

This contract defines the exact scope and acceptance criteria for the Angular syntax modernization.

### Files In Scope

**Total Files**: ~130 (32 TypeScript files × ~4 files each: `.ts`, `.html`, `.scss`, `.spec.ts`)

**TypeScript Files to Migrate**: 32
- 13 Services
- 19 Components

### Files Out of Scope

- ❌ Backend code (`backend/`)
- ❌ Configuration files (`tsconfig.json`, `angular.json`)
- ❌ Build scripts
- ❌ Third-party libraries
- ❌ Node modules

## Acceptance Criteria

### Must Have ✅

1. **All Services Use `inject()`**
   - ✅ No constructor-based DI remains
   - ✅ All dependencies marked `readonly`
   - ✅ Service tests pass

2. **All Component Inputs Use `input<T>()`**
   - ✅ No `@Input()` decorators remain
   - ✅ Templates call inputs with `()`
   - ✅ Required inputs use `input.required<T>()`

3. **All Component Outputs Use `output<T>()`**
   - ✅ No `@Output()` decorators remain
   - ✅ No `EventEmitter` imports (except third-party)

4. **Computed Values Use `computed()`**
   - ✅ Getters replaced where appropriate
   - ✅ Derived state is automatic

5. **Side Effects Use `effect()`**
   - ✅ `ngOnChanges` replaced where appropriate
   - ✅ No unnecessary lifecycle hooks

6. **All Tests Pass**
   - ✅ Unit tests: 100% pass rate
   - ✅ Component tests: 100% pass rate
   - ✅ Integration tests: 100% pass rate
   - ✅ E2E tests: 100% pass rate

7. **Build Success**
   - ✅ TypeScript compilation: 0 errors
   - ✅ ESLint: 0 errors, 0 warnings
   - ✅ Build command succeeds
   - ✅ Bundle size ≤ 105% of original

8. **No Regressions**
   - ✅ All features work identically to before
   - ✅ No console errors
   - ✅ No visual differences

### Should Have 🎯

1. **Performance**
   - 🎯 Bundle size < 102% of original
   - 🎯 Render time ≤ original
   - 🎯 Change detection improvements visible

2. **Code Quality**
   - 🎯 Reduced lines of code
   - 🎯 Improved type inference
   - 🎯 Better IDE autocomplete

### Nice to Have 💡

1. **Documentation**
   - 💡 Migration guide committed
   - 💡 Before/after examples in PR
   - 💡 Performance metrics shared

2. **Tooling**
   - 💡 ESLint rules for signal syntax
   - 💡 Custom schematic for future migrations

## Test Scenarios

### Scenario 1: Service Injection
```typescript
// Given: A service with inject()
const service = TestBed.inject(DataService);

// When: Service is used
const result = service.getData();

// Then: Service works identically to before
expect(result).toBeDefined();
```

### Scenario 2: Signal Inputs
```typescript
// Given: A component with signal inputs
const component = fixture.componentInstance;

// When: Input is set
fixture.componentRef.setInput('value', 'test');
fixture.detectChanges();

// Then: Component receives and displays value
expect(component.value()).toBe('test');
expect(compiled.textContent).toContain('test');
```

### Scenario 3: Computed Updates
```typescript
// Given: A component with computed values
fixture.componentRef.setInput('price', 100);
fixture.componentRef.setInput('quantity', 2);

// When: Inputs change
fixture.detectChanges();

// Then: Computed updates automatically
expect(component.total()).toBe(200);
```

### Scenario 4: Effects Run
```typescript
// Given: A component with effects
const spy = jest.spyOn(component, 'loadData');

// When: Input changes
fixture.componentRef.setInput('userId', 123);

// Then: Effect runs automatically
expect(spy).toHaveBeenCalledWith(123);
```

### Scenario 5: Output Events
```typescript
// Given: A component with outputs
const emitted = jest.fn();
component.valueChange.subscribe(emitted);

// When: Component emits
component.onValueChange('new value');

// Then: Parent receives event
expect(emitted).toHaveBeenCalledWith('new value');
```

## Performance Benchmarks

### Bundle Size

| Metric | Before | After | Change | Status |
|--------|--------|-------|--------|--------|
| Total Bundle | TBD | TBD | ≤+5% | ✅/❌ |
| Main Chunk | TBD | TBD | ≤+5% | ✅/❌ |
| Lazy Chunks | TBD | TBD | ≤+5% | ✅/❌ |

### Runtime Performance

| Metric | Before | After | Change | Status |
|--------|--------|-------|--------|--------|
| Initial Render | TBD ms | TBD ms | ≤+0% | ✅/❌ |
| Re-render | TBD ms | TBD ms | ≤-10% | ✅/❌ |
| Change Detection | TBD ms | TBD ms | ≤-15% | ✅/❌ |

**How to Measure**:
```bash
# Before migration
npm run build -- --stats-json
analyze-bundle dist/stats.json > before-stats.txt

# After migration
npm run build -- --stats-json
analyze-bundle dist/stats.json > after-stats.txt

# Compare
diff before-stats.txt after-stats.txt
```

## Rollback Criteria

Migration will be rolled back if:

❌ Test pass rate < 95%
❌ Bundle size increase > 5%
❌ Critical bugs discovered
❌ Performance degradation > 10%
❌ Production deployment fails

## Sign-Off Checklist

Before considering migration complete:

- [ ] All 32 TypeScript files migrated
- [ ] All templates updated with `()`syntax
- [ ] All tests passing (unit, component, integration, E2E)
- [ ] TypeScript: 0 errors
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Build succeeds
- [ ] Bundle size checked (≤105%)
- [ ] Performance benchmarks collected
- [ ] Visual regression testing passed
- [ ] Manual testing of all features
- [ ] PR created with before/after examples
- [ ] Code review completed
- [ ] Documentation updated

## Success Metrics

### Quantitative

- ✅ 100% of files migrated
- ✅ 100% of tests passing
- ✅ 0 TypeScript/ESLint errors
- ✅ ≤5% bundle size increase

### Qualitative

- ✅ Code is more readable
- ✅ Developer experience improved
- ✅ Future Angular updates easier
- ✅ Team confident with new patterns

## Contract Fulfillment

This contract is fulfilled when:

1. All items in "Must Have" section are ✅
2. At least 80% of "Should Have" items are 🎯
3. Sign-off checklist is 100% complete
4. PR is approved and merged to `main`

**Contract Version**: 1.0
**Created**: 2025-11-18
**Owner**: Development Team
