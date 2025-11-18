// T127: Pie chart component for portfolio allocation

import {
  Component,
  input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

export interface AllocationData {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieChartComponent implements AfterViewInit, OnDestroy {
  // Signal inputs
  allocationData = input<AllocationData[]>([]);
  title = input<string>('Portfolio Allocation');

  @ViewChild('chartCanvas', { static: false })
  chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private isInitialized = false;

  constructor() {
    // Effect to update chart when allocationData changes
    effect(() => {
      const data = this.allocationData();
      if (this.isInitialized && data.length > 0) {
        this.updateChart();
      }
    });
  }

  ngAfterViewInit(): void {
    this.renderChart();
    this.isInitialized = true;
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private renderChart(): void {
    if (!this.chartCanvas) {
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    // T128: Configure doughnut chart with custom styling
    const data = this.allocationData();
    const titleText = this.title();

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels: data.map((item) => `${item.symbol} (${item.percentage.toFixed(2)}%)`),
        datasets: [
          {
            data: data.map((item) => item.value),
            backgroundColor: data.map((item) => item.color),
            borderColor: '#ffffff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12,
                family: "'Inter', sans-serif",
              },
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            padding: 12,
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                const allocation = data[index];
                return [
                  `${allocation.name}`,
                  `Value: $${allocation.value.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`,
                  `Allocation: ${allocation.percentage.toFixed(2)}%`,
                ];
              },
            },
          },
          title: {
            display: !!titleText,
            text: titleText,
            font: {
              size: 16,
              weight: 'bold',
              family: "'Inter', sans-serif",
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          },
        },
        cutout: '60%', // Doughnut hole size
      },
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) {
      this.renderChart();
      return;
    }

    const data = this.allocationData();

    // Update chart data
    this.chart.data.labels = data.map(
      (item) => `${item.symbol} (${item.percentage.toFixed(2)}%)`
    );
    this.chart.data.datasets[0].data = data.map(
      (item) => item.value
    );
    this.chart.data.datasets[0].backgroundColor = data.map(
      (item) => item.color
    );

    this.chart.update();
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }
}
