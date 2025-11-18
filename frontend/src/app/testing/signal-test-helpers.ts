/**
 * Testing Utilities for Signal-Based Components
 *
 * This file provides helper functions for testing Angular components
 * that use modern signal-based APIs (input(), output(), computed(), effect()).
 *
 * @see https://angular.dev/guide/signals
 * @see https://angular.dev/guide/testing/components-scenarios
 */

import { ComponentFixture } from '@angular/core/testing';
import { ComponentRef, Signal, WritableSignal } from '@angular/core';

/**
 * Sets an input value on a component using the signal-based input API.
 *
 * @example
 * ```typescript
 * const fixture = TestBed.createComponent(MyComponent);
 * setComponentInput(fixture, 'userName', 'John Doe');
 * fixture.detectChanges();
 * ```
 *
 * @param fixture - The ComponentFixture containing the component
 * @param inputName - The name of the input property
 * @param value - The value to set
 */
export function setComponentInput<T>(
  fixture: ComponentFixture<any>,
  inputName: string,
  value: T
): void {
  fixture.componentRef.setInput(inputName, value);
}

/**
 * Sets multiple inputs on a component at once.
 *
 * @example
 * ```typescript
 * setComponentInputs(fixture, {
 *   userName: 'John Doe',
 *   userId: 123,
 *   isActive: true
 * });
 * ```
 *
 * @param fixture - The ComponentFixture containing the component
 * @param inputs - An object with input names as keys and values to set
 */
export function setComponentInputs<T extends Record<string, any>>(
  fixture: ComponentFixture<any>,
  inputs: T
): void {
  Object.entries(inputs).forEach(([key, value]) => {
    fixture.componentRef.setInput(key, value);
  });
}

/**
 * Gets the current value of a signal input from a component.
 *
 * @example
 * ```typescript
 * const component = fixture.componentInstance;
 * const userName = getComponentSignal(component, 'userName');
 * expect(userName()).toBe('John Doe');
 * ```
 *
 * @param component - The component instance
 * @param signalName - The name of the signal property
 * @returns The signal (which can be called to get the value)
 */
export function getComponentSignal<T>(
  component: any,
  signalName: string
): Signal<T> {
  const signal = component[signalName];
  if (!signal || typeof signal !== 'function') {
    throw new Error(
      `Property "${signalName}" is not a signal on component ${component.constructor.name}`
    );
  }
  return signal as Signal<T>;
}

/**
 * Gets the current value of a writable signal from a component.
 *
 * @example
 * ```typescript
 * const count = getWritableSignal(component, 'count');
 * count.set(5);
 * expect(count()).toBe(5);
 * ```
 *
 * @param component - The component instance
 * @param signalName - The name of the writable signal property
 * @returns The writable signal
 */
export function getWritableSignal<T>(
  component: any,
  signalName: string
): WritableSignal<T> {
  const signal = component[signalName];
  if (!signal || typeof signal !== 'function') {
    throw new Error(
      `Property "${signalName}" is not a signal on component ${component.constructor.name}`
    );
  }
  if (!('set' in signal) || !('update' in signal)) {
    throw new Error(
      `Signal "${signalName}" is not writable (readonly signal or computed)`
    );
  }
  return signal as WritableSignal<T>;
}

/**
 * Subscribes to a component output and returns the emitted value when triggered.
 *
 * @example
 * ```typescript
 * const emittedValue = await captureComponentOutput(
 *   fixture,
 *   'searchChange',
 *   () => {
 *     const button = fixture.nativeElement.querySelector('button');
 *     button.click();
 *   }
 * );
 * expect(emittedValue).toBe('search term');
 * ```
 *
 * @param fixture - The ComponentFixture containing the component
 * @param outputName - The name of the output property
 * @param trigger - A function that triggers the output emission
 * @returns A promise that resolves with the emitted value
 */
export function captureComponentOutput<T>(
  fixture: ComponentFixture<any>,
  outputName: string,
  trigger: () => void | Promise<void>
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const component = fixture.componentInstance;
    const output = component[outputName];

    if (!output || typeof output.subscribe !== 'function') {
      reject(
        new Error(
          `Property "${outputName}" is not an output on component ${component.constructor.name}`
        )
      );
      return;
    }

    const subscription = output.subscribe((value: T) => {
      subscription.unsubscribe();
      resolve(value);
    });

    setTimeout(() => {
      subscription.unsubscribe();
      reject(
        new Error(`Output "${outputName}" did not emit within timeout period`)
      );
    }, 5000);

    Promise.resolve(trigger()).catch(reject);
  });
}

