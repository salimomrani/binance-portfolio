# Data Model: Crypto Portfolio Dashboard

**Feature**: 001-crypto-portfolio-dashboard
**Date**: 2025-11-17
**Reference**: [spec.md](./spec.md) | [research.md](./research.md)

## Overview

This document defines the complete data model for the Crypto Portfolio Dashboard, including database schema, TypeScript interfaces, validation schemas, and state management structures.

## Database Schema (Prisma)

### Complete Schema Definition

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    // For future authentication
  firstName     String?
  lastName      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?

  portfolios    Portfolio[]
  watchlists    WatchlistItem[]
  preferences   UserPreferences?

  @@index([email])
}

model UserPreferences {
  id                String   @id @default(uuid())
  userId            String   @unique
  currency          String   @default("USD")  // USD, EUR, GBP
  theme             String   @default("light") // light, dark
  defaultView       String   @default("table") // table, chart
  priceAlerts       Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ============================================================================
// PORTFOLIO & HOLDINGS
// ============================================================================

model Portfolio {
  id            String    @id @default(uuid())
  userId        String
  name          String    @default("My Portfolio")
  description   String?
  isDefault     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  holdings      Holding[]

  @@index([userId])
  @@index([userId, isDefault])
}

model Holding {
  id            String    @id @default(uuid())
  portfolioId   String
  symbol        String    // BTC, ETH, ADA (uppercase)
  name          String    // Bitcoin, Ethereum, Cardano
  quantity      Decimal   @db.Decimal(20, 8)  // Up to 8 decimal places
  averageCost   Decimal   @db.Decimal(20, 8)  // Average cost in USD per unit
  notes         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  portfolio     Portfolio     @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  transactions  Transaction[]

  @@unique([portfolioId, symbol])
  @@index([portfolioId])
  @@index([symbol])
}

model Transaction {
  id            String            @id @default(uuid())
  holdingId     String
  type          TransactionType
  quantity      Decimal           @db.Decimal(20, 8)
  pricePerUnit  Decimal           @db.Decimal(20, 8)  // Price in USD
  totalCost     Decimal           @db.Decimal(20, 8)  // quantity * pricePerUnit
  fee           Decimal?          @db.Decimal(20, 8)  // Transaction fee
  notes         String?
  date          DateTime          // Transaction date
  createdAt     DateTime          @default(now())

  holding       Holding           @relation(fields: [holdingId], references: [id], onDelete: Cascade)

  @@index([holdingId])
  @@index([date])
  @@index([type])
}

enum TransactionType {
  BUY
  SELL
}

// ============================================================================
// WATCHLIST
// ============================================================================

model WatchlistItem {
  id            String    @id @default(uuid())
  userId        String
  symbol        String    // BTC, ETH, ADA
  name          String    // Bitcoin, Ethereum, Cardano
  notes         String?
  addedAt       DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, symbol])
  @@index([userId])
  @@index([symbol])
}

// ============================================================================
// MARKET DATA & CACHE
// ============================================================================

model PriceCache {
  id            String    @id @default(uuid())
  symbol        String    @unique
  name          String
  price         Decimal   @db.Decimal(20, 8)  // Current price in USD
  change1h      Decimal   @db.Decimal(10, 4)  // % change (e.g., 2.5 for +2.5%)
  change24h     Decimal   @db.Decimal(10, 4)  // % change
  change7d      Decimal   @db.Decimal(10, 4)  // % change
  change30d     Decimal   @db.Decimal(10, 4)  // % change
  volume24h     Decimal   @db.Decimal(20, 2)  // Trading volume in USD
  marketCap     Decimal   @db.Decimal(20, 2)  // Market cap in USD
  high24h       Decimal?  @db.Decimal(20, 8)  // 24h high
  low24h        Decimal?  @db.Decimal(20, 8)  // 24h low
  lastUpdated   DateTime
  source        String    @default("binance")  // binance, coingecko

  @@index([symbol])
  @@index([lastUpdated])
}

model PriceHistory {
  id            String    @id @default(uuid())
  symbol        String
  price         Decimal   @db.Decimal(20, 8)
  volume        Decimal   @db.Decimal(20, 2)
  timestamp     DateTime
  timeframe     String    // 1h, 24h, 7d, 30d, 1y

  @@unique([symbol, timestamp, timeframe])
  @@index([symbol, timeframe, timestamp])
  @@index([timestamp])
}
```

## TypeScript Interfaces

### Backend DTOs (Data Transfer Objects)

```typescript
// src/shared/types/portfolio.types.ts

import { Decimal } from 'decimal.js';

// ============================================================================
// REQUEST DTOs
// ============================================================================

export interface CreatePortfolioDto {
  name: string;
  description?: string;
}

