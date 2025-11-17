# Research: Crypto Portfolio Dashboard

**Feature**: 001-crypto-portfolio-dashboard
**Date**: 2025-11-17
**Status**: Complete

## Overview

This document consolidates technical research decisions for implementing a secure, modern cryptocurrency portfolio tracking application. All decisions align with the project constitution's security-first, type-safe, and modular architecture principles.

## Backend Technology Stack

### Decision: Express.js + TypeScript + Prisma + PostgreSQL

**Rationale**:
- **Express.js**: Industry-standard Node.js framework with extensive middleware ecosystem for security (Helmet), rate limiting, and CORS
- **TypeScript 5.3+**: Enforces type safety across the entire backend, catches errors at compile-time
- **Prisma ORM**: Type-safe database access with excellent TypeScript integration, automatic migrations, and built-in connection pooling
- **PostgreSQL**: ACID-compliant relational database with excellent support for complex queries, JSON data types for flexible price history storage, and proven scalability

**Alternatives Considered**:
- NestJS: More opinionated but adds complexity; Express provides sufficient structure with modular design
- MongoDB: NoSQL flexibility not needed; relational model better for portfolio relationships and transactions
- TypeORM: Less type-safe than Prisma; Prisma Client provides superior DX and auto-completion

**Best Practices**:
- Use Zod for runtime validation of API inputs and external API responses
- Implement repository pattern through Prisma Client for testability
- Use environment-based configuration with dotenv-safe to enforce required env vars
- Apply Decimal.js for all monetary calculations to avoid floating-point precision errors

### Decision: Binance API as Primary Market Data Source

**Rationale**:
- **Official Binance API**: Free tier with 1200 requests/minute, real-time WebSocket support, comprehensive cryptocurrency coverage
- **Reliable Data**: Direct from one of the world's largest exchanges
- **Well-Documented**: Official Node.js SDK available, extensive documentation
- **Fallback Strategy**: CoinGecko API as secondary source (3

00 calls/month free tier)

**Alternatives Considered**:
- CoinMarketCap API: Lower free tier (333 calls/day)
- CoinGecko API: Good for supplementary data but rate limits more restrictive (50 calls/minute)

**Implementation Pattern**:
```typescript
// Adapter pattern for multiple data sources
interface MarketDataAdapter {
  getCurrentPrice(symbol: string): Promise<CryptoPrice>;
  getHistoricalPrices(symbol: string, timeframe: string): Promise<PriceHistory[]>;
  getMultiplePrices(symbols: string[]): Promise<Map<string, CryptoPrice>>;
}

class BinanceAdapter implements MarketDataAdapter { /* ... */ }
class CoinGeckoAdapter implements MarketDataAdapter { /* ... */ }
```

**Best Practices**:
- Cache API responses with TTL (60 seconds for prices, 5 minutes for historical data)
- Implement exponential backoff retry logic (initial delay 1s, max 3 retries)
- Rate limiting: Track requests per minute, queue when approaching limits
- Graceful degradation: Fall back to CoinGecko if Binance unavailable
- Store last successful prices in database for offline fallback display

## Frontend Technology Stack

### Decision: Angular 19 + Standalone Components + NgRx + Signals

**Rationale**:
- **Angular 19**: Latest version with improved performance, standalone components as default, built-in Signal support
- **Standalone Components**: Modern Angular approach, eliminates NgModules boilerplate, better tree-shaking
- **NgRx 18+**: Redux pattern for predictable state management, excellent DevTools, time-travel debugging
- **Angular Signals**: Reactive primitives for fine-grained reactivity, optimal change detection
- **Feature Stores**: Modular state management, lazy-loaded with routes

**Alternatives Considered**:
- React + Redux: Less opinionated structure, Angular's CLI and tooling provide better DX
- Vue.js + Pinia: Smaller learning curve but less enterprise adoption
- Component Store (NgRx): Good for local state but feature stores better for cross-component communication

**Architecture Pattern**:
```typescript
// Feature store with signals
@Injectable()
export class PortfolioStore {
  // State as signals
  private state = signal<PortfolioState>(initialState);

  // Selectors
  readonly portfolios = computed(() => this.state().portfolios);
  readonly loading = computed(() => this.state().loading);
  readonly totalValue = computed(() =>
    this.portfolios().reduce((sum, p) => sum + p.value, 0)
  );

  // Actions
  async loadPortfolio() {
    this.state.update(s => ({ ...s, loading: true }));
    const data = await this.api.getPortfolio();
    this.state.update(s => ({ ...s, portfolios: data, loading: false }));
  }
}
```

