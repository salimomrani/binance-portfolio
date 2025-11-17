# Tasks: Crypto Portfolio Dashboard

**Input**: Design documents from `/specs/001-crypto-portfolio-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included following TDD approach as per project constitution

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below follow the structure defined in plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both backend and frontend

### Backend Setup

- [X] T001 Create backend project structure with directories: backend/src/{config,modules,shared,prisma}
- [X] T002 Initialize Node.js TypeScript project in backend/ with package.json and tsconfig.json (strict mode)
- [X] T003 [P] Install backend dependencies: Express.js 4.18+, Prisma 5.0+, Zod 3.22+, Jest 29+, TypeScript 5.3+
- [X] T004 [P] Install security dependencies: Helmet, cors, express-rate-limit, bcrypt, dotenv
- [X] T005 [P] Install utility dependencies: Decimal.js, Winston (logger), axios (HTTP client)
- [X] T006 [P] Configure ESLint and Prettier in backend/.eslintrc.json and backend/.prettierrc
- [X] T007 [P] Create backend/.env.example based on specs/001-crypto-portfolio-dashboard/contracts/.env.example
- [X] T008 [P] Setup Jest configuration in backend/jest.config.js for unit and integration tests
- [X] T009 [P] Configure TypeScript tsconfig.json with strict mode, paths, and decorators

### Frontend Setup

- [X] T010 Create frontend/ directory and initialize Angular 19 project with standalone components
- [X] T011 [P] Install frontend dependencies: NgRx 18+, TailwindCSS 3.4+, RxJS 7+, Chart.js, Jest 29+
- [X] T012 [P] Configure TailwindCSS in frontend/tailwind.config.js with custom theme (profit/loss colors)
- [X] T013 [P] Configure ESLint in frontend/.eslintrc.json for Angular best practices
- [X] T014 [P] Setup Jest for Angular in frontend/jest.config.js
- [X] T015 [P] Configure frontend/tsconfig.json with strict mode and Angular compiler options
- [X] T016 [P] Create frontend/src/environments/environment.ts and environment.prod.ts
- [X] T017 [P] Setup Angular standalone app structure in frontend/src/app/app.config.ts

### Docker & Infrastructure

- [X] T018 Verify docker-compose.yml exists at project root with PostgreSQL and Redis services
- [X] T019 [P] Create backend/prisma/schema.prisma from specs/001-crypto-portfolio-dashboard/data-model.md
- [X] T020 Test Docker services with: docker-compose up -d && docker-compose ps (verify healthy status)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & ORM

- [X] T021 Generate Prisma client: npx prisma generate
- [X] T022 Create initial Prisma migration: npx prisma migrate dev --name init
- [X] T023 [P] Create backend/src/prisma/seed.ts for sample cryptocurrency data (BTC, ETH, ADA)
- [X] T024 Test database connection in backend/src/config/database.config.ts

### Backend Core Infrastructure

- [X] T025 Create backend/src/shared/types/api-response.ts with ApiSuccess, ApiError, PaginatedResponse types
- [X] T026 [P] Create backend/src/shared/types/error.types.ts with custom error classes (ValidationError, NotFoundError)
- [X] T027 [P] Create backend/src/shared/services/logger.service.ts using Winston with file and console transports
- [X] T028 [P] Create backend/src/shared/services/cache.service.ts with Redis client and in-memory fallback
- [X] T029 [P] Create backend/src/shared/utils/decimal.util.ts with Decimal.js wrapper functions
- [X] T030 [P] Create backend/src/shared/utils/retry.util.ts with exponential backoff retry logic
- [X] T031 Create backend/src/shared/middleware/error-handler.ts for centralized error handling
- [X] T032 [P] Create backend/src/shared/middleware/rate-limiter.ts using express-rate-limit (100 req/15min)
- [X] T033 [P] Create backend/src/shared/middleware/security.ts with Helmet configuration
- [X] T034 [P] Create backend/src/shared/middleware/validator.ts for Zod schema validation
- [X] T035 Create backend/src/config/env.config.ts to load and validate environment variables with Zod

### Express App Setup

- [X] T036 Create backend/src/app.ts with Express app initialization, middleware stack, and error handlers
- [X] T037 [P] Create backend/src/server.ts as entry point with graceful shutdown handling
- [X] T038 [P] Add health check endpoint GET /health in backend/src/app.ts

### Frontend Core Infrastructure

- [X] T039 Create frontend/src/app/core/services/api.service.ts as HTTP client wrapper with interceptors
- [X] T040 [P] Create frontend/src/app/core/services/error.service.ts for global error handling
- [X] T041 [P] Create frontend/src/app/core/services/notification.service.ts for toast notifications
- [X] T042 [P] Create frontend/src/app/core/interceptors/error.interceptor.ts to catch HTTP errors
- [X] T043 [P] Create frontend/src/app/core/interceptors/loading.interceptor.ts to track loading state
- [X] T044 Create frontend/src/app/shared/models/api-response.model.ts matching backend types
- [X] T045 [P] Create frontend/src/app/shared/components/loading-spinner/ standalone component
- [X] T046 [P] Create frontend/src/app/shared/components/error-message/ standalone component
- [X] T047 [P] Create frontend/src/app/shared/pipes/currency-format.pipe.ts for USD formatting
- [X] T048 [P] Create frontend/src/app/shared/pipes/percentage-format.pipe.ts for gain/loss percentages
- [X] T049 Setup Angular routing in frontend/src/app/app.routes.ts with lazy loading for features

### Market Data Integration Foundation

- [X] T050 Create backend/src/modules/market-data/market-data.types.ts with CryptoPrice, PriceHistory interfaces
- [X] T051 [P] Create backend/src/modules/market-data/binance.adapter.ts implementing MarketDataAdapter interface
- [X] T052 [P] Create backend/src/modules/market-data/coingecko.adapter.ts as fallback adapter
- [X] T053 Create backend/src/modules/market-data/market-data.service.ts with adapter pattern and caching (60s TTL)
- [X] T054 [P] Create backend/src/modules/market-data/market-data.cache.ts using Redis for price caching

### Shared Calculations Service

- [X] T055 Create backend/src/shared/services/calculations.service.ts with methods:
  - calculateAverageCost(transactions): Decimal
  - calculateGainLoss(quantity, avgCost, currentPrice): {amount, percentage, isProfit}
  - calculateAllocation(holdings, prices): AllocationData[]

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Portfolio Holdings (Priority: P1) 🎯 MVP

**Goal**: Enable users to view their cryptocurrency portfolio in a table format with current values

**Independent Test**: Create a test portfolio with mock holdings, verify table displays correct data (symbols, quantities, current values, total)

### Backend: Portfolio & Holdings Models

- [X] T056 [P] [US1] Create User model verification in backend/src/prisma/schema.prisma (already exists from Phase 2)
- [X] T057 [P] [US1] Create Portfolio model verification in backend/src/prisma/schema.prisma
- [X] T058 [P] [US1] Create Holding model verification in backend/src/prisma/schema.prisma
- [X] T059 [P] [US1] Create Transaction model verification in backend/src/prisma/schema.prisma
- [X] T060 Run migration for User Story 1 models: npx prisma migrate dev --name add-portfolio-holdings

### Backend: Validation Schemas

- [X] T061 [P] [US1] Create backend/src/modules/portfolio/portfolio.validation.ts with Zod schemas:
  - CreatePortfolioSchema
  - UpdatePortfolioSchema
- [X] T062 [P] [US1] Create backend/src/modules/holdings/holdings.validation.ts with Zod schemas:
  - AddHoldingSchema
  - UpdateHoldingSchema

### Backend: Portfolio Service

- [X] T063 [US1] Create backend/src/modules/portfolio/portfolio.service.ts with methods:
  - createPortfolio(userId, data): Promise<Portfolio>
  - getPortfolios(userId): Promise<PortfolioSummary[]>
  - getPortfolioById(portfolioId): Promise<PortfolioDetails>
  - updatePortfolio(portfolioId, data): Promise<Portfolio>
  - deletePortfolio(portfolioId): Promise<void>
  - calculatePortfolioTotals(portfolioId, currentPrices): Promise<PortfolioStatistics>

### Backend: Holdings Service

- [X] T064 [US1] Create backend/src/modules/holdings/holdings.service.ts with methods:
  - addHolding(portfolioId, data): Promise<Holding>
  - getHoldings(portfolioId, sortBy, order): Promise<HoldingDetails[]>
  - getHoldingById(holdingId): Promise<HoldingDetails>
  - updateHolding(holdingId, data): Promise<Holding>
  - deleteHolding(holdingId): Promise<void>
  - calculateHoldingValue(holding, currentPrice): HoldingDetails

### Backend: API Controllers

- [X] T065 [US1] Create backend/src/modules/portfolio/portfolio.controller.ts with endpoints:
  - GET /api/portfolios (list user portfolios)
  - POST /api/portfolios (create portfolio)
  - GET /api/portfolios/:id (get portfolio details with holdings)
  - PATCH /api/portfolios/:id (update portfolio)
  - DELETE /api/portfolios/:id (delete portfolio)

- [X] T066 [US1] Create backend/src/modules/holdings/holdings.controller.ts with endpoints:
  - GET /api/portfolios/:portfolioId/holdings (list holdings with current prices)
  - POST /api/portfolios/:portfolioId/holdings (add holding)
  - GET /api/portfolios/:portfolioId/holdings/:id (get holding details)
  - PATCH /api/portfolios/:portfolioId/holdings/:id (update holding)
  - DELETE /api/portfolios/:portfolioId/holdings/:id (delete holding)

### Backend: Route Registration

- [X] T067 [US1] Register portfolio routes in backend/src/app.ts under /api/portfolios
- [X] T068 [US1] Register holdings routes in backend/src/app.ts under /api/portfolios/:portfolioId/holdings

### Backend: Integration Tests

- [X] T069 [P] [US1] Write integration test in backend/tests/integration/portfolio.test.ts:
  - Test GET /api/portfolios returns user portfolios
  - Test POST /api/portfolios creates new portfolio
  - Test GET /api/portfolios/:id returns portfolio with holdings
- [X] T070 [P] [US1] Write integration test in backend/tests/integration/holdings.test.ts:
  - Test GET /holdings returns holdings with current prices
  - Test POST /holdings adds new holding
  - Test holding values calculated correctly

### Frontend: Portfolio Models & Types

- [X] T071 [P] [US1] Create frontend/src/app/shared/models/portfolio.model.ts with Portfolio, Holding interfaces
- [X] T072 [P] [US1] Create frontend/src/app/features/portfolio/services/portfolio-api.service.ts for API calls

### Frontend: NgRx Store for Portfolio

- [X] T073 [US1] Create frontend/src/app/features/portfolio/store/portfolio.state.ts with PortfolioState interface
- [X] T074 [P] [US1] Create frontend/src/app/features/portfolio/store/portfolio.actions.ts with load, create, update actions
- [X] T075 [P] [US1] Create frontend/src/app/features/portfolio/store/portfolio.reducer.ts
- [X] T076 [US1] Create frontend/src/app/features/portfolio/store/portfolio.effects.ts for API integration
- [X] T077 [P] [US1] Create frontend/src/app/features/portfolio/store/portfolio.selectors.ts with memoized selectors
- [X] T078 [US1] Create frontend/src/app/features/portfolio/services/portfolio-facade.service.ts to abstract store complexity

### Frontend: Portfolio Dashboard Component

- [X] T079 [US1] Create frontend/src/app/features/portfolio/components/portfolio-dashboard/ component with:
  - portfolio-dashboard.component.ts (with signals for reactive state)
  - portfolio-dashboard.component.html
  - portfolio-dashboard.component.scss
  - portfolio-dashboard.component.spec.ts
- [X] T080 [US1] Implement portfolio selection logic in portfolio-dashboard component
- [X] T081 [US1] Add loading and error states handling in portfolio-dashboard component

### Frontend: Portfolio Table Component

- [X] T082 [US1] Create frontend/src/app/features/portfolio/components/portfolio-table/ component with:
  - portfolio-table.component.ts (OnPush change detection)
  - portfolio-table.component.html (sortable table with TailwindCSS)
  - portfolio-table.component.scss
  - portfolio-table.component.spec.ts
- [X] T083 [US1] Implement column sorting (by symbol, quantity, value) in portfolio-table component
- [X] T084 [US1] Add empty state message when no holdings exist

### Frontend: Portfolio Summary Component

- [X] T085 [US1] Create frontend/src/app/features/portfolio/components/portfolio-summary/ component showing:
  - Total portfolio value
  - Number of holdings
  - Last updated timestamp
- [X] T086 [US1] Style portfolio-summary with TailwindCSS cards and responsive grid

### Frontend: Add Holding Dialog Component

- [X] T087 [US1] Create frontend/src/app/features/holdings/components/add-holding-dialog/ component with:
  - Form with fields: symbol, name, quantity, average cost, notes
  - Zod validation matching backend schema
  - Submit handler dispatching add holding action

### Frontend: Routing

- [X] T088 [US1] Add portfolio routes in frontend/src/app/features/portfolio/portfolio.routes.ts:
  - /portfolio (dashboard)
  - /portfolio/:id (portfolio details)
- [X] T089 [US1] Lazy load portfolio feature module in frontend/src/app/app.routes.ts

### Frontend: Component Tests

- [X] T090 [P] [US1] Write component test in portfolio-dashboard.component.spec.ts verifying portfolio display
- [X] T091 [P] [US1] Write component test in portfolio-table.component.spec.ts verifying table rendering and sorting
- [X] T092 [P] [US1] Write component test in add-holding-dialog.component.spec.ts verifying form validation

**Checkpoint**: User Story 1 complete - Users can view portfolio holdings in table format

---

## Phase 4: User Story 2 - Track Gains and Losses (Priority: P1)

**Goal**: Calculate and display gain/loss for each holding and overall portfolio

**Independent Test**: Create holdings with known purchase prices, verify gain/loss calculations (both $ and %) match expected values with color coding

### Backend: Transaction Model & Service

- [X] T093 [P] [US2] Verify Transaction model in backend/src/prisma/schema.prisma
- [X] T094 [P] [US2] Create backend/src/modules/holdings/transaction.validation.ts with AddTransactionSchema
- [X] T095 [US2] Create backend/src/modules/holdings/transaction.service.ts with methods:
  - addTransaction(holdingId, data): Promise<Transaction>
  - getTransactions(holdingId, pagination): Promise<PaginatedResponse<Transaction>>
  - updateHoldingAverageCost(holdingId): Promise<void> (recalculate on new transaction)
- [X] T096 [US2] Add transaction endpoints to backend/src/modules/holdings/holdings.controller.ts:
  - GET /api/holdings/:holdingId/transactions
  - POST /api/holdings/:holdingId/transactions

### Backend: Gain/Loss Calculation Enhancement

- [X] T097 [US2] Enhance backend/src/shared/services/calculations.service.ts:
  - Add calculatePortfolioGainLoss(holdings, prices): {total, percentage}
  - Add formatGainLoss(value): {formatted, color, arrow}
- [X] T098 [US2] Update backend/src/modules/portfolio/portfolio.service.ts:
  - Include gain/loss in getPortfolioById response
  - Add getPortfolioStatistics endpoint for best/worst performers

### Backend: Portfolio Statistics Endpoint

- [X] T099 [US2] Add GET /api/portfolios/:id/statistics endpoint in portfolio.controller.ts returning:
  - Total gain/loss ($ and %)
  - Best performer (symbol, %)
  - Worst performer (symbol, %)
  - Largest holding by allocation

### Backend: Integration Tests

- [X] T100 [P] [US2] Write test in backend/tests/unit/calculations.service.test.ts:
  - Test calculateAverageCost with multiple transactions
  - Test calculateGainLoss with profit and loss scenarios
  - Test edge cases (zero cost basis, very small values)
- [X] T101 [P] [US2] Write test in backend/tests/integration/transactions.test.ts:
  - Test adding transaction updates average cost
  - Test multiple transactions calculate correct weighted average

### Frontend: Transaction Models

- [X] T102 [P] [US2] Add Transaction interfaces to frontend/src/app/shared/models/holding.model.ts
- [X] T103 [P] [US2] Update HoldingDetails model to include gainLoss, gainLossPercentage fields

### Frontend: Holdings Store Enhancement

- [X] T104 [US2] Create frontend/src/app/features/holdings/store/holdings.state.ts
- [X] T105 [P] [US2] Create holdings actions in frontend/src/app/features/holdings/store/holdings.actions.ts
- [X] T106 [P] [US2] Create holdings reducer in frontend/src/app/features/holdings/store/holdings.reducer.ts
- [X] T107 [US2] Create holdings effects in frontend/src/app/features/holdings/store/holdings.effects.ts
- [X] T108 [P] [US2] Create holdings selectors in frontend/src/app/features/holdings/store/holdings.selectors.ts

### Frontend: Gain/Loss Display Component

- [X] T109 [US2] Create frontend/src/app/shared/components/gain-loss-badge/ component:
  - Display gain/loss value with $ formatting
  - Show percentage in parentheses
  - Apply green color for gains (text-profit)
  - Apply red color for losses (text-loss)
  - Add up/down arrow icons
- [X] T110 [US2] Integrate gain-loss-badge into portfolio-table for each holding
- [X] T111 [US2] Add total portfolio gain/loss to portfolio-summary component

### Frontend: Holdings Detail Component

- [X] T112 [US2] Create frontend/src/app/features/holdings/components/holding-detail/ component:
  - Display holding overview (symbol, quantity, average cost)
  - Show current value and gain/loss prominently
  - Include transaction history table
  - Add button to add new transaction
- [X] T113 [US2] Add route /portfolio/:portfolioId/holding/:holdingId to holdings.routes.ts

### Frontend: Add Transaction Dialog

- [X] T114 [US2] Create frontend/src/app/features/holdings/components/add-transaction-dialog/ component:
  - Form fields: type (BUY/SELL), quantity, price per unit, fee, date, notes
  - Validation for SELL (quantity ≤ current holding)
  - Auto-calculate total cost
  - Submit handler dispatching add transaction action

### Frontend: Portfolio Statistics Display

- [X] T115 [US2] Create frontend/src/app/features/portfolio/components/portfolio-stats/ component:
  - Cards showing best/worst performers
  - Total gain/loss with visual prominence
  - Largest holding allocation
  - Responsive grid layout with TailwindCSS

### Frontend: Component Tests

- [X] T116 [P] [US2] Write test for gain-loss-badge.component.spec.ts verifying color coding
- [X] T117 [P] [US2] Write test for holding-detail.component.spec.ts verifying transaction display
- [X] T118 [P] [US2] Write test for portfolio-stats.component.spec.ts verifying statistics rendering

**Checkpoint**: User Story 2 complete - Users can track gains and losses for all holdings

---

## Phase 5: User Story 3 - Visualize Portfolio with Charts (Priority: P2)

**Goal**: Add graphical visualizations (pie chart for allocation, line chart for performance trends)

**Independent Test**: Display portfolio with charts, verify pie chart shows correct allocation percentages, line chart shows value over time

### Backend: Historical Data Support

- [X] T119 [P] [US3] Verify PriceHistory model in backend/src/prisma/schema.prisma
- [X] T120 [US3] Create backend/src/modules/market-data/market-data.controller.ts with endpoints:
  - GET /api/market/history/:symbol?timeframe=1h|24h|7d|30d|1y
  - Returns array of {timestamp, price, volume}
- [X] T121 [US3] Enhance market-data.service.ts with getHistoricalPrices(symbol, timeframe) method
- [X] T122 [US3] Implement caching for historical data (5 min TTL) in market-data.cache.ts

### Backend: Portfolio Allocation Endpoint

- [X] T123 [US3] Add GET /api/portfolios/:id/allocation endpoint returning AllocationData[] with:
  - symbol, name, value, percentage, color (unique color per crypto)
- [X] T124 [US3] Implement allocation calculation in portfolio.service.ts using calculations.service

### Frontend: Chart.js Integration

- [X] T125 [P] [US3] Install ng-chartjs or chart.js wrapper in frontend/
- [X] T126 [P] [US3] Create frontend/src/app/shared/utils/chart-colors.util.ts with predefined color palette for cryptocurrencies

### Frontend: Pie Chart Component

- [X] T127 [US3] Create frontend/src/app/features/portfolio/components/portfolio-charts/pie-chart/ component:
  - pie-chart.component.ts (receives allocation data as input)
  - pie-chart.component.html (Canvas element for Chart.js)
  - pie-chart.component.scss
  - pie-chart.component.spec.ts
- [X] T128 [US3] Configure Chart.js doughnut chart with:
  - Legend at bottom
  - Tooltips showing symbol, value, percentage
  - Responsive sizing
  - Custom colors from chart-colors.util

### Frontend: Line Chart Component

- [X] T129 [US3] Create frontend/src/app/features/portfolio/components/portfolio-charts/line-chart/ component:
  - line-chart.component.ts
  - line-chart.component.html
  - line-chart.component.scss
  - line-chart.component.spec.ts
- [X] T130 [US3] Configure Chart.js line chart with:
  - Time-series data on X-axis
  - Portfolio value on Y-axis
  - Smooth curves (tension: 0.4)
  - Area fill with gradient
  - Hover interactions

### Frontend: View Toggle Component

- [X] T131 [US3] Create frontend/src/app/features/portfolio/components/view-toggle/ component:
  - Toggle button: Table view | Chart view
  - Icons for each view type
  - Active state styling
  - Emits view change event
- [X] T132 [US3] Integrate view-toggle into portfolio-dashboard component
- [X] T133 [US3] Implement conditional rendering in portfolio-dashboard:
  - Show portfolio-table when table view active
  - Show pie-chart when chart view active
  - Animate transition with TailwindCSS transitions

### Frontend: Timeframe Selector Component

- [X] T134 [US3] Create frontend/src/app/shared/components/timeframe-selector/ component:
  - Buttons for: 24h, 7d, 30d, 1y
  - Active state highlighting
  - Emits selected timeframe
- [X] T135 [US3] Integrate timeframe-selector with line-chart component
- [X] T136 [US3] Fetch historical data on timeframe change

### Frontend: Market Trends Store

- [X] T137 [US3] Create frontend/src/app/features/market-trends/store/market-trends.state.ts
- [X] T138 [P] [US3] Create market-trends actions, reducer, effects, selectors
- [X] T139 [US3] Create frontend/src/app/features/market-trends/services/market-data-api.service.ts

### Frontend: Component Tests

- [X] T140 [P] [US3] Write test for pie-chart.component.spec.ts verifying chart renders with data
- [X] T141 [P] [US3] Write test for line-chart.component.spec.ts verifying timeframe changes
- [X] T142 [P] [US3] Write test for view-toggle.component.spec.ts verifying toggle behavior

**Checkpoint**: User Story 3 complete - Users can visualize portfolio with charts

---

## Phase 6: User Story 4 - Monitor Cryptocurrency Trends (Priority: P2)

**Goal**: Display price trends, % changes, and market indicators for all cryptocurrencies

**Independent Test**: View any cryptocurrency, verify trend indicators (up/down/neutral), percentage changes for multiple timeframes (1h, 24h, 7d)

### Backend: Enhanced Market Data

- [X] T143 [US4] Update backend/src/modules/market-data/market-data.service.ts:
  - getCurrentPrice(symbol) returns full CryptoMarketData (not just price)
  - Include change1h, change24h, change7d, volume24h, marketCap, high24h, low24h
- [X] T144 [US4] Add GET /api/market/prices/:symbol endpoint in market-data.controller.ts
- [X] T145 [US4] Add GET /api/market/prices?symbols=BTC,ETH,ADA (batch endpoint)
- [X] T146 [US4] Implement PriceCache model updates in market-data.service.ts (store all trend fields)

### Backend: Trend Calculation

- [X] T147 [US4] Create backend/src/shared/utils/trend.util.ts with:
  - calculateTrend(change24h): 'up' | 'down' | 'neutral' (threshold ±0.5%)
  - formatMarketCap(value): string (e.g., "$1.2T")
  - formatVolume(value): string (e.g., "$45.3B")

### Frontend: Crypto Detail Component

- [X] T148 [US4] Create frontend/src/app/features/market-trends/components/crypto-detail/ component:
  - Display crypto name and symbol prominently
  - Show current price (large, bold)
  - Display all percentage changes (1h, 24h, 7d, 30d) with color coding
  - Show volume and market cap
  - Display 24h high/low range
  - Include price chart (reuse line-chart component)
- [X] T149 [US4] Add route /market/:symbol to market-trends.routes.ts

### Frontend: Trend Indicator Component

- [X] T150 [US4] Create frontend/src/app/shared/components/trend-indicator/ component:
  - Green up arrow + percentage for uptrend
  - Red down arrow + percentage for downtrend
  - Gray neutral indicator for stable
  - Configurable size (small, medium, large)
- [X] T151 [US4] Integrate trend-indicator into portfolio-table for priceChange24h column

### Frontend: Market Overview Component

- [X] T152 [US4] Create frontend/src/app/features/market-trends/components/market-overview/ component:
  - List top gainers (sorted by change24h desc, limit 10)
  - List top losers (sorted by change24h asc, limit 10)
  - Use data-table component for consistent styling
  - Each row links to crypto-detail page

### Frontend: Enhanced Portfolio Table

- [ ] T153 [US4] Update portfolio-table component to include new columns:
  - 24h Change % (with trend-indicator)
  - Volume 24h
  - Market Cap
- [ ] T154 [US4] Make table columns configurable (show/hide via settings)

### Frontend: Price Update Service

- [X] T155 [US4] Create frontend/src/app/core/services/price-update.service.ts:
  - Interval-based polling (60s) using RxJS interval + switchMap
  - Fetch current prices for all portfolio + watchlist symbols
  - Dispatch updatePrices action to store
  - Auto-start on app init, stop on destroy
- [X] T156 [US4] Integrate price-update.service in portfolio-dashboard component lifecycle

### Frontend: Real-time Price Display

- [ ] T157 [US4] Add animated price change indicators:
  - Green flash when price increases
  - Red flash when price decreases
  - Use Angular animations or TailwindCSS transitions
- [X] T158 [US4] Show "Last updated: X seconds ago" timestamp in portfolio-summary

### Frontend: Component Tests

- [ ] T159 [P] [US4] Write test for trend-indicator.component.spec.ts verifying color coding
- [ ] T160 [P] [US4] Write test for crypto-detail.component.spec.ts verifying data display
- [ ] T161 [P] [US4] Write test for price-update.service.spec.ts verifying polling logic

**Checkpoint**: User Story 4 complete - Users can monitor cryptocurrency trends

---

## Phase 7: User Story 5 - Watch Cryptocurrencies Not in Portfolio (Priority: P3)

**Goal**: Allow users to add cryptocurrencies to a watchlist for monitoring without ownership

**Independent Test**: Add cryptocurrency to watchlist, verify it appears in separate section with current price and trends, remove from watchlist

### Backend: Watchlist Model & Service

- [ ] T162 [P] [US5] Verify WatchlistItem model in backend/src/prisma/schema.prisma
- [ ] T163 [P] [US5] Create backend/src/modules/watchlist/watchlist.validation.ts with AddToWatchlistSchema
- [ ] T164 [US5] Create backend/src/modules/watchlist/watchlist.service.ts with methods:
  - addToWatchlist(userId, data): Promise<WatchlistItem>
  - getWatchlist(userId): Promise<WatchlistItemDetails[]> (includes current prices)
  - removeFromWatchlist(userId, itemId): Promise<void>
  - isInWatchlist(userId, symbol): Promise<boolean>

### Backend: Watchlist Controller & Routes

- [ ] T165 [US5] Create backend/src/modules/watchlist/watchlist.controller.ts with endpoints:
  - GET /api/watchlist (get user watchlist with prices)
  - POST /api/watchlist (add to watchlist)
  - DELETE /api/watchlist/:id (remove from watchlist)
- [ ] T166 [US5] Register watchlist routes in backend/src/app.ts

### Backend: Integration Tests

- [ ] T167 [P] [US5] Write test in backend/tests/integration/watchlist.test.ts:
  - Test adding to watchlist
  - Test fetching watchlist includes current prices
  - Test removing from watchlist
  - Test duplicate prevention (unique constraint)

### Frontend: Watchlist Models & Store

- [ ] T168 [P] [US5] Create frontend/src/app/shared/models/watchlist.model.ts with WatchlistItem interface
- [ ] T169 [US5] Create frontend/src/app/features/watchlist/store/ (state, actions, reducer, effects, selectors)
- [ ] T170 [US5] Create frontend/src/app/features/watchlist/services/watchlist-api.service.ts

### Frontend: Watchlist Panel Component

- [ ] T171 [US5] Create frontend/src/app/features/watchlist/components/watchlist-panel/ component:
  - watchlist-panel.component.ts
  - watchlist-panel.component.html
  - watchlist-panel.component.scss
  - watchlist-panel.component.spec.ts
- [ ] T172 [US5] Display watchlist items in table format with columns:
  - Symbol + Name
  - Current Price
  - 24h Change (with trend-indicator)
  - Volume
  - Remove button
- [ ] T173 [US5] Add "View Details" link to crypto-detail page for each item

### Frontend: Add to Watchlist Dialog

- [ ] T174 [US5] Create frontend/src/app/features/watchlist/components/add-to-watchlist-dialog/ component:
  - Search/autocomplete for cryptocurrency symbol
  - Display crypto name after selection
  - Optional notes field
  - Validation (not already in watchlist, valid symbol)
- [ ] T175 [US5] Integrate add-to-watchlist-dialog trigger button in:
  - Market overview page
  - Crypto detail page
  - Portfolio dashboard (for discovered cryptos)

### Frontend: Watchlist Integration in Dashboard

- [ ] T176 [US5] Update portfolio-dashboard component:
  - Add tab/toggle for Holdings vs Watchlist
  - Display watchlist-panel when watchlist tab active
  - Show count badges (e.g., "Holdings (5)" | "Watchlist (12)")
- [ ] T177 [US5] Add watchlist to price-update.service polling (fetch prices for watchlist symbols)

### Frontend: Watchlist Page

- [ ] T178 [US5] Create standalone watchlist page at /watchlist route
- [ ] T179 [US5] Add navigation link to watchlist in app header/sidebar

### Frontend: Component Tests

- [ ] T180 [P] [US5] Write test for watchlist-panel.component.spec.ts verifying list display
- [ ] T181 [P] [US5] Write test for add-to-watchlist-dialog.component.spec.ts verifying validation
- [ ] T182 [P] [US5] Write integration test verifying watchlist updates after price polling

**Checkpoint**: User Story 5 complete - Users can watch cryptocurrencies not in portfolio

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

### Testing & Quality

- [ ] T183 [P] Run all backend unit tests: cd backend && npm test
- [ ] T184 [P] Run all backend integration tests with coverage: cd backend && npm run test:coverage
- [ ] T185 [P] Run all frontend component tests: cd frontend && npm test
- [ ] T186 [P] Verify test coverage meets target (>80% for business logic)
- [ ] T187 [P] Run ESLint on backend: cd backend && npm run lint
- [ ] T188 [P] Run ESLint on frontend: cd frontend && npm run lint
- [ ] T189 [P] Run Prettier formatting check on both projects

### Security Hardening

- [ ] T190 [P] Audit backend dependencies: cd backend && npm audit
- [ ] T191 [P] Audit frontend dependencies: cd frontend && npm audit
- [ ] T192 Verify .env.example matches actual .env structure (no secrets committed)
- [ ] T193 [P] Test rate limiting: Send >100 requests in 15 minutes, verify 429 responses
- [ ] T194 [P] Verify CORS configuration only allows frontend origin
- [ ] T195 [P] Test input validation with malformed data (SQL injection attempts, XSS)

### Performance Optimization

- [ ] T196 [P] Add database indexes for frequently queried fields (userId, symbol, portfolioId)
- [ ] T197 [P] Verify Redis caching working: Check cache hit rate in logs
- [ ] T198 [P] Test pagination with large datasets (100+ holdings)
- [ ] T199 [P] Measure frontend bundle size: cd frontend && npm run build && analyze
- [ ] T200 [P] Optimize Chart.js bundle: Use tree-shaking to include only needed chart types
- [ ] T201 [P] Add lazy loading for all feature routes
- [ ] T202 Test frontend performance with Lighthouse (target: >90 performance score)

### Error Handling & Logging

- [ ] T203 [P] Verify all backend routes have error handling middleware
- [ ] T204 [P] Test error scenarios: Database down, external API timeout, invalid input
- [ ] T205 [P] Verify Winston logger writing to files in production mode
- [ ] T206 [P] Add structured logging for all critical operations (portfolio create, transaction add)
- [ ] T207 [P] Implement frontend global error handler for unhandled exceptions

### UI/UX Polish

- [ ] T208 [P] Add loading skeletons for all async data (portfolio, charts, watchlist)
- [ ] T209 [P] Implement toast notifications for all user actions (success/error feedback)
- [ ] T210 [P] Add empty states with helpful CTAs for:
  - Empty portfolio (prompt to add holding)
  - Empty watchlist (prompt to add crypto)
  - No search results
- [ ] T211 [P] Verify mobile responsiveness on all pages (test on viewport <768px)
- [ ] T212 [P] Add keyboard navigation support (tab order, enter to submit forms)
- [ ] T213 [P] Implement dark mode support with TailwindCSS dark: classes
- [ ] T214 [P] Add smooth animations for:
  - View transitions (table ↔ chart)
  - Price updates (flash effect)
  - Modal open/close

### Documentation

- [ ] T215 [P] Create backend/README.md with:
  - Setup instructions
  - Environment variables documentation
  - API endpoints overview
  - Testing guide
- [ ] T216 [P] Create frontend/README.md with:
  - Setup instructions
  - Component architecture
  - State management overview
  - Build & deployment
- [ ] T217 [P] Update root README.md with:
  - Project overview
  - Quick start (link to specs/001-crypto-portfolio-dashboard/quickstart.md)
  - Architecture diagram
  - Contributing guidelines
- [ ] T218 [P] Generate API documentation from OpenAPI spec (Swagger UI at /api-docs)
- [ ] T219 [P] Add JSDoc comments to all public methods in services

### Deployment Preparation

- [ ] T220 Create Dockerfile for backend/Dockerfile:
  - Multi-stage build (build + production)
  - Node.js 20 Alpine base image
  - Non-root user
  - Health check endpoint
- [ ] T221 [P] Create Dockerfile for frontend/Dockerfile (Nginx to serve static files)
- [ ] T222 [P] Update docker-compose.yml to include backend and frontend services (for local full-stack testing)
- [ ] T223 [P] Create .dockerignore files for both backend and frontend
- [ ] T224 Test full Docker setup: docker-compose up -d (all services healthy)
- [ ] T225 [P] Create GitHub Actions workflow for CI/CD:
  - Run linting
  - Run all tests
  - Build Docker images
  - (Optional) Deploy to staging

### Final Validation

- [ ] T226 Follow quickstart.md from scratch on clean machine (verify all steps work)
- [ ] T227 [P] Test all user stories end-to-end:
  - US1: Create portfolio, add holdings, view in table
  - US2: Add transactions, verify gain/loss calculations
  - US3: Toggle to chart view, verify pie chart and line chart
  - US4: View crypto details, verify trends and indicators
  - US5: Add to watchlist, verify monitoring
- [ ] T228 [P] Verify all acceptance scenarios from spec.md pass
- [ ] T229 [P] Test edge cases from spec.md (empty portfolio, API failure, very small values)
- [ ] T230 Verify all success criteria from spec.md are met:
  - Portfolio loads in <3 seconds (SC-001)
  - Price updates within 60 seconds (SC-002)
  - View transitions <1 second (SC-003)
  - Charts render in <2 seconds (SC-007)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (Setup) completion - BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 (Foundational) completion
- **Phase 4 (US2)**: Depends on Phase 2 (Foundational) completion - Can run in parallel with US1 but builds on US1 components
- **Phase 5 (US3)**: Depends on Phase 2 (Foundational) and Phase 3 (US1) completion
- **Phase 6 (US4)**: Depends on Phase 2 (Foundational) completion - Can run in parallel with US3
- **Phase 7 (US5)**: Depends on Phase 2 (Foundational) completion - Mostly independent, can run in parallel
- **Phase 8 (Polish)**: Depends on completion of desired user stories (at minimum US1 + US2)

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Foundational phase
- **User Story 2 (P1)**: Extends US1 (adds gain/loss to existing holdings display)
- **User Story 3 (P2)**: Requires US1 (visualizes portfolio data)
- **User Story 4 (P2)**: Independent of US1-3 (market data feature)
- **User Story 5 (P3)**: Independent of US1-4 (separate watchlist feature)

### Parallel Opportunities

**Phase 1 (Setup)**:
- Tasks T003-T009 (backend dependencies & config) can run in parallel
- Tasks T010-T017 (frontend setup) can run in parallel
- Backend and frontend setup can run in parallel

**Phase 2 (Foundational)**:
- Tasks T026-T030 (backend shared services) can run in parallel
- Tasks T031-T034 (backend middleware) can run in parallel
- Tasks T039-T048 (frontend core services & components) can run in parallel
- Tasks T051-T052 (market data adapters) can run in parallel

**Phase 3 (US1)**:
- Tasks T056-T059 (models verification) can run in parallel
- Tasks T061-T062 (validation schemas) can run in parallel
- Tasks T069-T070 (backend tests) can run in parallel after implementation
- Tasks T071-T072 (frontend models) can run in parallel
- Tasks T074, T075, T077 (NgRx store pieces) can run in parallel
- Tasks T090-T092 (frontend tests) can run in parallel after components

**Across User Stories** (if team capacity allows):
- After Phase 2, US1, US2, US4, US5 can be developed in parallel by different developers
- US3 should wait for US1 completion

---

## Parallel Example: User Story 1

```bash
# Phase 3: User Story 1 - Models can be created in parallel:
Task T056-T059: All model verifications in parallel

