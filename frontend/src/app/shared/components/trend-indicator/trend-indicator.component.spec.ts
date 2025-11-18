// T150: Trend Indicator Component Tests

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrendIndicatorComponent } from './trend-indicator.component';

describe('TrendIndicatorComponent', () => {
  let component: TrendIndicatorComponent;
  let fixture: ComponentFixture<TrendIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TrendIndicatorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // T159: Additional tests will be added here
  describe('Trend Calculation', () => {
    it('should show uptrend for positive change above threshold', () => {
      component.change = 2.5;
      component.threshold = 0.5;
      expect(component.trend).toBe('up');
      expect(component.isUptrend).toBe(true);
    });

    it('should show downtrend for negative change below threshold', () => {
      component.change = -2.5;
      component.threshold = 0.5;
      expect(component.trend).toBe('down');
      expect(component.isDowntrend).toBe(true);
    });

    it('should show neutral for change within threshold', () => {
      component.change = 0.3;
      component.threshold = 0.5;
      expect(component.trend).toBe('neutral');
      expect(component.isNeutral).toBe(true);
    });
  });

  describe('Color Coding', () => {
    it('should apply green color for uptrend', () => {
      component.change = 5.0;
      expect(component.colorClass).toBe('text-green-600');
    });

    it('should apply red color for downtrend', () => {
      component.change = -5.0;
      expect(component.colorClass).toBe('text-red-600');
    });

    it('should apply gray color for neutral', () => {
      component.change = 0.2;
      component.threshold = 0.5;
      expect(component.colorClass).toBe('text-gray-500');
    });
  });

  describe('Arrow Icons', () => {
    it('should show up arrow for uptrend', () => {
      component.change = 3.0;
      expect(component.arrowIcon).toBe('↑');
    });

    it('should show down arrow for downtrend', () => {
      component.change = -3.0;
      expect(component.arrowIcon).toBe('↓');
    });

    it('should show right arrow for neutral', () => {
      component.change = 0.1;
      component.threshold = 0.5;
      expect(component.arrowIcon).toBe('→');
    });
  });

  describe('Formatting', () => {
    it('should format positive change with + sign', () => {
      component.change = 2.5;
      expect(component.formattedChange).toBe('+2.50%');
    });

    it('should format negative change with - sign', () => {
      component.change = -2.5;
      expect(component.formattedChange).toBe('-2.50%');
    });

    it('should format zero without sign', () => {
      component.change = 0;
      expect(component.formattedChange).toBe('0.00%');
    });
  });

  // T159: DOM Rendering Tests - Verify color coding in actual rendered output
  describe('DOM Rendering', () => {
    it('should render uptrend with green text color class', () => {
      component.change = 5.0;
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('span[data-trend]');
      expect(element.getAttribute('data-trend')).toBe('up');
      expect(element.className).toContain('text-green-600');
    });

    it('should render downtrend with red text color class', () => {
      component.change = -5.0;
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('span[data-trend]');
      expect(element.getAttribute('data-trend')).toBe('down');
      expect(element.className).toContain('text-red-600');
    });

    it('should render neutral with gray text color class', () => {
      component.change = 0.3;
      component.threshold = 0.5;
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('span[data-trend]');
      expect(element.getAttribute('data-trend')).toBe('neutral');
      expect(element.className).toContain('text-gray-500');
    });

    it('should display arrow icon when showArrow is true', () => {
      component.change = 3.0;
      component.showArrow = true;
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('span[data-trend]');
      expect(element.textContent).toContain('↑');
    });

    it('should not display arrow icon when showArrow is false', () => {
      component.change = 3.0;
      component.showArrow = false;
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('span[data-trend]');
      expect(element.textContent).not.toContain('↑');
    });

    it('should display formatted percentage value', () => {
      component.change = 7.89;
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('span[data-trend]');
      expect(element.textContent).toContain('+7.89%');
    });

    it('should apply correct size classes', () => {
      component.change = 2.0;
      component.size = 'large';
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('span[data-trend]');
      expect(element.className).toContain('text-base');
      expect(element.className).toContain('px-4');
    });

    it('should apply correct background color for uptrend', () => {
      component.change = 2.5;
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('span[data-trend]');
      expect(element.className).toContain('bg-green-50');
    });

    it('should apply correct background color for downtrend', () => {
      component.change = -2.5;
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('span[data-trend]');
      expect(element.className).toContain('bg-red-50');
    });
  });

  // T159: Edge Cases
  describe('Edge Cases', () => {
    it('should handle very small positive changes', () => {
      component.change = 0.01;
      component.threshold = 0.5;
      expect(component.trend).toBe('neutral');
    });

    it('should handle very small negative changes', () => {
      component.change = -0.01;
      component.threshold = 0.5;
      expect(component.trend).toBe('neutral');
    });

    it('should handle large positive changes', () => {
      component.change = 999.99;
      expect(component.trend).toBe('up');
      expect(component.formattedChange).toBe('+999.99%');
    });

    it('should handle large negative changes', () => {
      component.change = -999.99;
      expect(component.trend).toBe('down');
      expect(component.formattedChange).toBe('-999.99%');
    });

    it('should handle custom threshold values', () => {
      component.change = 1.0;
      component.threshold = 2.0;
      expect(component.trend).toBe('neutral');

      component.change = 2.5;
      expect(component.trend).toBe('up');
    });
  });
});