**Best Practices**:
- Use OnPush change detection strategy for all components
- Implement facade services to abstract NgRx complexity from components
- Leverage Angular Signals for local component state
- Use feature stores for cross-component shared state
- Lazy load feature modules with routes for optimal initial bundle size

### Decision: TailwindCSS for Styling

**Rationale**:
- **Utility-First**: Rapid development with pre-built utility classes
- **Responsive by Default**: Mobile-first approach aligns with requirements
- **Small Bundle**: PurgeCSS removes unused styles in production
- **Design Consistency**: Design tokens enforce consistent spacing, colors, typography
- **Animation Support**: Built-in transition and animation utilities

**Alternatives Considered**:
- Material Design (Angular Material): More opinionated, heavier bundle, harder to customize
- Bootstrap: Less modern, utility-first approach more maintainable
- Styled Components: CSS-in-JS adds complexity, TailwindCSS + SCSS sufficient

**Best Practices**:
```scss
// Design tokens in Tailwind config
module.exports = {
  theme: {
    extend: {
      colors: {
        profit: { DEFAULT: '#10b981', light: '#34d399', dark: '#059669' },
        loss: { DEFAULT: '#ef4444', light: '#f87171', dark: '#dc2626' },
        neutral: { DEFAULT: '#6b7280', light: '#9ca3af', dark: '#4b5563' }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out'
      }
    }
  }
}
```

- Use @apply directive for reusable component styles
- Implement dark mode with Tailwind's dark: prefix
- Create custom animations for value changes (green pulse up, red pulse down)
- Use transition utilities for smooth view switching

## Database & Local Development

### Decision: Docker Compose for PostgreSQL in Development

**Rationale**:
- **Consistent Environment**: All developers use identical PostgreSQL version and configuration
- **Quick Setup**: Single command to start database (`docker-compose up`)
- **Isolated**: Database runs in container, doesn't interfere with system PostgreSQL
- **Easy Reset**: Simple to wipe and recreate database for testing
- **Production Parity**: Match production database version exactly

**Docker Compose Configuration**:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: crypto-portfolio-db
    environment:
      POSTGRES_USER: crypto_user
      POSTGRES_PASSWORD: crypto_password_dev
      POSTGRES_DB: crypto_portfolio_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/prisma/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U crypto_user -d crypto_portfolio_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: crypto-portfolio-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**Environment Configuration**:
```env
# Development .env (with Docker)
DATABASE_URL="postgresql://crypto_user:crypto_password_dev@localhost:5432/crypto_portfolio_dev"
REDIS_URL="redis://localhost:6379"

# Production .env (managed service)
DATABASE_URL="postgresql://user:password@prod-db.amazonaws.com:5432/crypto_portfolio"
REDIS_URL="redis://prod-redis.cloud.com:6379"
```

**Best Practices**:
- Use Alpine images for smaller size
- Define health checks for reliability
- Use named volumes for data persistence
- Separate dev/prod configurations
- Include Redis cache in Docker Compose
- Document in README and quickstart.md

**Development Workflow**:
```bash
# Start database and cache
docker-compose up -d

# Check services are healthy
docker-compose ps

# View logs
docker-compose logs -f postgres

# Stop services
docker-compose down

# Reset database (delete all data)
docker-compose down -v
docker-compose up -d
```

**Alternatives Considered**:
- Local PostgreSQL installation: Inconsistent versions across team, harder setup
- SQLite for dev: Different features than production PostgreSQL, not recommended
- Cloud dev database: Requires internet, slower, costs money

## Security Implementation

### Decision: Multi-Layer Security Approach

**Layer 1: API Key Management**
```typescript
// Backend only - never exposed to frontend
const config = {
  binanceApiKey: process.env.BINANCE_API_KEY!,
  binanceSecretKey: process.env.BINANCE_SECRET_KEY!,
  // Keys with read-only permissions only
};

// Frontend environment (no secrets)
export const environment = {
  apiUrl: 'https://api.yourapp.com',
  // NO API KEYS HERE
};
```

**Layer 2: Input Validation**
```typescript
// Zod schemas for all inputs
const AddHoldingSchema = z.object({
  symbol: z.string().min(1).max(10).regex(/^[A-Z]+$/),
  quantity: z.number().positive().max(1000000000),
  purchasePrice: z.number().positive(),
  purchaseDate: z.date().max(new Date())
});

// Middleware validation
app.post('/holdings', validate(AddHoldingSchema), holdingsController.create);
```

