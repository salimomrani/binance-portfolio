// T109: Gain/Loss Badge Component Tests

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GainLossBadgeComponent } from './gain-loss-badge.component';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { PercentageFormatPipe } from '../../pipes/percentage-format.pipe';

describe('GainLossBadgeComponent', () => {
  let component: GainLossBadgeComponent;
  let fixture: ComponentFixture<GainLossBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GainLossBadgeComponent, CurrencyFormatPipe, PercentageFormatPipe],
    }).compileComponents();

    fixture = TestBed.createComponent(GainLossBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display profit with green color and up arrow', () => {
    component.value = 100;
    component.percentage = 10;
    fixture.detectChanges();

    expect(component.isProfit).toBe(true);
    expect(component.colorClass).toBe('text-profit');
    expect(component.arrowIcon).toBe('↑');
  });

  it('should display loss with red color and down arrow', () => {
    component.value = -50;
    component.percentage = -5;
    fixture.detectChanges();

    expect(component.isLoss).toBe(true);
    expect(component.colorClass).toBe('text-loss');
    expect(component.arrowIcon).toBe('↓');
  });

  it('should display neutral with gray color and neutral arrow', () => {
    component.value = 0;
    component.percentage = 0;
    fixture.detectChanges();

    expect(component.isNeutral).toBe(true);
    expect(component.colorClass).toBe('text-neutral');
    expect(component.arrowIcon).toBe('→');
  });

  it('should hide percentage when showPercentage is false', () => {
    component.value = 100;
    component.percentage = 10;
    component.showPercentage = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('(');
  });

  it('should hide arrow when showArrow is false', () => {
    component.value = 100;
    component.percentage = 10;
    component.showArrow = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('↑');
  });

  it('should apply correct size classes', () => {
    component.value = 100;
    component.percentage = 10;
    component.size = 'large';
    fixture.detectChanges();

    expect(component.sizeClasses).toContain('text-base');
    expect(component.sizeClasses).toContain('px-4');
  });
});
