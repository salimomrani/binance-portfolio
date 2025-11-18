import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Breakpoint types for responsive design
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Breakpoint configuration matching Tailwind CSS defaults
 */
export const BREAKPOINTS = {
  xs: 0,      // < 640px
  sm: 640,    // >= 640px
  md: 768,    // >= 768px
  lg: 1024,   // >= 1024px
  xl: 1280,   // >= 1280px
  '2xl': 1536 // >= 1536px
} as const;

/**
 * ResponsiveService
 *
 * Detects and tracks the current viewport breakpoint with the following features:
 * - Real-time breakpoint detection based on window width
 * - Listens to window resize events with debouncing
 * - Provides helper methods to check breakpoint conditions
 * - Uses Angular signals for reactive state management
 * - Matches Tailwind CSS breakpoint system
 *
 * @example
 * ```typescript
 * const responsiveService = inject(ResponsiveService);
 *
 * // Get current breakpoint
 * const breakpoint = responsiveService.currentBreakpoint();
 *
 * // Check if mobile
 * if (responsiveService.isMobile()) {
 *   // Show mobile layout
 * }
 *
 * // Check if desktop
 * if (responsiveService.isDesktop()) {
 *   // Show desktop layout
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Current viewport breakpoint
   */
  readonly currentBreakpoint = signal<Breakpoint>('lg');

  /**
   * Current viewport width in pixels
   */
  readonly viewportWidth = signal<number>(1024);

  /**
   * Resize observer timeout for debouncing
   */
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Debounce delay in milliseconds
   */
  private readonly DEBOUNCE_DELAY = 150;

  constructor() {
    // Only run responsive logic in browser environment
    if (this.isBrowser) {
      this.initializeBreakpoint();
      this.setupResizeListener();
    }
  }

  /**
   * Initialize breakpoint based on current window width
   */
  private initializeBreakpoint(): void {
    const width = window.innerWidth;
    this.viewportWidth.set(width);
    this.currentBreakpoint.set(this.getBreakpointFromWidth(width));
  }

  /**
   * Setup window resize listener with debouncing
   */
  private setupResizeListener(): void {
    const handleResize = () => {
      // Clear existing timeout
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }

      // Debounce resize events
      this.resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        this.viewportWidth.set(width);
        this.currentBreakpoint.set(this.getBreakpointFromWidth(width));
      }, this.DEBOUNCE_DELAY);
    };

    window.addEventListener('resize', handleResize);
  }

  /**
   * Determine breakpoint from viewport width
   */
  private getBreakpointFromWidth(width: number): Breakpoint {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  }

  /**
   * Check if current breakpoint is mobile (xs or sm)
   */
  isMobile(): boolean {
    const bp = this.currentBreakpoint();
    return bp === 'xs' || bp === 'sm';
  }

  /**
   * Check if current breakpoint is tablet (md)
   */
  isTablet(): boolean {
    return this.currentBreakpoint() === 'md';
  }

  /**
   * Check if current breakpoint is desktop (lg or larger)
   */
  isDesktop(): boolean {
    const bp = this.currentBreakpoint();
    return bp === 'lg' || bp === 'xl' || bp === '2xl';
  }

  /**
   * Check if current breakpoint is at least the specified breakpoint
   * @param breakpoint - Minimum breakpoint to check
   */
  isAtLeast(breakpoint: Breakpoint): boolean {
    const currentWidth = this.viewportWidth();
    return currentWidth >= BREAKPOINTS[breakpoint];
  }

  /**
   * Check if current breakpoint is at most the specified breakpoint
   * @param breakpoint - Maximum breakpoint to check
   */
  isAtMost(breakpoint: Breakpoint): boolean {
    const bp = this.currentBreakpoint();
    const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(bp);
    const targetIndex = breakpoints.indexOf(breakpoint);
    return currentIndex <= targetIndex;
  }

  /**
   * Check if viewport width is within a specific range
   * @param min - Minimum width in pixels
   * @param max - Maximum width in pixels (optional)
   */
  isWidthBetween(min: number, max?: number): boolean {
    const width = this.viewportWidth();
    if (max !== undefined) {
      return width >= min && width <= max;
    }
    return width >= min;
  }

  /**
   * Get current viewport width
   */
  getViewportWidth(): number {
    return this.viewportWidth();
  }

  /**
   * Get breakpoint value in pixels
   */
  getBreakpointValue(breakpoint: Breakpoint): number {
    return BREAKPOINTS[breakpoint];
  }
}
