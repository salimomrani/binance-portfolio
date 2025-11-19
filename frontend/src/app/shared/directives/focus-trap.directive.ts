// T070: Focus trap directive for modal dialogs
// Traps keyboard focus within a container for accessibility

import {
  Directive,
  ElementRef,
  OnInit,
  OnDestroy,
  HostListener,
  Input,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appFocusTrap]',
  standalone: true,
})
export class FocusTrapDirective implements OnInit, OnDestroy {
  @Input() appFocusTrap = true; // Enable/disable focus trap

  private readonly el = inject(ElementRef);
  private firstFocusableElement: HTMLElement | null = null;
  private lastFocusableElement: HTMLElement | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  // Focusable element selectors
  private readonly focusableSelectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable]',
  ].join(', ');

  ngOnInit(): void {
    if (!this.appFocusTrap) return;

    // Store the currently focused element
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Find all focusable elements
    this.updateFocusableElements();

    // Focus the first element
    setTimeout(() => {
      this.firstFocusableElement?.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    // Restore focus to previously focused element
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.appFocusTrap || event.key !== 'Tab') return;

    this.updateFocusableElements();

    // If only one focusable element, prevent tabbing
    if (this.firstFocusableElement === this.lastFocusableElement) {
      event.preventDefault();
      return;
    }

    // Shift + Tab (backwards)
    if (event.shiftKey) {
      if (document.activeElement === this.firstFocusableElement) {
        event.preventDefault();
        this.lastFocusableElement?.focus();
      }
    }
    // Tab (forwards)
    else {
      if (document.activeElement === this.lastFocusableElement) {
        event.preventDefault();
        this.firstFocusableElement?.focus();
      }
    }
  }

  private updateFocusableElements(): void {
    const focusableElements = this.el.nativeElement.querySelectorAll(
      this.focusableSelectors
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length > 0) {
      this.firstFocusableElement = focusableElements[0];
      this.lastFocusableElement = focusableElements[focusableElements.length - 1];
    }
  }
}