**Layer 3: Rate Limiting**
```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);
```

**Layer 4: Security Headers**
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));
```

**Best Practices**:
- Store API keys in environment variables with .env.example template
- Use read-only API keys (no trading/withdrawal permissions)
- Implement CORS with whitelist of allowed origins
- Sanitize all user inputs before database queries
- Use parameterized queries (Prisma handles this automatically)
- Implement JWT authentication for future user accounts
- Regular dependency audits with npm audit
- HTTPS enforcement in production (redirect HTTP to HTTPS)

## Database Schema Design

### Decision: Relational Model with Prisma

**Core Entities**:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  portfolios Portfolio[]
  watchlists WatchlistItem[]
}

model Portfolio {
  id        String   @id @default(uuid())
  userId    String
  name      String   @default("My Portfolio")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  holdings Holding[]

  @@index([userId])
}

model Holding {
  id            String   @id @default(uuid())
  portfolioId   String
  symbol        String   // BTC, ETH, etc.
  name          String   // Bitcoin, Ethereum
  quantity      Decimal  @db.Decimal(20, 8)  // 8 decimal precision
  averageCost   Decimal  @db.Decimal(20, 8)  // USD per unit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  portfolio     Portfolio     @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  transactions  Transaction[]

  @@index([portfolioId])
  @@index([symbol])
}

model Transaction {
  id            String   @id @default(uuid())
  holdingId     String
  type          TransactionType  // BUY, SELL
  quantity      Decimal  @db.Decimal(20, 8)
  pricePerUnit  Decimal  @db.Decimal(20, 8)
  totalCost     Decimal  @db.Decimal(20, 8)
  date          DateTime
  createdAt     DateTime @default(now())

  holding       Holding  @relation(fields: [holdingId], references: [id], onDelete: Cascade)

  @@index([holdingId])
  @@index([date])
}

enum TransactionType {
  BUY
  SELL
}

model WatchlistItem {
  id        String   @id @default(uuid())
  userId    String
  symbol    String
  name      String
  addedAt   DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, symbol])
  @@index([userId])
}

model PriceCache {
  id          String   @id @default(uuid())
  symbol      String   @unique
  price       Decimal  @db.Decimal(20, 8)
  change24h   Decimal  @db.Decimal(10, 4)  // Percentage
  volume24h   Decimal  @db.Decimal(20, 2)
  marketCap   Decimal  @db.Decimal(20, 2)
  lastUpdated DateTime

  @@index([symbol])
  @@index([lastUpdated])
}
```

**Rationale**:
- **Decimal Type**: Prevents floating-point errors for cryptocurrency amounts
- **Cascading Deletes**: Maintain referential integrity
- **Indexes**: Optimize frequent queries (user portfolios, symbol lookups)
- **Transaction History**: Enable average cost calculation and portfolio history
- **Price Cache**: Reduce API calls, provide fallback data

**Best Practices**:
- Use UUIDs for all primary keys (better for distributed systems)
- Implement soft deletes for auditing if needed
- Add timestamps (createdAt, updatedAt) to all models
- Use Prisma migrations for schema versioning
- Seed database with popular cryptocurrencies for development

## Calculations & Business Logic

### Decision: Average Cost Basis Method

**Implementation**:
```typescript
export class CalculationsService {
  /**
   * Calculate average cost basis using weighted average
   * Formula: Sum(quantity * price) / Sum(quantity)
   */
  calculateAverageCost(transactions: Transaction[]): Decimal {
    const buyTransactions = transactions.filter(t => t.type === 'BUY');

    const totalCost = buyTransactions.reduce(
      (sum, t) => sum.plus(t.quantity.times(t.pricePerUnit)),
      new Decimal(0)
    );

    const totalQuantity = buyTransactions.reduce(
      (sum, t) => sum.plus(t.quantity),
      new Decimal(0)
    );

    return totalCost.dividedBy(totalQuantity);
  }

  /**
   * Calculate gain/loss for a holding
   * Returns: { amount: Decimal, percentage: Decimal }
   */
  calculateGainLoss(
    quantity: Decimal,
    averageCost: Decimal,
    currentPrice: Decimal
  ) {
    const currentValue = quantity.times(currentPrice);
    const costBasis = quantity.times(averageCost);
    const gainLossAmount = currentValue.minus(costBasis);
    const gainLossPercentage = gainLossAmount
      .dividedBy(costBasis)
      .times(100);

    return {
      amount: gainLossAmount,
      percentage: gainLossPercentage,
      isProfit: gainLossAmount.greaterThan(0)
    };
  }

  /**
   * Calculate portfolio allocation percentages
   */
  calculateAllocation(holdings: Holding[], currentPrices: Map<string, Decimal>) {
    const totalValue = holdings.reduce((sum, h) => {
      const price = currentPrices.get(h.symbol) || new Decimal(0);
      return sum.plus(h.quantity.times(price));
    }, new Decimal(0));

    return holdings.map(h => {
      const price = currentPrices.get(h.symbol) || new Decimal(0);
      const value = h.quantity.times(price);
      const percentage = value.dividedBy(totalValue).times(100);

      return {
        symbol: h.symbol,
        value,
        percentage: percentage.toDecimalPlaces(2)
      };
    });
  }
}
```

