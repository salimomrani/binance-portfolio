# Implementation Plan: Crypto Portfolio Dashboard

**Branch**: `001-crypto-portfolio-dashboard` | **Date**: 2025-11-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-crypto-portfolio-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

The Crypto Portfolio Dashboard is a full-stack application that enables users to track their cryptocurrency investments through an interactive dashboard. Users can view their portfolio holdings in both table and graphical formats, monitor gains/losses, track price trends across multiple timeframes, and maintain a watchlist of cryptocurrencies they don't own. The application prioritizes real-time data updates, secure API key management, and an intuitive user experience with modern animations and responsive design.

**Technical Approach**: The system is architected as two separate applications - a secure Express.js backend API with PostgreSQL database and Prisma ORM for data management, and an Angular 19+ frontend with NgRx for state management and TailwindCSS for styling. The backend integrates with cryptocurrency market data providers (Binance API, CoinGecko, or CoinMarketCap) to fetch real-time price data, while maintaining strict security with all API keys server-side. The frontend implements standalone components with Angular Signals for reactive state management and feature stores for modular architecture.

## Technical Context

**Language/Version**:
- Backend: Node.js 20+ with TypeScript 5.3+
- Frontend: Angular 19+ with TypeScript 5.3+

**Primary Dependencies**:
- Backend: Express.js 4.18+, Prisma 5.0+, Zod 3.22+, Jest 29+, Helmet, cors, express-rate-limit
- Frontend: Angular 19+, NgRx 18+, TailwindCSS 3.4+, Angular Signals, RxJS 7+, Jest 29+, ESLint 8+

**Storage**: PostgreSQL 15+ (via Prisma ORM)
- Development: Docker Compose for PostgreSQL container
- Production: Managed PostgreSQL service (AWS RDS, Heroku Postgres, etc.)

**Testing**:
- Backend: Jest with Supertest for API testing
- Frontend: Jest with Angular Testing Library

**Target Platform**:
- Backend: Node.js server (Linux/Docker)
- Frontend: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) with responsive mobile support

**Project Type**: Web application (separate backend and frontend projects)

**Performance Goals**:
- API response time: < 200ms for portfolio data retrieval
- Price updates: Within 60 seconds of market changes
- Frontend initial load: < 3 seconds
- View transitions: < 1 second
- Chart rendering: < 2 seconds
- Support 100+ cryptocurrencies without performance degradation
- Handle 1000+ concurrent users

**Constraints**:
- HTTPS only for production
- API rate limits from crypto data providers (respect 1200 req/min for Binance)
- Real-time updates without WebSocket initially (polling approach)
- Mobile-responsive design required
- Offline data unavailable (requires internet connectivity)
- 99% uptime for data retrieval services

**Scale/Scope**:
- Expected users: 1000+ concurrent users
- Portfolio size: Up to 100 different cryptocurrencies per user
- Watchlist size: Up to 50 cryptocurrencies per user
- Historical data: Minimum 1 year of price history
- Data precision: 8 decimal places for cryptocurrency quantities, 4 decimal places for percentages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Security-First Compliance ✅

- [x] **API Keys Security**: All cryptocurrency API keys stored in backend environment variables only, never exposed to frontend
- [x] **No Plain Text Secrets**: .env files with .env.example template, secrets in environment variables
- [x] **Backend-Only API Communication**: Frontend communicates only with backend API, backend handles all external API calls
- [x] **Rate Limiting**: Express-rate-limit middleware implemented on all API endpoints
- [x] **Input Validation**: Zod schemas validate all API inputs and user data
- [x] **HTTPS Only**: Production deployment enforces HTTPS

### Type Safety & Data Validation ✅

- [x] **TypeScript Strict Mode**: Enabled in both frontend (tsconfig.json) and backend
- [x] **API Response Validation**: Zod schemas validate all external API responses (Binance, CoinGecko)
- [x] **No Any Types**: Strict typing enforced, `any` prohibited except with justification comments
- [x] **Decimal Precision**: Decimal.js library for monetary calculations to avoid floating-point errors
- [x] **Clear Data Models**: Prisma schema defines all database models, TypeScript interfaces for DTOs

### Modular Architecture ✅

- [x] **Clear Separation**: Frontend (Angular modules) / Backend (Express routes) / Services (business logic)
- [x] **Single Responsibility**: Each module/component has one clear purpose
- [x] **Isolated API Layer**: Backend services layer separates external API integration from business logic
- [x] **Reusable Components**: Angular standalone components for charts, tables, cards
- [x] **Service Layer**: Portfolio calculation service, PnL service, statistics service

### API Integration Reliability ✅

- [x] **Graceful Failure Handling**: Try-catch blocks with user-friendly error messages
- [x] **Exponential Backoff**: Retry logic with exponential backoff for failed API calls
- [x] **Caching Strategy**: Redis or in-memory cache for API responses with TTL
- [x] **Error Handling**: Custom error classes and consistent error response format
- [x] **Mock API Responses**: Jest mocks for development and testing

### Testing Strategy ✅