export interface UpdatePortfolioDto {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

export interface AddHoldingDto {
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  notes?: string;
}

export interface UpdateHoldingDto {
  quantity?: number;
  averageCost?: number;
  notes?: string;
}

export interface AddTransactionDto {
  type: 'BUY' | 'SELL';
  quantity: number;
  pricePerUnit: number;
  fee?: number;
  date: Date;
  notes?: string;
}

export interface AddToWatchlistDto {
  symbol: string;
  name: string;
  notes?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export interface PortfolioSummary {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  holdingsCount: number;
  lastUpdated: Date;
  createdAt: Date;
}

export interface HoldingDetails {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercentage: number;
  allocationPercentage: number;
  priceChange24h: number;
  notes: string | null;
  lastUpdated: Date;
}

export interface PortfolioDetails extends PortfolioSummary {
  holdings: HoldingDetails[];
  allocationChart: AllocationData[];
}

export interface AllocationData {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface TransactionHistory {
  id: string;
  type: 'BUY' | 'SELL';
  symbol: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  fee: number | null;
  date: Date;
  notes: string | null;
}

export interface WatchlistItemDetails {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  change1h: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  trend: 'up' | 'down' | 'neutral';
  notes: string | null;
  addedAt: Date;
}

export interface CryptoMarketData {
  symbol: string;
  name: string;
  price: number;
  change1h: number;
  change24h: number;
  change7d: number;
  change30d: number;
  volume24h: number;
  marketCap: number;
  high24h: number | null;
  low24h: number | null;
  lastUpdated: Date;
}

export interface PriceHistoryData {
  timestamp: Date;
  price: number;
  volume: number;
}

export interface PriceChartData {
  symbol: string;
  timeframe: '1h' | '24h' | '7d' | '30d' | '1y';
  data: PriceHistoryData[];
}

// ============================================================================
// CALCULATION RESULTS
// ============================================================================

export interface GainLossResult {
  amount: number;
  percentage: number;
  isProfit: boolean;
}

export interface PortfolioStatistics {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  bestPerformer: {
    symbol: string;
    gainLossPercentage: number;
  } | null;
  worstPerformer: {
    symbol: string;
    gainLossPercentage: number;
  } | null;
  largestHolding: {
    symbol: string;
    percentage: number;
  } | null;
}
```

### Frontend Models

```typescript
// frontend/src/app/shared/models/portfolio.model.ts

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  holdingsCount: number;
  lastUpdated: Date;
  createdAt: Date;
  holdings?: Holding[];
}

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercentage: number;
  allocationPercentage: number;
  priceChange24h: number;
  notes: string | null;
  lastUpdated: Date;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  change1h: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  trend: 'up' | 'down' | 'neutral';
  notes: string | null;
  addedAt: Date;
}

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  lastUpdated: Date;
}

export interface ChartDataPoint {
  timestamp: Date;
  value: number;
}

export interface AllocationChartData {
  symbol: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}
```

## Validation Schemas (Zod)

```typescript
// backend/src/modules/portfolio/portfolio.validation.ts

import { z } from 'zod';

// ============================================================================
// PORTFOLIO SCHEMAS
// ============================================================================

export const CreatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  description: z.string().max(500).optional()
});

export const UpdatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).optional(),
  isDefault: z.boolean().optional()
});

// ============================================================================
// HOLDING SCHEMAS
// ============================================================================

export const AddHoldingSchema = z.object({
  symbol: z.string()
    .min(1)
    .max(10)
    .regex(/^[A-Z]+$/, 'Symbol must be uppercase letters only')
    .transform(s => s.toUpperCase()),
  name: z.string().min(1).max(100).trim(),
  quantity: z.number()
    .positive('Quantity must be positive')
    .max(1000000000, 'Quantity exceeds maximum'),
  averageCost: z.number()
    .positive('Average cost must be positive')
    .max(10000000, 'Price exceeds maximum'),
  notes: z.string().max(1000).optional()
});

export const UpdateHoldingSchema = z.object({
  quantity: z.number().positive().max(1000000000).optional(),
  averageCost: z.number().positive().max(10000000).optional(),
  notes: z.string().max(1000).optional()
});

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

export const AddTransactionSchema = z.object({
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number()
    .positive('Quantity must be positive')
    .max(1000000000),
  pricePerUnit: z.number()
    .positive('Price must be positive')
    .max(10000000),
  fee: z.number()
    .nonnegative('Fee cannot be negative')
    .max(1000000)
    .optional(),
  date: z.coerce.date()
    .max(new Date(), 'Date cannot be in the future'),
  notes: z.string().max(1000).optional()
});

// ============================================================================
// WATCHLIST SCHEMAS
// ============================================================================

export const AddToWatchlistSchema = z.object({
  symbol: z.string()
    .min(1)
    .max(10)
    .regex(/^[A-Z]+$/)
    .transform(s => s.toUpperCase()),
  name: z.string().min(1).max(100).trim(),
  notes: z.string().max(1000).optional()
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50)
});

export const TimeframeSchema = z.enum(['1h', '24h', '7d', '30d', '1y']);

export const PriceHistoryQuerySchema = z.object({
  symbol: z.string().min(1).max(10).toUpperCase(),
  timeframe: TimeframeSchema
});