**Best Practices**:
- Use Decimal.js for all monetary calculations
- Round percentages to 2-4 decimal places for display
- Handle edge cases (zero quantity, missing prices)
- Cache calculated values to avoid recalculation
- Unit test all calculation functions with realistic data

## Real-Time Data Updates

### Decision: Polling with Smart Refresh

**Implementation Strategy**:
```typescript
// Frontend service
@Injectable()
export class PriceUpdateService {
  private readonly REFRESH_INTERVAL = 60000; // 60 seconds
  private updateSubscription?: Subscription;

  startPriceUpdates(symbols: string[]) {
    this.updateSubscription = interval(this.REFRESH_INTERVAL)
      .pipe(
        switchMap(() => this.api.getCurrentPrices(symbols)),
        catchError(error => {
          console.error('Price update failed:', error);
          return of(null); // Continue polling even on error
        })
      )
      .subscribe(prices => {
        if (prices) {
          this.store.updatePrices(prices);
        }
      });
  }

  stopPriceUpdates() {
    this.updateSubscription?.unsubscribe();
  }
}
```

**Rationale**:
- **Polling vs WebSocket**: Simpler implementation, easier error handling, sufficient for 60s updates
- **Smart Refresh**: Only fetch prices for visible cryptocurrencies
- **Error Resilience**: Continue polling even if one request fails
- **Resource Efficiency**: Stop polling when user navigates away

**Future Enhancement**:
- Implement WebSocket for < 5s updates if needed
- Use Server-Sent Events (SSE) as middle ground

**Best Practices**:
- Unsubscribe from intervals in component ngOnDestroy
- Batch price requests (request multiple symbols in one API call)
- Show last update timestamp to users
- Implement visual indicators for stale data (> 2 minutes old)
- Use RxJS operators for efficient stream management

## Chart Visualization

### Decision: Chart.js with Angular Integration

**Rationale**:
- **Chart.js**: Lightweight, highly customizable, excellent documentation
- **ng-chartjs**: Angular wrapper for Chart.js with TypeScript support
- **Responsive**: Built-in responsive design
- **Performance**: Canvas-based rendering for smooth animations

**Alternatives Considered**:
- D3.js: More powerful but steeper learning curve, overkill for basic charts
- Highcharts: Commercial license required for production
- Recharts: React-specific

**Chart Types**:
```typescript
// Pie Chart - Portfolio Allocation
{
  type: 'doughnut',
  data: {
    labels: ['BTC', 'ETH', 'ADA'],
    datasets: [{
      data: [45, 30, 25], // Percentages
      backgroundColor: ['#F7931A', '#627EEA', '#0033AD']
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed}% ($${value})`
        }
      }
    }
  }
}

