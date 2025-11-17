# Responsive Design Specification - Crypto Portfolio Dashboard

**Feature**: 001-crypto-portfolio-dashboard
**Date**: 2025-11-17
**Requirement**: Application must be responsive across desktop, tablet, and mobile devices

## Overview

The Crypto Portfolio Dashboard must provide an optimal user experience across all device sizes while maintaining full functionality and readability.

## Breakpoints Strategy

Using TailwindCSS breakpoints (mobile-first approach):

```typescript
// TailwindCSS default breakpoints
{
  'sm': '640px',   // Landscape phones, small tablets
  'md': '768px',   // Tablets
  'lg': '1024px',  // Small desktop
  'xl': '1280px',  // Desktop
  '2xl': '1536px'  // Large desktop
}
```

### Device Categories

| Device | Screen Width | Breakpoint | Primary Use Case |
|--------|--------------|------------|------------------|
| **Mobile** | 320px - 639px | Default (base) | Portfolio overview, quick checks |
| **Tablet** | 640px - 1023px | `sm:` and `md:` | Browsing, basic portfolio management |
| **Desktop** | 1024px+ | `lg:`, `xl:`, `2xl:` | Full portfolio management, analysis |

## Layout Patterns by Device

### Mobile (< 640px)

**Navigation:**
- Bottom tab bar or hamburger menu
- Sticky header with app title
- Collapsible sections

**Portfolio Dashboard:**
- Single column layout
- Stacked cards (full width)
- Vertical table → Card list view
- Swipe gestures for actions
- FAB (Floating Action Button) for add actions

**Portfolio Table:**
- Transform to card-based list
- Show essential columns only:
  - Symbol + Name
  - Quantity
  - Current Value
  - Gain/Loss (%)
- "View Details" button for more info
- Horizontal scroll for secondary data

**Charts:**
- Full width, reduced height
- One chart per screen
- Simplified legend (bottom or hidden with toggle)
- Touch gestures (pinch to zoom)

**Example Mobile Layout:**
```
┌─────────────────┐
│   Crypto Portfolio   │ ← Header (sticky)
├─────────────────┤
│ Total: $42,500  │ ← Summary Card
│ +2.3% ↑         │
├─────────────────┤
│ 📊 BTC          │ ← Holding Card
│ 0.5 BTC         │
│ $21,250         │
│ +5.7% ↑         │
├─────────────────┤
│ 📊 ETH          │
│ 10 ETH          │
│ ...             │
└─────────────────┘
  [Holdings] [Watchlist] [Market] ← Bottom Nav
```

### Tablet (640px - 1023px)

**Navigation:**
- Top navigation bar
- Side drawer (collapsible)
- Breadcrumbs for navigation

**Portfolio Dashboard:**
- 2-column grid for cards
- Table view (responsive columns)
- Split view (list + detail on larger tablets)

**Portfolio Table:**
- 6-8 visible columns
- Sticky header
- Column prioritization:
  - Priority 1: Symbol, Value, Gain/Loss
  - Priority 2: Quantity, Price, 24h Change
  - Priority 3: Volume, Market Cap
- Horizontal scroll for remaining columns

**Charts:**
- Side-by-side charts (2 columns)
- Medium chart height
- Full legend visible

**Example Tablet Layout:**
```
┌────────────────────────────────────┐
│ ☰ Crypto Portfolio    [User] [⚙️] │
├────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐     │
│ │Total Value │ │ Holdings   │     │
│ │ $42,500    │ │    5       │     │
│ └────────────┘ └────────────┘     │
├────────────────────────────────────┤
│ Symbol │ Qty  │ Value  │ Gain/Loss│
│ BTC    │ 0.5  │$21,250 │  +5.7%  │
│ ETH    │ 10   │$22,507 │  +1.8%  │
└────────────────────────────────────┘
```

### Desktop (1024px+)

**Navigation:**
- Persistent sidebar (left)
- Top app bar with search and actions
- Multiple navigation levels

**Portfolio Dashboard:**
- 3-4 column grid
- Full table view with all columns
- Side panel for details/actions
- Multiple charts visible simultaneously

**Portfolio Table:**
- All columns visible
- Advanced sorting and filtering
- Inline editing capabilities
- Batch actions toolbar

**Charts:**
- Multi-chart dashboard (2x2 grid or more)
- Large, detailed charts
- Full interactivity (tooltips, crosshairs)
- Legend always visible