export const SymbolsQuerySchema = z.object({
  symbols: z.string()
    .transform(s => s.split(',').map(sym => sym.trim().toUpperCase()))
    .pipe(z.array(z.string().min(1).max(10)).min(1).max(50))
});
```

## State Management (NgRx)

### Portfolio Store

```typescript
// frontend/src/app/features/portfolio/store/portfolio.state.ts

import { Portfolio, Holding } from '@/shared/models/portfolio.model';

export interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  selectedPortfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const initialPortfolioState: PortfolioState = {
  portfolios: [],
  selectedPortfolioId: null,
  selectedPortfolio: null,
  loading: false,
  error: null,
  lastUpdated: null
};

// frontend/src/app/features/portfolio/store/portfolio.actions.ts

import { createAction, props } from '@ngrx/store';
import { Portfolio, Holding } from '@/shared/models/portfolio.model';

// Load portfolios
export const loadPortfolios = createAction('[Portfolio] Load Portfolios');
export const loadPortfoliosSuccess = createAction(
  '[Portfolio] Load Portfolios Success',
  props<{ portfolios: Portfolio[] }>()
);
export const loadPortfoliosFailure = createAction(
  '[Portfolio] Load Portfolios Failure',
  props<{ error: string }>()
);

// Select portfolio
export const selectPortfolio = createAction(
  '[Portfolio] Select Portfolio',
  props<{ portfolioId: string }>()
);

// Create portfolio
export const createPortfolio = createAction(
  '[Portfolio] Create Portfolio',
  props<{ name: string; description?: string }>()
);
export const createPortfolioSuccess = createAction(
  '[Portfolio] Create Portfolio Success',
  props<{ portfolio: Portfolio }>()
);

// Update prices
export const updatePrices = createAction(
  '[Portfolio] Update Prices',
  props<{ prices: Map<string, number> }>()
);
```

### Holdings Store

```typescript
// frontend/src/app/features/holdings/store/holdings.state.ts

import { Holding, Transaction } from '@/shared/models';

export interface HoldingsState {
  holdings: Holding[];
  selectedHoldingId: string | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

export const initialHoldingsState: HoldingsState = {
  holdings: [],
  selectedHoldingId: null,
  transactions: [],
  loading: false,
  error: null
};
```

### Watchlist Store

```typescript
// frontend/src/app/features/watchlist/store/watchlist.state.ts

import { WatchlistItem } from '@/shared/models';

export interface WatchlistState {
  items: WatchlistItem[];
  loading: boolean;
  error: string | null;
}

export const initialWatchlistState: WatchlistState = {
  items: [],
  loading: false,
  error: null
};
```

## API Response Formats

### Standard Response Envelope

```typescript
// Successful response
interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp: Date;
}

// Error response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: Date;
}

// Paginated response
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: Date;
}
```

## Data Relationships

```
User
├─ Portfolio (1:N)
│  └─ Holding (1:N)
│     └─ Transaction (1:N)
└─ WatchlistItem (1:N)

PriceCache (independent, referenced by symbol)
PriceHistory (independent, referenced by symbol + timeframe)
```

## Data Constraints & Business Rules

1. **User**
   - Email must be unique
   - Password must be hashed (bcrypt with 10 rounds)

2. **Portfolio**
   - User can have multiple portfolios
   - Only one portfolio can be marked as default per user
   - Name must be unique per user

3. **Holding**
   - Symbol + Portfolio combination must be unique
   - Quantity must always be positive
   - Average cost recalculated on each transaction

4. **Transaction**
   - Cannot create transaction without parent holding
   - SELL transactions cannot exceed current holding quantity
   - Date cannot be in the future
   - Total cost = quantity * pricePerUnit (+ optional fee for SELL)

5. **Watchlist**
   - Symbol + User combination must be unique
   - Cannot add a cryptocurrency already in portfolio

6. **Price Cache**
   - Symbol must be unique
   - Updated every 60 seconds maximum
   - Stale data (> 2 minutes old) flagged for refresh

## Indexes Strategy

**High-Priority Indexes** (most frequent queries):
- `User.email` - Login queries
- `Portfolio.userId` - User's portfolios
- `Holding.portfolioId` - Portfolio holdings
- `Holding.symbol` - Price lookups
- `WatchlistItem.userId` - User's watchlist
- `PriceCache.symbol` - Price queries
- `Transaction.holdingId + date` - Transaction history

**Performance Considerations**:
- Composite indexes for common query patterns
- Partial indexes for boolean fields (isDefault)
- Covering indexes to avoid table lookups

## Migration Strategy

1. **Initial Migration**: Create all tables with indexes
2. **Seed Data**: Popular cryptocurrencies in PriceCache
3. **Version Control**: Prisma migrations tracked in git
4. **Rollback Plan**: Each migration has down migration

This data model provides a complete foundation for implementing all features defined in the specification while maintaining data integrity, type safety, and query performance.
