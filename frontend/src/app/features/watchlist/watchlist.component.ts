// T178: Standalone watchlist page component

import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { WatchlistPanelComponent } from './components/watchlist-panel/watchlist-panel.component';
import { AddToWatchlistDialogComponent } from './components/add-to-watchlist-dialog/add-to-watchlist-dialog.component';
import { WatchlistActions } from './store/watchlist.actions';
import { AddToWatchlistRequest } from '../../shared/models/watchlist.model';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, WatchlistPanelComponent, AddToWatchlistDialogComponent],
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.scss',
})
export class WatchlistComponent {
  private readonly store = inject(Store);

  // Dialog state
  protected readonly isAddToWatchlistDialogOpen = signal<boolean>(false);

  /**
   * Open add to watchlist dialog
   */
  onOpenAddToWatchlistDialog(): void {
    this.isAddToWatchlistDialogOpen.set(true);
  }

  /**
   * Close add to watchlist dialog
   */
  onCloseAddToWatchlistDialog(): void {
    this.isAddToWatchlistDialogOpen.set(false);
  }

  /**
   * Handle adding to watchlist
   */
  onAddToWatchlist(request: AddToWatchlistRequest): void {
    this.store.dispatch(WatchlistActions.addToWatchlist({ request }));
    this.isAddToWatchlistDialogOpen.set(false);
  }
}