**Example Desktop Layout:**
```
┌──┬──────────────────────────────────────────┐
│  │ Crypto Portfolio          [Search] [User]│
│  ├──────────────────────────────────────────┤
│S │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│i │ │Total │ │Gain  │ │Holds │ │24h   │    │
│d │ │Value │ │Loss  │ │ Count│ │Change│    │
│e │ └──────┘ └──────┘ └──────┘ └──────┘    │
│b ├──────────────────────────────────────────┤
│a │ Sym │ Name   │ Qty │ Price │ Value │ G/L│
│r │ BTC │Bitcoin │ 0.5 │$42.5K │$21.2K │+5.7│
│  │ ETH │Ethereum│ 10  │$2.25K │$22.5K │+1.8│
│  ├──────────────────────────────────────────┤
│  │ ┌──────────────┐  ┌──────────────┐      │
│  │ │ Pie Chart    │  │ Line Chart   │      │
│  │ │ Allocation   │  │ Performance  │      │
│  │ └──────────────┘  └──────────────┘      │
└──┴──────────────────────────────────────────┘
```

## Component Responsive Strategies

### 1. Portfolio Dashboard Component

```typescript
// portfolio-dashboard.component.html
<div class="container mx-auto px-4">
  <!-- Summary Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <app-summary-card *ngFor="let stat of stats" [stat]="stat" />
  </div>

  <!-- View Toggle: Hidden on mobile, use bottom nav instead -->
  <div class="hidden md:flex justify-end mb-4">
    <app-view-toggle [(view)]="currentView" />
  </div>

  <!-- Content: Table or Charts based on view -->
  <div [ngSwitch]="currentView">
    <!-- Table View -->
    <app-portfolio-table
      *ngSwitchCase="'table'"
      [holdings]="holdings$ | async"
      class="block"
    />

    <!-- Chart View -->
    <div *ngSwitchCase="'chart'"
         class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <app-pie-chart [data]="allocationData$ | async" />
      <app-line-chart [data]="performanceData$ | async" />
    </div>
  </div>

  <!-- Mobile FAB -->
  <button class="md:hidden fixed bottom-20 right-4 btn-primary rounded-full w-14 h-14">
    +
  </button>
</div>
```

### 2. Portfolio Table Component

```typescript
// portfolio-table.component.html
<!-- Mobile: Card View -->
<div class="md:hidden space-y-4">
  <app-holding-card
    *ngFor="let holding of holdings"
    [holding]="holding"
    (click)="viewDetails(holding)"
  />
</div>

<!-- Tablet/Desktop: Table View -->
<div class="hidden md:block overflow-x-auto">
  <table class="table w-full">
    <thead>
      <tr>
        <th>Symbol</th>
        <th class="hidden lg:table-cell">Name</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Value</th>
        <th>Gain/Loss</th>
        <th class="hidden lg:table-cell">24h Change</th>
        <th class="hidden xl:table-cell">Volume</th>
        <th class="hidden xl:table-cell">Market Cap</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr *ngFor="let holding of holdings">
        <td class="font-bold">{{ holding.symbol }}</td>
        <td class="hidden lg:table-cell">{{ holding.name }}</td>
        <td>{{ holding.quantity | number:'1.0-8' }}</td>
        <td>{{ holding.currentPrice | currency }}</td>
        <td>{{ holding.currentValue | currency }}</td>
        <td>
          <app-gain-loss-badge [value]="holding.gainLoss" />
        </td>
        <td class="hidden lg:table-cell">
          <app-trend-indicator [change]="holding.change24h" />
        </td>
        <td class="hidden xl:table-cell">
          {{ holding.volume24h | currency:'USD':'symbol':'1.0-0' }}
        </td>
        <td class="hidden xl:table-cell">
          {{ holding.marketCap | currency:'USD':'symbol':'1.0-0' }}
        </td>
        <td>
          <button class="btn-sm">⋮</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 3. Charts Components

```typescript
// pie-chart.component.html
<div class="w-full" [style.height.px]="chartHeight">
  <canvas #chartCanvas></canvas>
</div>

// pie-chart.component.ts
export class PieChartComponent {
  @HostListener('window:resize')
  onResize() {
    this.updateChartHeight();
  }

  private updateChartHeight(): void {
    const width = window.innerWidth;
    if (width < 640) {
      this.chartHeight = 250; // Mobile
    } else if (width < 1024) {
      this.chartHeight = 350; // Tablet
    } else {
      this.chartHeight = 400; // Desktop
    }
    this.chart?.resize();
  }
}
```

### 4. Navigation Component

```typescript
// app-nav.component.html
<!-- Desktop Sidebar -->
<aside class="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
  <nav class="p-4 space-y-2">
    <a routerLink="/portfolio" class="nav-link">Portfolio</a>
    <a routerLink="/watchlist" class="nav-link">Watchlist</a>
    <a routerLink="/market" class="nav-link">Market</a>
  </nav>
</aside>