- [x] **Unit Tests**: Business logic (gain/loss calculations, average cost basis)
- [x] **Integration Tests**: API endpoints and database interactions
- [x] **Component Tests**: Critical UI components (portfolio table, charts)
- [x] **E2E Tests**: Main user flows (view portfolio, add to watchlist)
- [x] **Realistic Mock Data**: Historical crypto price data for testing

### Performance & Real-Time Updates ✅

- [x] **Real-Time Updates**: Polling mechanism (60-second intervals) for price updates
- [x] **Pagination**: Backend pagination for large portfolios
- [x] **Lazy Loading**: Angular lazy-loaded feature modules
- [x] **Optimized Re-renders**: Angular Signals and OnPush change detection strategy
- [x] **Background Refresh**: Price updates without blocking UI interactions

### Observability & User Experience ✅

- [x] **Structured Logging**: Winston logger for all API calls and errors
- [x] **Loading States**: Loading indicators for all async operations
- [x] **Error Boundaries**: Angular error handlers for graceful error display
- [x] **User Feedback**: Toast notifications for success/error messages
- [x] **Responsive Design**: TailwindCSS mobile-first responsive design

### Additional Compliance

- [x] **Code Quality**: ESLint + Prettier with pre-commit hooks
- [x] **Documentation**: README, API documentation, environment variables in .env.example
- [x] **Separate Environments**: Development, staging, production configurations

**Constitution Check Status**: ✅ ALL REQUIREMENTS MET

No violations detected. The architecture fully complies with all constitutional principles.

## Project Structure

### Documentation (this feature)

