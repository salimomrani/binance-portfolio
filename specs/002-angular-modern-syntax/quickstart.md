# Quick Start: Angular Modern Syntax Migration

**Feature**: 002-angular-modern-syntax
**Audience**: Developers implementing the migration
**Time to Read**: 10 minutes

## Overview

This guide provides practical examples and step-by-step instructions for migrating Angular components and services to modern Angular 17+ syntax patterns.

## Prerequisites

- ✅ Angular 17+ installed
- ✅ TypeScript 5.3+ configured
- ✅ ESLint configured
- ✅ Tests passing on `main` branch
- ✅ Branch `002-angular-modern-syntax` checked out

## Migration Checklist

For each file you migrate:

- [ ] Replace constructor DI with `inject()`
- [ ] Replace `@Input()` with `input<T>()`
- [ ] Replace `@Output()` with `output<T>()`
- [ ] Replace getters with `computed()`
- [ ] Replace `ngOnChanges` with `effect()` (if applicable)
- [ ] Update templates to call signals with `()`
- [ ] Update tests to use signal syntax
- [ ] Run tests: `npm test -- [component-name].spec.ts`
- [ ] Build check: `npm run build`
- [ ] Commit: `git commit -m "refactor: migrate [component-name] to modern syntax"`

## Pattern 1: Service Migration (inject)

### Before

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(
    private readonly http: HttpClient,
    private readonly config: ConfigService
  ) {}

  getData() {
    return this.http.get('/api/data');
  }
}
```

### After

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  getData() {
    return this.http.get('/api/data');
  }
}
```

### Steps

1. Import `inject` from `@angular/core`
2. Remove constructor parameters
3. Add `private readonly [name] = inject([Type])`for each dependency
4. Remove constructor if now empty
5. Test: `npm test -- data.service.spec.ts`

## Pattern 2: Component Inputs (@Input → input)

### Before

```typescript
import { Component, Input } from '@angular/core';

@Component({...})
export class UserCardComponent {
  @Input() userName: string = '';
  @Input() userId!: number;
  @Input() isActive: boolean = false;
}
```

### After

```typescript
import { Component, input } from '@angular/core';

@Component({...})
export class UserCardComponent {
  userName = input<string>('');
  userId = input.required<number>();
  isActive = input<boolean>(false);
}
```

### Template Changes

```html
<!-- Before -->
<div>{{ userName }}</div>

<!-- After -->
<div>{{ userName() }}</div>
```

### Steps

1. Import `input` from `@angular/core`
2. Replace `@Input() name: Type = default` with `name = input<Type>(default)`
3. Replace `@Input() name!: Type` with `name = input.required<Type>()`
4. Update template to call `name()` instead of `name`
5. Update component code to call `this.name()` instead of `this.name`
6. Test: Check template renders correctly

## Pattern 3: Component Outputs (@Output → output)

### Before

```typescript
import { Component, Output, EventEmitter } from '@angular/core';

@Component({...})
export class SearchComponent {
  @Output() searchChange = new EventEmitter<string>();
  @Output() submitted = new EventEmitter<void>();

  onSearch(term: string) {
    this.searchChange.emit(term);
  }
}
```

### After

```typescript
import { Component, output } from '@angular/core';

@Component({...})
export class SearchComponent {
  searchChange = output<string>();
  submitted = output<void>();

  onSearch(term: string) {
    this.searchChange.emit(term);
  }
}
```

### Steps

1. Import `output` from `@angular/core`
2. Replace `@Output() name = new EventEmitter<Type>()` with `name = output<Type>()`
3. Keep `.emit()` calls unchanged
4. Test: Verify parent receives events

## Pattern 4: Computed Values (getter → computed)

### Before

```typescript
import { Component, Input } from '@angular/core';

@Component({...})
export class PriceComponent {
  @Input() price: number = 0;
  @Input() quantity: number = 0;

  get total(): number {
    return this.price * this.quantity;
  }

  get formatted(): string {
    return `$${this.total.toFixed(2)}`;
  }
}
```

### After

```typescript
import { Component, input, computed } from '@angular/core';

@Component({...})
export class PriceComponent {
  price = input<number>(0);
  quantity = input<number>(0);

  total = computed(() => this.price() * this.quantity());

  formatted = computed(() => `$${this.total().toFixed(2)}`);
}
```

### Template Changes

```html
<!-- Before -->
<div>Total: {{ total }}</div>
<div>{{ formatted }}</div>

<!-- After -->
<div>Total: {{ total() }}</div>
<div>{{ formatted() }}</div>
```

### Steps

1. Import `computed` from `@angular/core`
2. Replace `get name(): Type { return expression; }` with `name = computed(() => expression)`
3. Update dependencies to call signals with `()`
4. Update template to call computed with `()`
5. Test: Verify computed updates when inputs change

## Pattern 5: Side Effects (ngOnChanges → effect)

### Before

```typescript
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({...})
export class LoggerComponent implements OnChanges {
  @Input() userId!: number;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId']) {
      console.log('User changed:', this.userId);
      this.loadUserData(this.userId);
    }
  }

  loadUserData(id: number) {
    // ...
  }
}
```

### After

