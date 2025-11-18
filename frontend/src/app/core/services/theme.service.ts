import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Theme types supported by the application
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Resolved theme (what is actually displayed)
 */
export type ResolvedTheme = 'light' | 'dark';

/**
 * ThemeService
 *
 * Manages the application theme (light/dark mode) with the following features:
 * - Persists user preference in localStorage
 * - Detects system color scheme preference
 * - Listens to system preference changes
 * - Applies theme class to HTML element
 * - Uses Angular signals for reactive state management
 *
 * @example
 * ```typescript
 * const themeService = inject(ThemeService);
 *
 * // Get current theme
 * const theme = themeService.theme();
 *
 * // Set theme
 * themeService.setTheme('dark');
 *
 * // Toggle between light and dark
 * themeService.toggleTheme();
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'crypto-portfolio-theme';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * User's theme preference (light, dark, or system)
   */
  readonly theme = signal<Theme>('system');

  /**
   * Resolved theme (what is actually displayed: light or dark)
   * Automatically computed based on theme preference and system preference
   */
  readonly resolvedTheme = signal<ResolvedTheme>('light');

  /**
   * System color scheme preference
   */
  private readonly systemPreference = signal<ResolvedTheme>('light');

  /**
   * Media query for detecting dark mode preference
   */
  private darkModeMediaQuery: MediaQueryList | null = null;

  constructor() {
    // Only run theme logic in browser environment
    if (this.isBrowser) {
      this.initializeTheme();
      this.setupMediaQueryListener();
      this.setupThemeEffect();
    }
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  private initializeTheme(): void {
    // Detect system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.systemPreference.set(prefersDark ? 'dark' : 'light');

    // Load saved theme or use system
    const savedTheme = this.loadThemeFromStorage();
    if (savedTheme) {
      this.theme.set(savedTheme);
    } else {
      this.theme.set('system');
    }

    // Update resolved theme
    this.updateResolvedTheme();
  }

  /**
   * Setup media query listener for system preference changes
   */
  private setupMediaQueryListener(): void {
    this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Modern browsers support addEventListener
    const listener = (e: MediaQueryListEvent) => {
      this.systemPreference.set(e.matches ? 'dark' : 'light');
      if (this.theme() === 'system') {
        this.updateResolvedTheme();
      }
    };

    // Add listener
    if (this.darkModeMediaQuery.addEventListener) {
      this.darkModeMediaQuery.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      this.darkModeMediaQuery.addListener(listener);
    }
  }

  /**
   * Setup effect to apply theme class to HTML element
   */
  private setupThemeEffect(): void {
    effect(() => {
      const resolved = this.resolvedTheme();
      this.applyThemeToDOM(resolved);
    });
  }

  /**
   * Update resolved theme based on current theme and system preference
   */
  private updateResolvedTheme(): void {
    const currentTheme = this.theme();

    if (currentTheme === 'system') {
      this.resolvedTheme.set(this.systemPreference());
    } else {
      this.resolvedTheme.set(currentTheme);
    }
  }

  /**
   * Apply theme class to HTML element
   */
  private applyThemeToDOM(theme: ResolvedTheme): void {
    const htmlElement = document.documentElement;

    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }

  /**
   * Load theme from localStorage
   */
  private loadThemeFromStorage(): Theme | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && this.isValidTheme(saved)) {
        return saved as Theme;
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    return null;
  }

  /**
   * Save theme to localStorage
   */
  private saveThemeToStorage(theme: Theme): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }

  /**
   * Validate theme string
   */
  private isValidTheme(value: string): value is Theme {
    return value === 'light' || value === 'dark' || value === 'system';
  }

  /**
   * Set theme
   */
  setTheme(theme: Theme): void {
    if (!this.isBrowser) return;

    this.theme.set(theme);
    this.updateResolvedTheme();
    this.saveThemeToStorage(theme);
  }

  /**
   * Toggle between light and dark themes
   * If currently on system, toggle to the opposite of current resolved theme
   */
  toggleTheme(): void {
    if (!this.isBrowser) return;

    const currentResolved = this.resolvedTheme();
    const newTheme: ResolvedTheme = currentResolved === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Check if dark mode is currently active
   */
  isDark(): boolean {
    return this.resolvedTheme() === 'dark';
  }

  /**
   * Check if light mode is currently active
   */
  isLight(): boolean {
    return this.resolvedTheme() === 'light';
  }

  /**
   * Check if using system preference
   */
  isSystemPreference(): boolean {
    return this.theme() === 'system';
  }

  /**
   * Get system color scheme preference
   */
  getSystemPreference(): ResolvedTheme {
    return this.systemPreference();
  }
}
