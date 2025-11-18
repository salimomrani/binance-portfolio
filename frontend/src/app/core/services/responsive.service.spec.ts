import { TestBed } from '@angular/core/testing';
import { ResponsiveService, Breakpoint, BREAKPOINTS } from './responsive.service';

describe('ResponsiveService', () => {
  let service: ResponsiveService;
  let originalInnerWidth: number;

  beforeEach(() => {
    // Store original window.innerWidth
    originalInnerWidth = window.innerWidth;

    TestBed.configureTestingModule({
      providers: [ResponsiveService]
    });
    service = TestBed.inject(ResponsiveService);
  });

  afterEach(() => {
    // Restore original window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
  });

  /**
   * Helper function to set window width and trigger resize
   */
  function setWindowWidth(width: number): void {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    });
    window.dispatchEvent(new Event('resize'));
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Breakpoint Detection', () => {
    it('should detect xs breakpoint (<640px)', (done) => {
      setWindowWidth(320);

      setTimeout(() => {
        expect(service.currentBreakpoint()).toBe('xs');
        expect(service.viewportWidth()).toBe(320);
        done();
      }, 200);
    });

    it('should detect sm breakpoint (640-767px)', (done) => {
      setWindowWidth(640);

      setTimeout(() => {
        expect(service.currentBreakpoint()).toBe('sm');
        expect(service.viewportWidth()).toBe(640);
        done();
      }, 200);
    });

    it('should detect md breakpoint (768-1023px)', (done) => {
      setWindowWidth(768);

      setTimeout(() => {
        expect(service.currentBreakpoint()).toBe('md');
        expect(service.viewportWidth()).toBe(768);
        done();
      }, 200);
    });

    it('should detect lg breakpoint (1024-1279px)', (done) => {
      setWindowWidth(1024);

      setTimeout(() => {
        expect(service.currentBreakpoint()).toBe('lg');
        expect(service.viewportWidth()).toBe(1024);
        done();
      }, 200);
    });

    it('should detect xl breakpoint (1280-1535px)', (done) => {
      setWindowWidth(1280);

      setTimeout(() => {
        expect(service.currentBreakpoint()).toBe('xl');
        expect(service.viewportWidth()).toBe(1280);
        done();
      }, 200);
    });

    it('should detect 2xl breakpoint (>=1536px)', (done) => {
      setWindowWidth(1920);

      setTimeout(() => {
        expect(service.currentBreakpoint()).toBe('2xl');
        expect(service.viewportWidth()).toBe(1920);
        done();
      }, 200);
    });
  });

  describe('Helper Methods', () => {
    describe('isMobile()', () => {
      it('should return true for xs breakpoint', (done) => {
        setWindowWidth(320);

        setTimeout(() => {
          expect(service.isMobile()).toBe(true);
          done();
        }, 200);
      });

      it('should return true for sm breakpoint', (done) => {
        setWindowWidth(640);

        setTimeout(() => {
          expect(service.isMobile()).toBe(true);
          done();
        }, 200);
      });

      it('should return false for md and larger breakpoints', (done) => {
        setWindowWidth(768);

        setTimeout(() => {
          expect(service.isMobile()).toBe(false);
          done();
        }, 200);
      });
    });

    describe('isTablet()', () => {
      it('should return true for md breakpoint', (done) => {
        setWindowWidth(768);

        setTimeout(() => {
          expect(service.isTablet()).toBe(true);
          done();
        }, 200);
      });

      it('should return false for other breakpoints', (done) => {
        setWindowWidth(1024);

        setTimeout(() => {
          expect(service.isTablet()).toBe(false);
          done();
        }, 200);
      });
    });

    describe('isDesktop()', () => {
      it('should return true for lg breakpoint', (done) => {
        setWindowWidth(1024);

        setTimeout(() => {
          expect(service.isDesktop()).toBe(true);
          done();
        }, 200);
      });

      it('should return true for xl breakpoint', (done) => {
        setWindowWidth(1280);

        setTimeout(() => {
          expect(service.isDesktop()).toBe(true);
          done();
        }, 200);
      });

      it('should return true for 2xl breakpoint', (done) => {
        setWindowWidth(1920);

        setTimeout(() => {
          expect(service.isDesktop()).toBe(true);
          done();
        }, 200);
      });

      it('should return false for mobile/tablet breakpoints', (done) => {
        setWindowWidth(640);

        setTimeout(() => {
          expect(service.isDesktop()).toBe(false);
          done();
        }, 200);
      });
    });

    describe('isAtLeast()', () => {
      it('should return true when viewport is at or above specified breakpoint', (done) => {
        setWindowWidth(1024);

        setTimeout(() => {
          expect(service.isAtLeast('md')).toBe(true);
          expect(service.isAtLeast('lg')).toBe(true);
          expect(service.isAtLeast('xl')).toBe(false);
          done();
        }, 200);
      });
    });

    describe('isAtMost()', () => {
      it('should return true when viewport is at or below specified breakpoint', (done) => {
        setWindowWidth(768);

        setTimeout(() => {
          expect(service.isAtMost('md')).toBe(true);
          expect(service.isAtMost('lg')).toBe(true);
          expect(service.isAtMost('sm')).toBe(false);
          done();
        }, 200);
      });
    });

    describe('isWidthBetween()', () => {
      it('should check if width is within range', (done) => {
        setWindowWidth(800);

        setTimeout(() => {
          expect(service.isWidthBetween(768, 1024)).toBe(true);
          expect(service.isWidthBetween(1024, 1280)).toBe(false);
          expect(service.isWidthBetween(640)).toBe(true);
          done();
        }, 200);
      });
    });
  });

  describe('Getter Methods', () => {
    it('should return current viewport width', (done) => {
      setWindowWidth(1024);

      setTimeout(() => {
        expect(service.getViewportWidth()).toBe(1024);
        done();
      }, 200);
    });

    it('should return breakpoint value in pixels', () => {
      expect(service.getBreakpointValue('xs')).toBe(0);
      expect(service.getBreakpointValue('sm')).toBe(640);
      expect(service.getBreakpointValue('md')).toBe(768);
      expect(service.getBreakpointValue('lg')).toBe(1024);
      expect(service.getBreakpointValue('xl')).toBe(1280);
      expect(service.getBreakpointValue('2xl')).toBe(1536);
    });
  });

  describe('Resize Handling', () => {
    it('should update breakpoint on window resize with debouncing', (done) => {
      setWindowWidth(320);

      setTimeout(() => {
        expect(service.currentBreakpoint()).toBe('xs');

        // Resize to desktop
        setWindowWidth(1280);

        setTimeout(() => {
          expect(service.currentBreakpoint()).toBe('xl');
          done();
        }, 200);
      }, 200);
    });

    it('should debounce multiple rapid resize events', (done) => {
      setWindowWidth(320);

      setTimeout(() => {
        expect(service.currentBreakpoint()).toBe('xs');

        // Simulate rapid resize events
        setWindowWidth(640);
        setWindowWidth(768);
        setWindowWidth(1024);

        setTimeout(() => {
          // Should settle on the final width
          expect(service.currentBreakpoint()).toBe('lg');
          expect(service.viewportWidth()).toBe(1024);
          done();
        }, 200);
      }, 200);
    });
  });

  describe('BREAKPOINTS constant', () => {
    it('should match Tailwind CSS default breakpoints', () => {
      expect(BREAKPOINTS.xs).toBe(0);
      expect(BREAKPOINTS.sm).toBe(640);
      expect(BREAKPOINTS.md).toBe(768);
      expect(BREAKPOINTS.lg).toBe(1024);
      expect(BREAKPOINTS.xl).toBe(1280);
      expect(BREAKPOINTS['2xl']).toBe(1536);
    });
  });
});
