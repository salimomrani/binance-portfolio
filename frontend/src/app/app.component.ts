import { Component } from '@angular/core';
import { NgClass, NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly title = 'Crypto Portfolio Dashboard';

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

  readonly mobileBadges = [
    { label: 'Syncing', color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Live', color: 'text-profit', bg: 'bg-profit/10' }
  ];

  readonly userInitials = 'CP';
}
