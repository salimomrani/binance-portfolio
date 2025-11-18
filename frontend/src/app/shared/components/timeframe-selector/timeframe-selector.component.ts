// T134: Timeframe selector component

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type Timeframe = '24h' | '7d' | '30d' | '1y';

@Component({
  selector: 'app-timeframe-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeframe-selector.component.html',
  styleUrls: ['./timeframe-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeframeSelectorComponent {
  // Signal inputs/outputs
  selectedTimeframe = input<Timeframe>('7d');
  timeframeChange = output<Timeframe>();

  readonly timeframes: Timeframe[] = ['24h', '7d', '30d', '1y'];

  selectTimeframe(timeframe: Timeframe): void {
    if (this.selectedTimeframe() !== timeframe) {
      this.timeframeChange.emit(timeframe);
    }
  }
}