// Line Chart - Price Trends
{
  type: 'line',
  data: {
    labels: timestamps, // Time axis
    datasets: [{
      label: 'BTC Price',
      data: prices,
      borderColor: '#F7931A',
      tension: 0.4, // Smooth curves
      fill: true,
      backgroundColor: 'rgba(247, 147, 26, 0.1)'
    }]
  },
  options: {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: {
        ticks: {
          callback: (value) => `$${value.toLocaleString()}`
        }
      }
    }
  }
}
```

**Best Practices**:
- Lazy load Chart.js only when chart components are visible
- Use web workers for data transformation if datasets > 1000 points
- Implement chart animations for value changes
- Provide accessible alternative (data table view)
- Cache chart configurations for performance

## Testing Strategy

### Backend Testing

**Unit Tests (Jest)**:
```typescript
describe('CalculationsService', () => {
  let service: CalculationsService;

  beforeEach(() => {
    service = new CalculationsService();
  });

  it('should calculate average cost correctly', () => {
    const transactions = [
      { type: 'BUY', quantity: new Decimal(1), pricePerUnit: new Decimal(30000) },
      { type: 'BUY', quantity: new Decimal(2), pricePerUnit: new Decimal(40000) }
    ];

    const avgCost = service.calculateAverageCost(transactions);

    // (1*30000 + 2*40000) / (1+2) = 110000 / 3 = 36666.67
    expect(avgCost.toNumber()).toBeCloseTo(36666.67, 2);
  });
});
```

**Integration Tests (Supertest)**:
```typescript
describe('Portfolio API', () => {
  it('GET /api/portfolio should return user portfolio', async () => {
    const response = await request(app)
      .get('/api/portfolio')
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      portfolios: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          holdings: expect.any(Array)
        })
      ])
    });
  });
});
```

### Frontend Testing

**Component Tests (Jest + Testing Library)**:
```typescript
describe('PortfolioDashboardComponent', () => {
  it('should display portfolio holdings', async () => {
    const mockPortfolio = {
      holdings: [
        { symbol: 'BTC', quantity: 1.5, value: 45000 }
      ]
    };

    component.portfolio.set(mockPortfolio);
    fixture.detectChanges();

    const table = screen.getByRole('table');
    expect(within(table).getByText('BTC')).toBeInTheDocument();
    expect(within(table).getByText('1.5')).toBeInTheDocument();
  });
});
```

**Best Practices**:
- 80%+ code coverage for business logic
- Mock external APIs (Binance, CoinGecko)
- Test error handling paths
- Use realistic test data (actual crypto price ranges)
- Snapshot tests for component rendering
- E2E tests for critical user flows (Playwright or Cypress)

## Performance Optimization

### Backend Optimizations
- **Database**: Index frequently queried fields (userId, symbol, dates)
- **Caching**: Redis for API responses (TTL: 60s for prices, 5min for historical)
- **Query Optimization**: Use Prisma's `select` to fetch only needed fields
- **Pagination**: Limit 50 holdings per page
- **Compression**: Gzip middleware for API responses

### Frontend Optimizations
- **Code Splitting**: Lazy load feature modules with Angular router
- **Change Detection**: OnPush strategy + Signals
- **Virtual Scrolling**: CDK Virtual Scroll for large watchlists (> 100 items)
- **Image Optimization**: WebP format for crypto logos, lazy loading
- **Bundle Optimization**: AOT compilation, tree-shaking, minification

**Performance Targets**:
- Initial page load: < 3 seconds (measured with Lighthouse)
- API response time: < 200ms (p95)
- Chart rendering: < 2 seconds for 1 year of data
- Smooth animations: 60 FPS (no jank)

## Deployment Architecture

### Recommended Setup

**Backend**:
- Platform: AWS Elastic Beanstalk, Heroku, or Railway
- Database: AWS RDS PostgreSQL or Heroku Postgres
- Caching: Redis Cloud or AWS ElastiCache
- CI/CD: GitHub Actions with automated tests

**Frontend**:
- Platform: Vercel, Netlify, or AWS S3 + CloudFront
- CDN: CloudFlare for static assets
- CI/CD: Automatic deployment on git push to main

**Environment Variables**:
```bash
# Backend .env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
BINANCE_API_KEY=...
BINANCE_SECRET_KEY=...
REDIS_URL=redis://...
CORS_ORIGIN=https://yourfrontend.com
JWT_SECRET=...

# Frontend environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourapp.com'
};
```

**Best Practices**:
- Use managed services for database and caching (easier scaling)
- Implement health check endpoints for monitoring
- Set up error tracking (Sentry or similar)
- Configure automated backups for database
- Use environment-specific configurations
- Implement blue-green deployments for zero downtime

## Conclusion

All research decisions align with the project constitution's core principles:
- ✅ Security-first with API keys server-side only
- ✅ Type safety with TypeScript + Zod + Prisma
- ✅ Modular architecture with clear separation of concerns
- ✅ Reliable API integration with caching and retry logic
- ✅ Comprehensive testing strategy
- ✅ Performance optimization at every layer
- ✅ Modern development practices (ESLint, Prettier, pre-commit hooks)

The technology stack is production-ready, well-documented, and follows industry best practices for building secure, scalable financial applications.
