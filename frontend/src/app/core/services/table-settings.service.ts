// T154: Service for managing table column visibility settings

import { Injectable, signal } from '@angular/core';

export interface ColumnSettings {
  symbol: boolean;
  quantity: boolean;
  currentValue: boolean;
  gainLoss: boolean;
  gainLossPercentage: boolean;
  priceChange24h: boolean;
  volume24h: boolean;
  marketCap: boolean;
  actions: boolean;
}

const DEFAULT_COLUMN_SETTINGS: ColumnSettings = {
  symbol: true,
  quantity: true,
  currentValue: true,
  gainLoss: true,
  gainLossPercentage: true,
  priceChange24h: true,
  volume24h: false, // Hidden by default (optional column)
  marketCap: false, // Hidden by default (optional column)
  actions: true,
};

const STORAGE_KEY = 'portfolio-table-column-settings';

@Injectable({
  providedIn: 'root',
})
export class TableSettingsService {
  private readonly columnSettings = signal<ColumnSettings>(this.loadSettings());

  /**
   * Get current column settings as a signal
   */
  getColumnSettings() {
    return this.columnSettings.asReadonly();
  }

  /**
   * Update column visibility
   */
  updateColumnVisibility(column: keyof ColumnSettings, visible: boolean): void {
    const currentSettings = this.columnSettings();
    const updatedSettings = {
      ...currentSettings,
      [column]: visible,
    };
    this.columnSettings.set(updatedSettings);
    this.saveSettings(updatedSettings);
  }

  /**
   * Toggle column visibility
   */
  toggleColumn(column: keyof ColumnSettings): void {
    const currentSettings = this.columnSettings();
    this.updateColumnVisibility(column, !currentSettings[column]);
  }

  /**
   * Reset to default settings
   */
  resetToDefaults(): void {
    this.columnSettings.set({ ...DEFAULT_COLUMN_SETTINGS });
    this.saveSettings(DEFAULT_COLUMN_SETTINGS);
  }

  /**
   * Check if a specific column is visible
   */
  isColumnVisible(column: keyof ColumnSettings): boolean {
    return this.columnSettings()[column];
  }

  /**
   * Get list of all columns with their visibility state
   */
  getAllColumnsWithState(): Array<{ key: keyof ColumnSettings; label: string; visible: boolean }> {
    const settings = this.columnSettings();
    return [
      { key: 'symbol', label: 'Cryptocurrency', visible: settings.symbol },
      { key: 'quantity', label: 'Quantity', visible: settings.quantity },
      { key: 'currentValue', label: 'Current Value', visible: settings.currentValue },
      { key: 'gainLoss', label: 'Gain/Loss ($)', visible: settings.gainLoss },
      { key: 'gainLossPercentage', label: 'Gain/Loss (%)', visible: settings.gainLossPercentage },
      { key: 'priceChange24h', label: '24h Change', visible: settings.priceChange24h },
      { key: 'volume24h', label: 'Volume 24h', visible: settings.volume24h },
      { key: 'marketCap', label: 'Market Cap', visible: settings.marketCap },
      { key: 'actions', label: 'Actions', visible: settings.actions },
    ];
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): ColumnSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new columns are included
        return { ...DEFAULT_COLUMN_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load table column settings:', error);
    }
    return { ...DEFAULT_COLUMN_SETTINGS };
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(settings: ColumnSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save table column settings:', error);
    }
  }
}
