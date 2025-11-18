# Crypto Portfolio Dashboard - Frontend

Angular-based frontend application for the Crypto Portfolio Dashboard, providing an intuitive interface for tracking cryptocurrency investments and market trends.

## Overview

This frontend application is built with Angular 19+ and follows modern Angular best practices including:
- Standalone components
- Signal-based inputs and outputs
- OnPush change detection strategy
- NgRx for state management
- TailwindCSS for styling

## Tech Stack

- **Framework**: Angular 19.2+
- **Language**: TypeScript 5.7+
- **State Management**: NgRx 19.2+ (@ngrx/store, @ngrx/effects)
- **Styling**: Tailwind CSS 3.4+
- **Charts**: Chart.js 4.5+
- **HTTP Client**: Angular HttpClient with RxJS 7+
- **Testing**: Jasmine 5.1+ & Karma 6.4+

## Project Structure

```
frontend/src/
├── app/
│   ├── core/                  # Singleton services, guards, interceptors
│   │   ├── services/          # Global services (api, error, notification)
│   │   └── interceptors/      # HTTP interceptors
│   ├── shared/                # Shared components, pipes, directives
│   │   ├── components/        # Reusable UI components
│   │   ├── models/            # TypeScript interfaces
│   │   └── pipes/             # Custom pipes
│   └── features/              # Feature modules
│       ├── portfolio/         # Portfolio management feature
│       ├── holdings/          # Holdings management feature
│       ├── market-trends/     # Market data and trends feature
│       └── watchlist/         # Watchlist feature
├── assets/                    # Static assets
└── environments/              # Environment configurations
```

## Setup Instructions

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The application will be available at `http://localhost:4200/`

### Environment Configuration

Create environment files in `src/environments/`:

**environment.ts** (Development):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  refreshInterval: 60000, // 60 seconds
};
```

**environment.prod.ts** (Production):
```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
  refreshInterval: 60000,
};
```

## Component Architecture

### Standalone Components

All components use Angular's standalone API:

```typescript
@Component({
  selector: 'app-portfolio-dashboard',
  standalone: true,
  imports: [CommonModule, PortfolioTableComponent, /* ... */],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './portfolio-dashboard.component.html',
})
export class PortfolioDashboardComponent {
  // Use inject() for dependency injection
  private readonly portfolioService = inject(PortfolioService);

  // Use signal-based inputs
  portfolioId = input.required<string>();

  // Use signal-based outputs
  portfolioSelected = output<Portfolio>();

  // Use computed() for derived state
  totalValue = computed(() => this.calculateTotal());
}
```

### State Management

NgRx is used for global state management:

```typescript
// State structure
interface AppState {
  portfolio: PortfolioState;
  holdings: HoldingsState;
  marketTrends: MarketTrendsState;
  watchlist: WatchlistState;
}

// Feature state
interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
}
```

### Facade Pattern

Services use the facade pattern to abstract store complexity:

```typescript
@Injectable({ providedIn: 'root' })
export class PortfolioFacadeService {
  // Selectors exposed as observables
  portfolios$ = this.store.select(selectAllPortfolios);
  selectedPortfolio$ = this.store.select(selectSelectedPortfolio);
  loading$ = this.store.select(selectPortfolioLoading);

  // Actions exposed as methods
  loadPortfolios(): void {
    this.store.dispatch(PortfolioActions.loadPortfolios());
  }

  selectPortfolio(id: string): void {
    this.store.dispatch(PortfolioActions.selectPortfolio({ id }));
  }
}
```

## Available Scripts

### Development

```bash
# Start development server
npm start
# or
ng serve

# Start with custom port
ng serve --port 4300

# Start and open browser
ng serve --open
```

### Building

```bash
# Build for production
npm run build

# Build with configuration
ng build --configuration production

# Build and watch for changes
npm run watch
```

### Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
ng test --code-coverage

# Run tests in headless mode (CI)
ng test --browsers=ChromeHeadless --watch=false
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## Features

### Portfolio Dashboard
- View all cryptocurrency holdings
- Real-time price updates every 60 seconds
- Sortable table with customizable columns
- Portfolio summary with total value and allocation

### Gains & Losses Tracking
- Color-coded gain/loss indicators (green for profit, red for loss)
- Percentage and dollar amount displays
- Best/worst performer tracking
- Transaction history view

### Interactive Charts
- Pie chart for portfolio allocation
- Line chart for performance trends over time
- Timeframe selector (24h, 7d, 30d, 1y)
- Responsive and mobile-friendly

### Market Trends
- Cryptocurrency price data from Binance/CoinGecko
- 24h price change indicators
- Volume and market cap displays
- Top gainers/losers lists

### Watchlist
- Monitor cryptocurrencies without owning them
- Add/remove from watchlist
- Real-time price updates
- Quick navigation to detailed views

## Styling with TailwindCSS

The application uses Tailwind CSS with custom configuration:

### Custom Theme Colors

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        profit: '#10b981',  // Green for gains
        loss: '#ef4444',    // Red for losses
        neutral: '#6b7280', // Gray for neutral
      },
    },
  },
};
```

### Responsive Design

All components are mobile-first and responsive:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## Testing

### Unit Tests

Component tests use Jasmine:

```typescript
describe('PortfolioDashboardComponent', () => {
  it('should display portfolio holdings', () => {
    // Arrange
    const mockPortfolio = { /* ... */ };

    // Act
    component.portfolio.set(mockPortfolio);
    fixture.detectChanges();

    // Assert
    expect(/* ... */).toBeTruthy();
  });
});
```

### Coverage Requirements

- Overall: >80%
- Components: >80%
- Services: >90%
- Pipes: >95%

## Performance Optimization

### OnPush Change Detection

All components use `ChangeDetectionStrategy.OnPush` for better performance.

### Lazy Loading

Features are lazy-loaded:

```typescript
export const routes: Routes = [
  {
    path: 'portfolio',
    loadChildren: () => import('./features/portfolio/portfolio.routes')
  },
  {
    path: 'market',
    loadChildren: () => import('./features/market-trends/market-trends.routes')
  },
];
```

### Bundle Optimization

- Tree-shaking enabled
- Chart.js loaded selectively (only needed chart types)
- Images optimized and lazy-loaded

## Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus management in modals/dialogs
- Screen reader friendly

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
ng serve --port 4300
```

**Memory issues during build:**
```bash
node --max_old_space_size=4096 node_modules/@angular/cli/bin/ng build
```

**Module not found errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Contributing

### Code Style

- Follow Angular style guide
- Use Prettier for code formatting
- All components must be standalone
- Use signals for reactive state
- Prefer OnPush change detection

### Git Workflow

1. Create feature branch
2. Make changes
3. Run tests and linting
4. Submit pull request

## Resources

- [Angular Documentation](https://angular.dev)
- [NgRx Documentation](https://ngrx.io)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [Chart.js Documentation](https://www.chartjs.org)

## Support

For issues and questions:
1. Check existing GitHub issues
2. Review documentation
3. Create new issue if needed

---

**Version**: 1.0.0
**Angular**: 19.2.0
**License**: MIT