# Validation schemas in parallel:
Task T061: portfolio.validation.ts
Task T062: holdings.validation.ts

# Backend integration tests in parallel (after implementation):
Task T069: portfolio.test.ts
Task T070: holdings.test.ts

# Frontend models in parallel:
Task T071: portfolio.model.ts
Task T072: portfolio-api.service.ts

# NgRx store pieces in parallel:
Task T074: portfolio.actions.ts
Task T075: portfolio.reducer.ts
Task T077: portfolio.selectors.ts

# Frontend component tests in parallel (after components):
Task T090: portfolio-dashboard.component.spec.ts
Task T091: portfolio-table.component.spec.ts
Task T092: add-holding-dialog.component.spec.ts
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

This is the RECOMMENDED approach for quickest time to value:

1. **Complete Phase 1**: Setup (Backend + Frontend + Docker)
2. **Complete Phase 2**: Foundational (CRITICAL - enables everything)
3. **Complete Phase 3**: User Story 1 (View Portfolio Holdings)
4. **VALIDATE**: Test US1 independently - can users see their portfolio?
5. **Complete Phase 4**: User Story 2 (Track Gains/Losses)
6. **VALIDATE**: Test US2 independently - can users see their P&L?
7. **Deploy MVP**: US1 + US2 = minimum viable product

