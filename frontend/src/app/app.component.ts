import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  readonly title = 'Crypto Portfolio Dashboard';

  // Price update tracking
  private lastPriceUpdate = signal<Date | null>(null);
  private updateTimerSubscription?: Subscription;

  // Computed relative time string (e.g., "2 seconds ago", "1 minute ago")
  protected readonly lastUpdateText = computed(() => {
    const lastUpdate = this.lastPriceUpdate();
    if (!lastUpdate) {
      return 'Never';
    }

    const now = Date.now();
    const diff = Math.floor((now - lastUpdate.getTime()) / 1000); // difference in seconds

    if (diff < 60) {
      return `${diff} second${diff !== 1 ? 's' : ''} ago`;
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
      const hours = Math.floor(diff / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
  });

  protected readonly syncStatus = computed(() => {
    const lastUpdate = this.lastPriceUpdate();
    if (!lastUpdate) {
      return { label: 'Waiting for sync', color: 'text-gray-500', bg: 'bg-gray-100' };
    }

    const diff = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);

    if (diff < 90) {
      return { label: 'Live', color: 'text-profit', bg: 'bg-profit/10' };
    } else if (diff < 300) {
      return { label: 'Recent', color: 'text-primary', bg: 'bg-primary/10' };
    } else {
      return { label: 'Stale', color: 'text-amber-600', bg: 'bg-amber-50' };
    }
  });

  readonly navItems = [
    {
      label: 'Portfolio',
      path: '/portfolio',
      exact: true,
      icon: 'M4 16V8l4 4 5-7 7 9'
    },
    {
      label: 'Holdings',
      path: '/holdings',
      exact: true,
      icon: 'M5 17h14M5 12h14M5 7h14'
    },
    {
      label: 'Watchlist',
      path: '/watchlist',
      exact: true,
      icon: 'M12 4.5l2 4.06 4.5.65-3.3 3.22.78 4.47-4-2.11-4 2.11.78-4.47-3.3-3.22 4.5-.65z'
    },
    {
      label: 'Market Trends',
      path: '/market',
      exact: true,
      icon: 'M7 17V9m5 8V7m5 10V11'
    }
  ];

  readonly quickActions = [
    { label: 'Add Holding', icon: 'M12 5v14m7-7H5' },
    { label: 'New Portfolio', icon: 'M4 13h16M4 9h16m-8 8V5' }
  ];

  readonly userInitials = 'CP';

  ngOnInit(): void {
    // Simulate initial price update (in real app, this would come from price-update.service)
    this.lastPriceUpdate.set(new Date());

    // Update the relative time every second for accurate "X seconds ago" display
    this.updateTimerSubscription = interval(1000).subscribe(() => {
      // Trigger recomputation by accessing the signal
      this.lastPriceUpdate();
    });

    // Simulate periodic price updates (in real app, this would be handled by price-update.service)
    // For now, update every 60 seconds
    setInterval(() => {
      this.lastPriceUpdate.set(new Date());
    }, 60000);
  }

  ngOnDestroy(): void {
    this.updateTimerSubscription?.unsubscribe();
  }

  refreshPrices(): void {
    // Manual refresh trigger
    this.lastPriceUpdate.set(new Date());
    // In real app, would call price-update.service.refresh()
  }
}
