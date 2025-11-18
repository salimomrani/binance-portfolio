/**
 * Tests for Signal Test Helpers
 */

import { Component, input, output, signal, computed } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  setComponentInput,
  setComponentInputs,
  getComponentSignal,
  getWritableSignal,
  captureComponentOutput,
  spyOnComponentOutput,
  waitForSignalStability,
  createMockSignal,
  assertSignalValue,
  assertSignalValueEventually,
} from './signal-test-helpers';

// Test component using modern signal-based APIs
@Component({
  selector: 'app-test-signal-component',
  template: `
    <div class="user-name">{{ userName() }}</div>
    <div class="user-id">{{ userId() }}</div>
    <div class="full-name">{{ fullName() }}</div>
    <div class="counter">{{ counter() }}</div>
    <button (click)="emitValue()">Emit</button>
    <button (click)="incrementCounter()">Increment</button>
  `,
  standalone: true,
})
class TestSignalComponent {
  // Signal inputs
  userName = input<string>('');
  userId = input.required<number>();
  firstName = input<string>('');
  lastName = input<string>('');

  // Signal outputs
  valueChange = output<string>();
  userClick = output<number>();

  // Writable signal (internal state)
  counter = signal<number>(0);

  // Computed signal
  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

  emitValue() {
    this.valueChange.emit('test-value');
  }

  incrementCounter() {
    this.counter.update((c) => c + 1);
  }

  emitUserId() {
    this.userClick.emit(this.userId());
  }
}