**At this point you have**:
- Working portfolio management (add/view holdings)
- Gain/loss tracking (investment performance)
- Transaction history
- A deployable product users can benefit from

### Incremental Delivery (Full Feature Set)

1. **Foundation** (Phase 1 + 2) → Development environment ready
2. **MVP** (US1 + US2) → Test independently → Deploy/Demo (core value)
3. **Add Visualization** (US3) → Test independently → Deploy/Demo (enhanced UX)
4. **Add Market Trends** (US4) → Test independently → Deploy/Demo (market awareness)
5. **Add Watchlist** (US5) → Test independently → Deploy/Demo (research capability)
6. **Polish** (Phase 8) → Final hardening → Production release

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With 3+ developers after Phase 2:

**Team A (Backend Lead)**:
- US1 backend (portfolio + holdings API)
- US2 backend (transactions + calculations)
- US4 backend (market data integration)

**Team B (Frontend Lead)**:
- US1 frontend (portfolio dashboard + table)
- US2 frontend (gain/loss display + stats)
- US3 frontend (charts visualization)

**Team C (Full-Stack)**:
- US5 (watchlist feature - independent)
- Phase 8 (polish - supports all features)

---

## Task Count Summary

- **Phase 1 (Setup)**: 20 tasks
- **Phase 2 (Foundational)**: 35 tasks
- **Phase 3 (US1 - View Portfolio)**: 37 tasks
- **Phase 4 (US2 - Gains/Losses)**: 26 tasks
- **Phase 5 (US3 - Charts)**: 23 tasks
- **Phase 6 (US4 - Trends)**: 19 tasks
- **Phase 7 (US5 - Watchlist)**: 21 tasks
- **Phase 8 (Polish)**: 48 tasks

