// Loading service to track HTTP requests

import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly loadingCount = signal(0);

  // Computed signal - true if any requests are in progress
  readonly isLoading = computed(() => this.loadingCount() > 0);

  /**
   * Increments loading counter
   */
  show(): void {
    this.loadingCount.update(count => count + 1);
  }

  /**
   * Decrements loading counter
   */
  hide(): void {
    this.loadingCount.update(count => Math.max(0, count - 1));
  }

  /**
   * Resets loading state
   */
  reset(): void {
    this.loadingCount.set(0);
  }
}
