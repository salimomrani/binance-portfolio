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
});
