import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly title = 'Crypto Portfolio Dashboard';

  readonly navItems = [
    { label: 'Portfolio', path: '/portfolio', exact: true },
    { label: 'Holdings', path: '/holdings', exact: true },
    { label: 'Watchlist', path: '/watchlist', exact: true },
    { label: 'Market Trends', path: '/market', exact: true },
  ];
}