**Total**: 230 tasks (229 tasks numbered T001-T230)

**MVP Tasks (Phase 1 + 2 + 3 + 4)**: 118 tasks
**Parallel Tasks**: 89 tasks marked with [P]

---

## Notes

- **[P] = Parallelizable**: Tasks marked [P] work on different files with no dependencies, can be executed simultaneously
- **[Story] Labels**: [US1] through [US5] map tasks to specific user stories for traceability
- **Independent User Stories**: Each story delivers standalone value and can be tested independently
- **TDD Approach**: Tests are included throughout following project constitution
- **Checkpoint Validation**: Stop at any user story checkpoint to independently validate functionality
- **Commit Strategy**: Commit after each task or logical group of parallel tasks
- **Port Change**: Note docker-compose.yml uses port 5433 for PostgreSQL (modified from default 5432)

---

## Success Criteria Validation Checklist

After completing all tasks, verify these criteria from spec.md:

- [ ] **SC-001**: Portfolio loads in <3 seconds
- [ ] **SC-002**: Price updates within 60 seconds
- [ ] **SC-003**: View transitions <1 second
- [ ] **SC-004**: Gain/loss precision 4 decimals
- [ ] **SC-005**: Handles 100+ cryptocurrencies without degradation
- [ ] **SC-006**: Add to watchlist in <5 seconds
- [ ] **SC-007**: Charts render in <2 seconds
- [ ] **SC-008**: 95% users interpret P&L without help
- [ ] **SC-009**: 99% uptime for price data
- [ ] **SC-010**: Identify top/worst performers in <10 seconds

---

**Ready to implement!** Start with Phase 1 (Setup) and proceed sequentially through phases, or parallelize user stories after Phase 2 completion based on team capacity.