```text
specs/001-crypto-portfolio-dashboard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── openapi.yaml     # Backend API specification
│   └── api-client.ts    # Frontend API client types
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/              # Configuration (env, constants)
│   │   ├── env.config.ts
│   │   └── database.config.ts
│   ├── modules/
│   │   ├── portfolio/       # Portfolio module
│   │   │   ├── portfolio.controller.ts
│   │   │   ├── portfolio.service.ts
│   │   │   ├── portfolio.validation.ts
│   │   │   └── portfolio.types.ts
│   │   ├── holdings/        # Holdings module
│   │   │   ├── holdings.controller.ts
│   │   │   ├── holdings.service.ts
│   │   │   ├── holdings.validation.ts
│   │   │   └── holdings.types.ts
│   │   ├── watchlist/       # Watchlist module
│   │   │   ├── watchlist.controller.ts
│   │   │   ├── watchlist.service.ts
│   │   │   ├── watchlist.validation.ts
│   │   │   └── watchlist.types.ts
│   │   ├── market-data/     # Market data integration
│   │   │   ├── market-data.service.ts
│   │   │   ├── binance.adapter.ts
│   │   │   ├── coingecko.adapter.ts
│   │   │   ├── market-data.cache.ts
│   │   │   └── market-data.types.ts
│   │   └── auth/            # Authentication (future)
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       └── auth.middleware.ts
│   ├── shared/
│   │   ├── services/        # Shared services
│   │   │   ├── calculations.service.ts  # Gain/loss, averages
│   │   │   ├── logger.service.ts        # Winston logger
│   │   │   └── cache.service.ts         # Caching layer
│   │   ├── middleware/      # Express middleware
│   │   │   ├── error-handler.ts
│   │   │   ├── rate-limiter.ts
│   │   │   ├── validator.ts
│   │   │   └── security.ts
│   │   ├── utils/           # Utility functions
│   │   │   ├── decimal.util.ts
│   │   │   ├── retry.util.ts
│   │   │   └── date.util.ts
│   │   └── types/           # Shared types
│   │       ├── api-response.ts
│   │       ├── error.types.ts
│   │       └── pagination.types.ts
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Database migrations
│   │   └── seed.ts          # Seed data
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
├── tests/
│   ├── unit/                # Unit tests
│   │   ├── services/
│   │   └── utils/
│   ├── integration/         # Integration tests
│   │   ├── portfolio.test.ts
│   │   ├── holdings.test.ts
│   │   └── watchlist.test.ts
│   └── mocks/               # Mock data
│       ├── crypto-prices.mock.ts
│       └── portfolio.mock.ts
├── .env.example             # Environment variables template
├── .eslintrc.json           # ESLint configuration
├── .prettierrc              # Prettier configuration
├── jest.config.js           # Jest configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies

frontend/
├── src/
│   ├── app/
│   │   ├── core/            # Core module (singleton services)
│   │   │   ├── services/
│   │   │   │   ├── api.service.ts        # HTTP client wrapper
│   │   │   │   ├── error.service.ts      # Error handling
│   │   │   │   └── notification.service.ts # Toast notifications
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts
│   │   │   │   ├── error.interceptor.ts
│   │   │   │   └── loading.interceptor.ts
│   │   │   └── guards/
│   │   │       └── auth.guard.ts
│   │   ├── features/        # Feature modules (lazy-loaded)
│   │   │   ├── portfolio/   # Portfolio feature
│   │   │   │   ├── components/
│   │   │   │   │   ├── portfolio-dashboard/
│   │   │   │   │   │   ├── portfolio-dashboard.component.ts
│   │   │   │   │   │   ├── portfolio-dashboard.component.html
│   │   │   │   │   │   ├── portfolio-dashboard.component.scss
│   │   │   │   │   │   └── portfolio-dashboard.component.spec.ts
│   │   │   │   │   ├── portfolio-table/
│   │   │   │   │   │   └── [component files]
│   │   │   │   │   ├── portfolio-charts/
│   │   │   │   │   │   ├── pie-chart/
│   │   │   │   │   │   └── line-chart/
│   │   │   │   │   └── portfolio-summary/
│   │   │   │   ├── store/   # NgRx feature store
│   │   │   │   │   ├── portfolio.actions.ts
│   │   │   │   │   ├── portfolio.reducer.ts
│   │   │   │   │   ├── portfolio.effects.ts
│   │   │   │   │   ├── portfolio.selectors.ts
│   │   │   │   │   └── portfolio.state.ts
│   │   │   │   ├── services/
│   │   │   │   │   ├── portfolio-api.service.ts
│   │   │   │   │   └── portfolio-facade.service.ts
│   │   │   │   └── portfolio.routes.ts
│   │   │   ├── holdings/    # Holdings feature
│   │   │   │   ├── components/
│   │   │   │   │   ├── holdings-list/
│   │   │   │   │   ├── holding-detail/
│   │   │   │   │   └── add-holding-dialog/
│   │   │   │   ├── store/
│   │   │   │   │   └── [NgRx files]
│   │   │   │   ├── services/
│   │   │   │   └── holdings.routes.ts
│   │   │   ├── watchlist/   # Watchlist feature
│   │   │   │   ├── components/
│   │   │   │   │   ├── watchlist-panel/
│   │   │   │   │   └── add-to-watchlist-dialog/
│   │   │   │   ├── store/
│   │   │   │   │   └── [NgRx files]
│   │   │   │   ├── services/
│   │   │   │   └── watchlist.routes.ts
│   │   │   └── market-trends/  # Market trends feature
│   │   │       ├── components/
│   │   │       │   ├── trend-chart/
│   │   │       │   ├── crypto-detail/
│   │   │       │   └── trend-indicators/
│   │   │       ├── store/
│   │   │       │   └── [NgRx files]
│   │   │       ├── services/
│   │   │       └── market-trends.routes.ts
│   │   ├── shared/          # Shared module
│   │   │   ├── components/  # Reusable standalone components
│   │   │   │   ├── loading-spinner/
│   │   │   │   ├── error-message/
│   │   │   │   ├── data-table/
│   │   │   │   ├── card/
│   │   │   │   └── currency-formatter/
│   │   │   ├── directives/
│   │   │   │   ├── decimal-format.directive.ts
│   │   │   │   └── animate-on-change.directive.ts
│   │   │   ├── pipes/
│   │   │   │   ├── currency-format.pipe.ts
│   │   │   │   ├── percentage-format.pipe.ts
│   │   │   │   ├── crypto-symbol.pipe.ts
│   │   │   │   └── time-ago.pipe.ts
│   │   │   ├── models/      # Shared interfaces/types
│   │   │   │   ├── portfolio.model.ts
│   │   │   │   ├── holding.model.ts
│   │   │   │   ├── crypto.model.ts
│   │   │   │   └── api-response.model.ts
│   │   │   └── utils/
│   │   │       ├── calculations.util.ts
│   │   │       └── formatting.util.ts
│   │   ├── app.component.ts     # Root component
│   │   ├── app.config.ts        # Application configuration
│   │   └── app.routes.ts        # Application routes
│   ├── assets/              # Static assets
│   │   ├── images/
│   │   └── icons/
│   ├── styles/              # Global styles
│   │   ├── _variables.scss
│   │   ├── _animations.scss
│   │   └── styles.scss
│   ├── environments/
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   └── index.html
├── tests/
│   ├── components/
│   ├── services/
│   └── integration/
├── .eslintrc.json           # ESLint configuration
├── .prettierrc              # Prettier configuration
├── jest.config.js           # Jest configuration
├── tailwind.config.js       # TailwindCSS configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.app.json        # App TypeScript config
├── tsconfig.spec.json       # Test TypeScript config
└── package.json             # Dependencies
```

**Structure Decision**: Web application with separate backend and frontend projects. This separation provides:
- **Security**: API keys and sensitive logic remain server-side
- **Scalability**: Backend and frontend can scale independently
- **Technology Independence**: Each tier uses optimal technologies (Express for backend, Angular for frontend)
- **Team Organization**: Backend and frontend teams can work independently
- **Deployment Flexibility**: Deploy to different servers/services (e.g., backend on AWS Lambda, frontend on Vercel)

The backend follows a modular architecture with feature-based modules (portfolio, holdings, watchlist, market-data) and shared services. The frontend uses Angular standalone components with feature stores for state management, enabling lazy loading and optimal bundle sizes.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected - this section is not applicable.
