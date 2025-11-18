// T046: Error message component

import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message()" class="bg-error-bg dark:bg-error/10 border border-error/20 dark:border-error/30 rounded-lg p-4 my-4 transition-colors duration-200">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-error dark:text-error-light transition-colors duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-error-dark dark:text-error-light transition-colors duration-200">
            {{ title() }}
          </h3>
          <div class="mt-2 text-sm text-error dark:text-error-light transition-colors duration-200">
            <p>{{ message() }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ErrorMessageComponent {
  message = input<string | null>(null);
  title = input<string>('Error');
}
