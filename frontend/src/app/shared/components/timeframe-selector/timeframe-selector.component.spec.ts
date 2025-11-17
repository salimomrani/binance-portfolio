// T136: Timeframe selector component test

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeframeSelectorComponent } from './timeframe-selector.component';

describe('TimeframeSelectorComponent', () => {
  let component: TimeframeSelectorComponent;
  let fixture: ComponentFixture<TimeframeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeframeSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeframeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 7d as default timeframe', () => {
    expect(component.selectedTimeframe).toBe('7d');
  });

  it('should emit timeframeChange when timeframe is selected', () => {
    spyOn(component.timeframeChange, 'emit');

    component.selectTimeframe('30d');

    expect(component.timeframeChange.emit).toHaveBeenCalledWith('30d');
    expect(component.selectedTimeframe).toBe('30d');
  });

  it('should not emit timeframeChange when same timeframe is selected', () => {
    component.selectedTimeframe = '7d';
    spyOn(component.timeframeChange, 'emit');

    component.selectTimeframe('7d');

    expect(component.timeframeChange.emit).not.toHaveBeenCalled();
  });

  it('should render all timeframe options', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.timeframe-button');
    expect(buttons.length).toBe(4);
    expect(buttons[0].textContent.trim()).toBe('24h');
    expect(buttons[1].textContent.trim()).toBe('7d');
    expect(buttons[2].textContent.trim()).toBe('30d');
    expect(buttons[3].textContent.trim()).toBe('1y');
  });
});