```typescript
import { Component, input, effect } from '@angular/core';

@Component({...})
export class LoggerComponent {
  userId = input.required<number>();

  constructor() {
    effect(() => {
      console.log('User changed:', this.userId());
      this.loadUserData(this.userId());
    });
  }

  loadUserData(id: number) {
    // ...
  }
}
```

### Steps

1. Import `effect` from `@angular/core`
2. Create constructor if not exists
3. Add `effect(() => { ... })` with logic from `ngOnChanges`
4. Update to call signal inputs with `()`
5. Remove `OnChanges` interface and `ngOnChanges` method
6. Test: Verify effect runs when input changes

## Pattern 6: Complete Component Example

### Before

```typescript
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DataService } from './data.service';

@Component({
  selector: 'app-user-profile',
  template: `
    <div>{{ displayName }}</div>
    <div>{{ age }} years old</div>
    <button (click)="onSave()">Save</button>
  `
})
export class UserProfileComponent implements OnInit, OnChanges {
  @Input() userId!: number;
  @Input() firstName: string = '';
  @Input() lastName: string = '';
  @Output() saved = new EventEmitter<void>();

  age: number = 0;

  constructor(private readonly dataService: DataService) {}

  ngOnInit() {
    this.loadAge();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['userId']) {
      this.loadAge();
    }
  }

  get displayName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  loadAge() {
    this.dataService.getAge(this.userId).subscribe(age => {
      this.age = age;
    });
  }

  onSave() {
    this.saved.emit();
  }
}
```

### After

```typescript
import { Component, input, output, signal, computed, effect, inject } from '@angular/core';
import { DataService } from './data.service';

@Component({
  selector: 'app-user-profile',
  template: `
    <div>{{ displayName() }}</div>
    <div>{{ age() }} years old</div>
    <button (click)="onSave()">Save</button>
  `
})
export class UserProfileComponent {
  private readonly dataService = inject(DataService);

  // Inputs
  userId = input.required<number>();
  firstName = input<string>('');
  lastName = input<string>('');

  // Outputs
  saved = output<void>();

  // State
  age = signal<number>(0);

  // Computed
  displayName = computed(() => `${this.firstName()} ${this.lastName()}`);

  constructor() {
    // Effect - runs when userId changes
    effect(() => {
      this.loadAge();
    });
  }

  loadAge() {
    this.dataService.getAge(this.userId()).subscribe(age => {
      this.age.set(age);
    });
  }

  onSave() {
    this.saved.emit();
  }
}
```

### Key Changes

1. ✅ `inject()` replaces constructor DI
2. ✅ `input<T>()` replaces `@Input()`
3. ✅ `output<T>()` replaces `@Output()`
4. ✅ `signal<T>()` for component state
5. ✅ `computed()` replaces getter
6. ✅ `effect()` replaces `ngOnChanges`
7. ✅ Template calls all signals with `()`

## Testing Pattern Updates

### Before

```typescript
it('should display user name', () => {
  component.firstName = 'John';
  component.lastName = 'Doe';
  fixture.detectChanges();

  expect(component.displayName).toBe('John Doe');
});
```

### After

```typescript
it('should display user name', () => {
  fixture.componentRef.setInput('firstName', 'John');
  fixture.componentRef.setInput('lastName', 'Doe');
  fixture.detectChanges();

  expect(component.displayName()).toBe('John Doe');
});
```

## Common Pitfalls & Solutions

### Pitfall 1: Forgetting to call signals

```typescript
// ❌ WRONG
const value = this.myInput;
const computed = this.myComputed;

// ✅ CORRECT
const value = this.myInput();
const computed = this.myComputed();
```

### Pitfall 2: Mutating signals directly

```typescript
// ❌ WRONG
this.mySignal = newValue;

// ✅ CORRECT
this.mySignal.set(newValue);
// or
this.mySignal.update(old => old + 1);
```

### Pitfall 3: Side effects in computed

```typescript
// ❌ WRONG - side effect in computed
computed(() => {
  console.log('Computing...');  // Side effect!
  return this.value() * 2;
});

// ✅ CORRECT - pure computation
computed(() => this.value() * 2);

// Use effect for logging
effect(() => {
  console.log('Value changed:', this.value());
});
```

## Verification Commands

After each migration:

```bash
# 1. TypeScript compilation
npm run build

# 2. Run tests for that file
npm test -- [filename].spec.ts

# 3. Run linter
npm run lint

# 4. Visual check in browser
npm start
# Navigate to the component and test functionality
```

## Git Workflow

```bash
# Start migration
git checkout 002-angular-modern-syntax
git pull origin 002-angular-modern-syntax

# After migrating each layer (see data-model.md)
git add .
git commit -m "refactor: migrate Layer [X] to modern syntax

- Migrated [list of files]
- All tests passing
- No regressions"

# Push periodically
git push origin 002-angular-modern-syntax
```

## Need Help?

- 📖 Read `research.md` for detailed explanations
- 📊 Check `data-model.md` for migration order
- 🔗 [Angular Signals Docs](https://angular.dev/guide/signals)
- 🔗 [inject() API](https://angular.dev/api/core/inject)

## Next Steps

1. ✅ Read this guide
2. ✅ Start with Layer 1 services (see `data-model.md`)
3. ✅ Follow the checklist for each file
4. ✅ Test thoroughly after each layer
5. ✅ Proceed to next layer only when current layer is stable

Happy migrating! 🚀
