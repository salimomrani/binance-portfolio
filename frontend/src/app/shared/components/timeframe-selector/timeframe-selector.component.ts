// T134: Timeframe selector component

import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
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
  @Input() selectedTimeframe: Timeframe = '7d';
  @Output() timeframeChange = new EventEmitter<Timeframe>();

  readonly timeframes: Timeframe[] = ['24h', '7d', '30d', '1y'];

  selectTimeframe(timeframe: Timeframe): void {
    if (this.selectedTimeframe !== timeframe) {
      this.selectedTimeframe = timeframe;
      this.timeframeChange.emit(timeframe);
    }
  }
}
