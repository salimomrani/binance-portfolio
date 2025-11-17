// T131: View toggle component (Table view | Chart view)

import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
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
  @Input() activeView: ViewMode = 'table';
  @Output() viewChange = new EventEmitter<ViewMode>();

  selectView(view: ViewMode): void {
    if (this.activeView !== view) {
      this.activeView = view;
      this.viewChange.emit(view);
    }
  }
}