<!-- Mobile Bottom Nav -->
<nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">
  <a routerLink="/portfolio" class="nav-item">
    <svg>...</svg>
    <span class="text-xs">Portfolio</span>
  </a>
  <a routerLink="/watchlist" class="nav-item">
    <svg>...</svg>
    <span class="text-xs">Watchlist</span>
  </a>
  <a routerLink="/market" class="nav-item">
    <svg>...</svg>
    <span class="text-xs">Market</span>
  </a>
</nav>

<!-- Tablet Hamburger + Top Nav -->
<header class="md:block lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md">
  <div class="flex items-center justify-between p-4">
    <button (click)="toggleDrawer()">☰</button>
    <h1>Crypto Portfolio</h1>
    <button>👤</button>
  </div>
</header>
```

## TailwindCSS Utilities for Responsive Design

### Display Classes
```css
/* Show/Hide by breakpoint */
.hidden           /* Hidden on all */
.md:hidden        /* Hidden on tablet+ */
.md:block         /* Show on tablet+ */
.lg:flex          /* Flex on desktop+ */

/* Grid responsiveness */
.grid-cols-1              /* Mobile: 1 column */
.sm:grid-cols-2           /* Tablet: 2 columns */
.lg:grid-cols-3           /* Desktop: 3 columns */
.xl:grid-cols-4           /* Large desktop: 4 columns */
```

### Spacing
```css
/* Responsive padding */
.p-4              /* Base: 1rem */
.md:p-6           /* Tablet: 1.5rem */
.lg:p-8           /* Desktop: 2rem */

/* Responsive gaps */
.gap-4            /* Base */
.md:gap-6         /* Tablet */
.lg:gap-8         /* Desktop */
```

### Typography
```css
/* Responsive font sizes */
.text-2xl         /* Mobile: 24px */
.md:text-3xl      /* Tablet: 30px */
.lg:text-4xl      /* Desktop: 36px */

/* Responsive line heights */
.leading-tight    /* Base */
.md:leading-normal /* Tablet+ */
```

## Testing Responsive Design

### Manual Testing Checklist

**Mobile (375px - iPhone SE)**
- [ ] Navigation is accessible (bottom nav or hamburger)
- [ ] Cards stack vertically
- [ ] Text is readable (min 16px body)
- [ ] Buttons are tap-friendly (min 44x44px)
- [ ] Forms are usable (full width inputs)
- [ ] Charts are legible
- [ ] No horizontal scroll

**Tablet (768px - iPad)**
- [ ] 2-column layouts work
- [ ] Table shows priority columns
- [ ] Navigation is clear (top nav or drawer)
- [ ] Charts display properly side-by-side
- [ ] Touch targets appropriate

**Desktop (1920px)**
- [ ] Multi-column layouts utilized
- [ ] All table columns visible
- [ ] Sidebar navigation persistent
- [ ] Charts maximize space
- [ ] Content doesn't feel sparse

### Automated Tests

```typescript
// responsive.spec.ts
describe('Responsive Design', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    it(`should render correctly on ${name}`, () => {
      cy.viewport(width, height);
      cy.visit('/portfolio');
      cy.matchImageSnapshot(`portfolio-${name}`);
    });
  });
});
```

## Performance Considerations

### Mobile Optimizations
- Lazy load charts (only when visible)
- Reduce chart data points on small screens
- Optimize images (WebP, responsive sizes)
- Minimize bundle size with tree-shaking
- Enable service worker for offline capability

### Asset Strategy
```typescript
// Responsive images
<img
  srcset="
    logo-small.png 320w,
    logo-medium.png 768w,
    logo-large.png 1200w
  "
  sizes="
    (max-width: 640px) 320px,
    (max-width: 1024px) 768px,
    1200px
  "
  src="logo-medium.png"
  alt="Logo"
>
```

## Accessibility in Responsive Design

- Touch targets: Min 44x44px on mobile
- Font size: Min 16px body text
- Contrast: WCAG AA minimum (4.5:1)
- Focus indicators: Visible on all interactive elements
- Semantic HTML: Proper heading hierarchy
- ARIA labels: For icon-only buttons on mobile

## Implementation Priority

1. **Mobile First** ✅ Start here
   - Base styles for mobile
   - Card layouts
   - Bottom navigation

2. **Tablet Adaptation**
   - 2-column grids
   - Responsive tables
   - Top navigation

3. **Desktop Enhancement**
   - Full layouts
   - All columns visible
   - Sidebar navigation

## Browser Support

- Chrome 90+ (Android/iOS/Desktop)
- Safari 14+ (iOS/macOS)
- Firefox 88+ (Android/Desktop)
- Edge 90+ (Windows)

**No support for:**
- IE11
- Opera Mini
- UC Browser (limited CSS support)