describe('Signal Test Helpers', () => {
  let fixture: ComponentFixture<TestSignalComponent>;
  let component: TestSignalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestSignalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestSignalComponent);
    component = fixture.componentInstance;
  });

  describe('setComponentInput', () => {
    it('should set a single input value', () => {
      setComponentInput(fixture, 'userName', 'John Doe');
      fixture.detectChanges();

      expect(component.userName()).toBe('John Doe');
    });

    it('should set a required input value', () => {
      setComponentInput(fixture, 'userId', 123);
      fixture.detectChanges();

      expect(component.userId()).toBe(123);
    });

    it('should update input value when called multiple times', () => {
      setComponentInput(fixture, 'userName', 'John');
      setComponentInput(fixture, 'userName', 'Jane');
      fixture.detectChanges();

      expect(component.userName()).toBe('Jane');
    });
  });

  describe('setComponentInputs', () => {
    it('should set multiple inputs at once', () => {
      setComponentInputs(fixture, {
        userName: 'John Doe',
        userId: 456,
        firstName: 'John',
        lastName: 'Doe',
      });
      fixture.detectChanges();

      expect(component.userName()).toBe('John Doe');
      expect(component.userId()).toBe(456);
      expect(component.firstName()).toBe('John');
      expect(component.lastName()).toBe('Doe');
    });

    it('should handle empty object', () => {
      setComponentInputs(fixture, {});
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe('getComponentSignal', () => {
    it('should get a signal input', () => {
      setComponentInput(fixture, 'userName', 'Alice');
      const signal = getComponentSignal<string>(component, 'userName');

      expect(signal()).toBe('Alice');
    });

    it('should get a computed signal', () => {
      setComponentInputs(fixture, {
        firstName: 'John',
        lastName: 'Doe',
      });
      const fullNameSignal = getComponentSignal<string>(component, 'fullName');

      expect(fullNameSignal()).toBe('John Doe');
    });

    it('should throw error for non-signal property', () => {
      expect(() => {
        getComponentSignal(component, 'nonExistentProperty');
      }).toThrowError(/is not a signal/);
    });
  });

  describe('getWritableSignal', () => {
    it('should get a writable signal', () => {
      const counterSignal = getWritableSignal<number>(component, 'counter');

      expect(counterSignal()).toBe(0);
      counterSignal.set(5);
      expect(counterSignal()).toBe(5);
    });

    it('should support update method', () => {
      const counterSignal = getWritableSignal<number>(component, 'counter');

      counterSignal.update((c) => c + 10);
      expect(counterSignal()).toBe(10);
    });

    it('should throw error for readonly/computed signals', () => {
      expect(() => {
        getWritableSignal(component, 'fullName');
      }).toThrowError(/is not writable/);
    });
  });

  describe('captureComponentOutput', () => {
    it('should capture emitted value from output', async () => {
      setComponentInput(fixture, 'userId', 123);
      fixture.detectChanges();

      const emittedValue = await captureComponentOutput<string>(
        fixture,
        'valueChange',
        () => {
          component.emitValue();
        }
      );

      expect(emittedValue).toBe('test-value');
    });

    it('should timeout if output does not emit', async () => {
      try {
        await captureComponentOutput<string>(fixture, 'valueChange', () => {
          // Do nothing - output won't emit
        });
        fail('Should have thrown timeout error');
      } catch (error: any) {
        expect(error.message).toContain('did not emit within timeout period');
      }
    });

    it('should throw error for non-output property', async () => {
      try {
        await captureComponentOutput(fixture, 'notAnOutput', () => {});
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).toContain('is not an output');
      }
    });
  });

  describe('spyOnComponentOutput', () => {
    it('should create a spy on component output', () => {
      setComponentInput(fixture, 'userId', 123);
      const spy = spyOnComponentOutput(fixture, 'valueChange');

      component.emitValue();

      expect(spy).toHaveBeenCalledWith('test-value');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should throw error for non-output property', () => {
      expect(() => {
        spyOnComponentOutput(fixture, 'notAnOutput');
      }).toThrowError(/is not an output/);
    });
  });

  describe('waitForSignalStability', () => {
    it('should resolve when signal stabilizes', async () => {
      const testSignal = signal(0);
      let value = 0;

      // Simulate rapid changes that eventually stabilize
      const interval = setInterval(() => {
        value++;
        testSignal.set(value);
        if (value === 5) {
          clearInterval(interval);
        }
      }, 5);

      const finalValue = await waitForSignalStability(testSignal, 200);
      expect(finalValue).toBe(5);
    });

    it('should timeout if signal keeps changing', async () => {
      const testSignal = signal(0);

      // Continuous changes
      const interval = setInterval(() => {
        testSignal.update((v) => v + 1);
      }, 5);

      try {
        await waitForSignalStability(testSignal, 100);
        fail('Should have thrown timeout error');
      } catch (error: any) {
        expect(error.message).toContain('did not stabilize');
      } finally {
        clearInterval(interval);
      }
    });
  });

  describe('createMockSignal', () => {
    it('should create a mock writable signal', () => {
      const mockSignal = createMockSignal('initial');

      expect(mockSignal()).toBe('initial');
    });

    it('should support set method', () => {
      const mockSignal = createMockSignal(10);

      mockSignal.set(20);
      expect(mockSignal()).toBe(20);
    });

    it('should support update method', () => {
      const mockSignal = createMockSignal(5);

      mockSignal.update((v) => v * 2);
      expect(mockSignal()).toBe(10);
    });
  });

  describe('assertSignalValue', () => {
    it('should pass when signal has expected value', () => {
      setComponentInput(fixture, 'userName', 'Test User');
      const signal = getComponentSignal<string>(component, 'userName');

      assertSignalValue(signal, 'Test User');
      // Should not throw
    });

    it('should fail when signal has different value', () => {
      setComponentInput(fixture, 'userName', 'Test User');
      const signal = getComponentSignal<string>(component, 'userName');

      expect(() => {
        assertSignalValue(signal, 'Different User');
      }).toThrow();
    });

    it('should support custom error message', () => {
      const signal = signal(42);
      try {
        assertSignalValue(signal, 100, 'Custom error message');
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('Custom error message');
      }
    });
  });

  describe('assertSignalValueEventually', () => {
    it('should pass when signal eventually has expected value', async () => {
      const testSignal = signal(0);

      // Simulate async change
      setTimeout(() => testSignal.set(42), 50);

      await assertSignalValueEventually(testSignal, 42, 200);
      // Should not throw
    });

    it('should fail when signal never reaches expected value', async () => {
      const testSignal = signal(0);

      try {
        await assertSignalValueEventually(testSignal, 999, 100);
        fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toContain('did not reach expected value');
        expect(error.message).toContain('999');
      }
    });

    it('should resolve immediately if value is already correct', async () => {
      const testSignal = signal(42);

      await assertSignalValueEventually(testSignal, 42, 1000);
      // Should resolve quickly
    });
  });
});
