// T129: Line chart component test

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChartComponent } from './line-chart.component';

describe('LineChartComponent', () => {
  let component: LineChartComponent;
  let fixture: ComponentFixture<LineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty state when no data', () => {
    component.historyData = [];
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should render chart when data is provided', () => {
    component.historyData = [
      {
        timestamp: new Date('2025-01-01'),
        price: 50000,
        volume: 1000000,
      },
      {
        timestamp: new Date('2025-01-02'),
        price: 51000,
        volume: 1100000,
      },
      {
        timestamp: new Date('2025-01-03'),
        price: 52000,
        volume: 1200000,
      },
    ];
    fixture.detectChanges();

    const canvas = fixture.nativeElement.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
});
