// T131: View toggle component (Table view | Chart view)

import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ViewMode = 'table' | 'chart';

@Component({
  selector: 'app-view-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-toggle.component.html',
  styleUrls: ['./view-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewToggleComponent {
  // Signal inputs/outputs
  activeView = input<ViewMode>('table');
  viewChange = output<ViewMode>();

  selectView(view: ViewMode): void {
    if (this.activeView() !== view) {
      this.viewChange.emit(view);
    }
  }
}