/**
 * Spies on a component output and returns a jasmine spy.
 *
 * @example
 * ```typescript
 * const spy = spyOnComponentOutput(fixture, 'valueChange');
 * component.onSave();
 * expect(spy).toHaveBeenCalledWith('new value');
 * ```
 *
 * @param fixture - The ComponentFixture containing the component
 * @param outputName - The name of the output property
 * @returns A jasmine spy that can be used for assertions
 */
export function spyOnComponentOutput(
  fixture: ComponentFixture<any>,
  outputName: string
): jasmine.Spy {
  const component = fixture.componentInstance;
  const output = component[outputName];

  if (!output || typeof output.subscribe !== 'function') {
    throw new Error(
      `Property "${outputName}" is not an output on component ${component.constructor.name}`
    );
  }

  const spy = jasmine.createSpy(outputName);
  output.subscribe(spy);
  return spy;
}

/**
 * Waits for a computed signal to stabilize (stop changing).
 *
 * @example
 * ```typescript
 * const computed = component.totalPrice;
 * await waitForSignalStability(computed, 100);
 * expect(computed()).toBe(42);
 * ```
 *
 * @param signal - The computed signal to wait for
 * @param timeout - Maximum time to wait in milliseconds (default: 1000)
 * @returns A promise that resolves when the signal stabilizes
 */
export function waitForSignalStability<T>(
  signal: Signal<T>,
  timeout: number = 1000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let lastValue = signal();
    let stableCount = 0;
    const requiredStableCount = 3; // Must be stable for 3 checks

    const checkInterval = setInterval(() => {
      const currentValue = signal();
      if (currentValue === lastValue) {
        stableCount++;
        if (stableCount >= requiredStableCount) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          resolve(currentValue);
        }
      } else {
        stableCount = 0;
        lastValue = currentValue;
      }
    }, 10);

    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      reject(
        new Error(
          `Signal did not stabilize within ${timeout}ms timeout. Last value: ${lastValue}`
        )
      );
    }, timeout);
  });
}

/**
 * Creates a mock signal for testing.
 *
 * @example
 * ```typescript
 * const mockUserName = createMockSignal('John Doe');
 * spyOn(component, 'userName').and.returnValue(mockUserName);
 * expect(component.userName()).toBe('John Doe');
 * mockUserName.set('Jane Doe');
 * expect(component.userName()).toBe('Jane Doe');
 * ```
 *
 * @param initialValue - The initial value of the mock signal
 * @returns A mock writable signal
 */
export function createMockSignal<T>(initialValue: T): WritableSignal<T> {
  let value = initialValue;
  const signal = (() => value) as WritableSignal<T>;
  signal.set = (newValue: T) => {
    value = newValue;
  };
  signal.update = (updateFn: (current: T) => T) => {
    value = updateFn(value);
  };
  return signal;
}

/**
 * Assert that a signal has a specific value.
 * Provides better error messages than expect(signal()).toBe(value).
 *
 * @example
 * ```typescript
 * assertSignalValue(component.userName, 'John Doe');
 * ```
 *
 * @param signal - The signal to check
 * @param expectedValue - The expected value
 * @param message - Optional custom error message
 */
export function assertSignalValue<T>(
  signal: Signal<T>,
  expectedValue: T,
  message?: string
): void {
  const actualValue = signal();
  const defaultMessage = `Expected signal to have value ${JSON.stringify(
    expectedValue
  )} but got ${JSON.stringify(actualValue)}`;
  expect(actualValue).toBe(expectedValue, message || defaultMessage);
}

/**
 * Assert that a computed signal eventually has a specific value.
 * Useful for testing async computed signals or effects.
 *
 * @example
 * ```typescript
 * await assertSignalValueEventually(component.isLoading, false, 2000);
 * ```
 *
 * @param signal - The signal to check
 * @param expectedValue - The expected value
 * @param timeout - Maximum time to wait in milliseconds (default: 1000)
 */
export async function assertSignalValueEventually<T>(
  signal: Signal<T>,
  expectedValue: T,
  timeout: number = 1000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (signal() === expectedValue) {
      expect(signal()).toBe(expectedValue);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  const actualValue = signal();
  throw new Error(
    `Signal did not reach expected value ${JSON.stringify(
      expectedValue
    )} within ${timeout}ms. Final value: ${JSON.stringify(actualValue)}`
  );
}
