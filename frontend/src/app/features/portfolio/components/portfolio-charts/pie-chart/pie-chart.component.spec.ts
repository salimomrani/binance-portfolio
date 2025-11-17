// T127: Pie chart component test

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PieChartComponent } from './pie-chart.component';

describe('PieChartComponent', () => {
  let component: PieChartComponent;
  let fixture: ComponentFixture<PieChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PieChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty state when no data', () => {
    component.allocationData = [];
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should render chart when data is provided', () => {
    component.allocationData = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        value: 50000,
        percentage: 50,
        color: '#F7931A',
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        value: 30000,
        percentage: 30,
        color: '#627EEA',
      },
      {
        symbol: 'ADA',
        name: 'Cardano',
        value: 20000,
        percentage: 20,
        color: '#0033AD',
      },
    ];
    fixture.detectChanges();

    const canvas = fixture.nativeElement.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
});
