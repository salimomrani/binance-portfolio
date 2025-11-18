import { TestBed } from '@angular/core/testing';
import { ThemeService, Theme, ResolvedTheme } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let mockMediaQueryList: MediaQueryList;
  let mediaQueryListeners: ((event: MediaQueryListEvent) => void)[] = [];

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Mock matchMedia
    mediaQueryListeners = [];
    mockMediaQueryList = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: jest.fn((event: string, listener: (event: MediaQueryListEvent) => void) => {
        mediaQueryListeners.push(listener);
      }),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
      onchange: null,
    } as unknown as MediaQueryList;

    window.matchMedia = jest.fn().mockReturnValue(mockMediaQueryList);

    TestBed.configureTestingModule({
      providers: [ThemeService]
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with system preference when no saved theme', () => {
      expect(service.theme()).toBe('system');
    });

    it('should load saved theme from localStorage', () => {
      localStorage.setItem('crypto-portfolio-theme', 'dark');

      // Create new instance to test initialization
      const newService = TestBed.inject(ThemeService);

      expect(newService.theme()).toBe('dark');
    });

    it('should detect system dark mode preference', () => {
      mockMediaQueryList.matches = true;
      const newService = TestBed.inject(ThemeService);

      expect(newService.getSystemPreference()).toBe('dark');
    });

    it('should detect system light mode preference', () => {
      mockMediaQueryList.matches = false;
      const newService = TestBed.inject(ThemeService);

      expect(newService.getSystemPreference()).toBe('light');
    });

    it('should apply dark class to HTML when system prefers dark', () => {
      mockMediaQueryList.matches = true;
      const newService = TestBed.inject(ThemeService);

      // Wait for effect to run
      TestBed.flushEffects();

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should not apply dark class to HTML when system prefers light', () => {
      mockMediaQueryList.matches = false;
      const newService = TestBed.inject(ThemeService);

      // Wait for effect to run
      TestBed.flushEffects();

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('should set theme to light', () => {
      service.setTheme('light');

      expect(service.theme()).toBe('light');
      expect(service.resolvedTheme()).toBe('light');
    });

    it('should set theme to dark', () => {
      service.setTheme('dark');

      expect(service.theme()).toBe('dark');
      expect(service.resolvedTheme()).toBe('dark');
    });

    it('should set theme to system', () => {
      service.setTheme('system');

      expect(service.theme()).toBe('system');
    });

    it('should save theme to localStorage', () => {
      service.setTheme('dark');

      expect(localStorage.getItem('crypto-portfolio-theme')).toBe('dark');
    });

    it('should apply dark class to HTML when setting dark theme', () => {
      service.setTheme('dark');
      TestBed.flushEffects();

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from HTML when setting light theme', () => {
      // First set to dark
      service.setTheme('dark');
      TestBed.flushEffects();

      // Then set to light
      service.setTheme('light');
      TestBed.flushEffects();

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', () => {
      service.setTheme('light');
      service.toggleTheme();

      expect(service.theme()).toBe('dark');
      expect(service.resolvedTheme()).toBe('dark');
    });

    it('should toggle from dark to light', () => {
      service.setTheme('dark');
      service.toggleTheme();

      expect(service.theme()).toBe('light');
      expect(service.resolvedTheme()).toBe('light');
    });

    it('should toggle from system (dark) to light', () => {
      mockMediaQueryList.matches = true;
      const newService = TestBed.inject(ThemeService);

      newService.toggleTheme();

      expect(newService.theme()).toBe('light');
      expect(newService.resolvedTheme()).toBe('light');
    });

    it('should toggle from system (light) to dark', () => {
      mockMediaQueryList.matches = false;
      const newService = TestBed.inject(ThemeService);

      newService.toggleTheme();

      expect(newService.theme()).toBe('dark');
      expect(newService.resolvedTheme()).toBe('dark');
    });
  });

  describe('Helper methods', () => {
    it('isDark should return true when theme is dark', () => {
      service.setTheme('dark');

      expect(service.isDark()).toBe(true);
    });

    it('isDark should return false when theme is light', () => {
      service.setTheme('light');

      expect(service.isDark()).toBe(false);
    });

    it('isLight should return true when theme is light', () => {
      service.setTheme('light');

      expect(service.isLight()).toBe(true);
    });

    it('isLight should return false when theme is dark', () => {
      service.setTheme('dark');

      expect(service.isLight()).toBe(false);
    });

    it('isSystemPreference should return true when using system theme', () => {
      service.setTheme('system');

      expect(service.isSystemPreference()).toBe(true);
    });

    it('isSystemPreference should return false when using explicit theme', () => {
      service.setTheme('dark');

      expect(service.isSystemPreference()).toBe(false);
    });
  });

  describe('System preference changes', () => {
    it('should update resolved theme when system preference changes and using system theme', () => {
      service.setTheme('system');

      // Simulate system preference change to dark
      const event = { matches: true } as MediaQueryListEvent;
      mediaQueryListeners.forEach(listener => listener(event));

      expect(service.resolvedTheme()).toBe('dark');
    });

    it('should not update resolved theme when system preference changes and using explicit theme', () => {
      service.setTheme('light');

      // Simulate system preference change to dark
      const event = { matches: true } as MediaQueryListEvent;
      mediaQueryListeners.forEach(listener => listener(event));

      // Should still be light
      expect(service.resolvedTheme()).toBe('light');
    });

    it('should apply dark class when system preference changes to dark', () => {
      service.setTheme('system');
      TestBed.flushEffects();

      // Simulate system preference change to dark
      const event = { matches: true } as MediaQueryListEvent;
      mediaQueryListeners.forEach(listener => listener(event));
      TestBed.flushEffects();

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('LocalStorage error handling', () => {
    it('should handle localStorage read errors gracefully', () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw, should use default
      const newService = TestBed.inject(ThemeService);
      expect(newService.theme()).toBe('system');

      // Restore
      localStorage.getItem = originalGetItem;
    });

    it('should handle localStorage write errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => service.setTheme('dark')).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Restore
      localStorage.setItem = originalSetItem;
      consoleWarnSpy.mockRestore();
    });

    it('should ignore invalid theme values from localStorage', () => {
      localStorage.setItem('crypto-portfolio-theme', 'invalid-theme');

      const newService = TestBed.inject(ThemeService);

      // Should fall back to system
      expect(newService.theme()).toBe('system');
    });
  });
});
