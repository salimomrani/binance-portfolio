// T129: Line chart component for portfolio performance trends

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
import { createGradient, CRYPTO_COLOR_PALETTE } from '../../../../../shared/utils/chart-colors.util';

// Register Chart.js components
Chart.register(...registerables);

export interface PriceHistoryData {
  timestamp: Date;
  price: number;
  volume: number;
}

@Component({
  selector: 'app-line-chart',
  standalone: true,
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineChartComponent implements AfterViewInit, OnDestroy {
  // Signal inputs
  historyData = input<PriceHistoryData[]>([]);
  title = input<string>('Portfolio Performance');
  color = input<string>(CRYPTO_COLOR_PALETTE[0]);

  @ViewChild('chartCanvas', { static: false })
  chartCanvas!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private isInitialized = false;

  constructor() {
    // Effect to update chart when data changes
    effect(() => {
      const data = this.historyData();
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

    // T130: Configure line chart with smooth curves, gradient fill, and hover interactions
    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels: this.historyData().map((item) =>
          new Date(item.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })
        ),
        datasets: [
          {
            label: 'Price',
            data: this.historyData().map((item) => item.price),
            borderColor: this.color(),
            backgroundColor: createGradient(ctx, this.color()),
            borderWidth: 2,
            fill: true,
            tension: 0.4, // Smooth curves
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: this.color(),
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
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
                const value = context.parsed.y;
                if (value === null || value === undefined) {
                  return 'Price: N/A';
                }
                return `Price: $${value.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`;
              },
            },
          },
          title: {
            display: !!this.title(),
            text: this.title(),
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
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                size: 11,
              },
              maxRotation: 0,
              autoSkipPadding: 20,
            },
          },
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              font: {
                size: 11,
              },
              callback: (value) => {
                if (typeof value === 'number') {
                  return `$${value.toLocaleString('en-US')}`;
                }
                return value;
              },
            },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }

  private updateChart(): void {
    if (!this.chart) {
      this.renderChart();
      return;
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    // Update chart data
    this.chart.data.labels = this.historyData().map((item) =>
      new Date(item.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    );
    this.chart.data.datasets[0].data = this.historyData().map(
      (item) => item.price
    );
    this.chart.data.datasets[0].borderColor = this.color();
    this.chart.data.datasets[0].backgroundColor = createGradient(ctx, this.color());

    this.chart.update();
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }
}
