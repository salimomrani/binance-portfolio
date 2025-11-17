// T154: Column settings component for configurable table columns

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableSettingsService } from '../../../core/services/table-settings.service';

@Component({
  selector: 'app-column-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './column-settings.component.html',
  styleUrl: './column-settings.component.scss',
})
export class ColumnSettingsComponent {
  private readonly tableSettingsService = inject(TableSettingsService);

  protected readonly isOpen = signal(false);
  protected readonly columnSettings = this.tableSettingsService.getColumnSettings();
  protected readonly columns = this.tableSettingsService.getAllColumnsWithState();

  toggleDropdown(): void {
    this.isOpen.update(value => !value);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  toggleColumn(columnKey: string): void {
    this.tableSettingsService.toggleColumn(columnKey as any);
  }

  resetToDefaults(): void {
    this.tableSettingsService.resetToDefaults();
  }
}
