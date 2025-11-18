// T157: Price flash animation directive
// Adds green flash when price increases, red flash when price decreases

import { Directive, ElementRef, Input, OnChanges, SimpleChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appPriceFlash]',
  standalone: true,
})
export class PriceFlashDirective implements OnChanges {
  @Input() appPriceFlash: number | undefined;
  @Input() previousPrice: number | undefined;

  private readonly flashDuration = 1000; // 1 second

  constructor(
    private readonly el: ElementRef,
    private readonly renderer: Renderer2
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Only animate if price has changed and we have both current and previous prices
    if (changes['appPriceFlash'] && this.appPriceFlash !== undefined && this.previousPrice !== undefined) {
      const currentPrice = this.appPriceFlash;
      const prevPrice = this.previousPrice;

      // Skip animation on first load (when previous === current)
      if (prevPrice === currentPrice) {
        return;
      }

      // Determine flash color based on price change
      const isIncrease = currentPrice > prevPrice;
      const flashClass = isIncrease ? 'price-flash-green' : 'price-flash-red';

      // Add flash animation class
      this.renderer.addClass(this.el.nativeElement, flashClass);

      // Remove class after animation completes
      setTimeout(() => {
        this.renderer.removeClass(this.el.nativeElement, flashClass);
      }, this.flashDuration);
    }
  }
}
