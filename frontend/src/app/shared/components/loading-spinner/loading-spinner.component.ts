// T045: Loading spinner component

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary-light transition-colors duration-200"></div>
    </div>
  `,
  styles: []
})
export class LoadingSpinnerComponent {}
