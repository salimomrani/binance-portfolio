---
description: "Task list for UI/UX Modernization with TailwindCSS"
---

# Tasks: UI/UX Modernization with TailwindCSS

**Branch**: `005-ui-tailwind-responsive`
**Input**: Design documents from `/specs/005-ui-tailwind-responsive/`
**Prerequisites**: plan.md ✅, spec.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1=Dark Mode, US2=Responsive, US3=Visual Design, US4=Components, US5=Accessibility)

## Path Conventions

- Web app: `frontend/src/`, `frontend/tests/`
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and prepare configuration

- [X] T001 Install @angular/cdk dependency in frontend
- [X] T002 [P] Extend Tailwind config with darkMode: 'class'
- [X] T003 [P] Create frontend/src/styles/animations.css for custom animations
- [X] T004 [P] Create frontend/src/styles/design-tokens.css for CSS variables

---

## Phase 2: User Story 1 - Dark Mode Support (Priority: P1) 🎯 MVP

**Goal**: Implémenter le dark mode complet avec toggle et sauvegarde de préférence

**Independent Test**: Toggle dark/light mode dans le header, vérifier que tous les composants s'adaptent et que la préférence persiste après reload

### Implementation for User Story 1

- [X] T010 [P] [US1] Create ThemeService in frontend/src/app/core/services/theme.service.ts
- [X] T011 [P] [US1] Create ThemeService tests in frontend/src/app/core/services/theme.service.spec.ts
- [X] T012 [US1] Add dark mode classes to tailwind.config.js theme.extend.colors
- [X] T013 [US1] Add dark mode global styles in frontend/src/styles/globals.css
- [X] T014 [US1] Inject ThemeService in app.component.ts and add theme toggle logic
- [X] T015 [US1] Add dark/light mode toggle button in app.component.html header
- [X] T016 [US1] Update app.component.html sidebar with dark mode classes
- [X] T017 [US1] Update app.component.html mobile navigation with dark mode classes
- [X] T018 [P] [US1] Modernize portfolio-dashboard.component.html with dark mode classes
- [X] T019 [P] [US1] Modernize portfolio-summary.component.html with dark mode classes
- [X] T020 [P] [US1] Modernize portfolio-table.component.html with dark mode classes
- [X] T021 [P] [US1] Modernize portfolio-stats.component.html with dark mode classes
- [X] T022 [P] [US1] Modernize holdings.component.html with dark mode classes
- [X] T023 [P] [US1] Modernize watchlist.component.html with dark mode classes
- [X] T024 [P] [US1] Modernize market-trends.component.html with dark mode classes
- [X] T025 [P] [US1] Modernize market-overview.component.html with dark mode classes
- [X] T026 [P] [US1] Modernize crypto-detail.component.html with dark mode classes
- [X] T027 [P] [US1] Modernize all shared components (loading-spinner, error-message, badges) with dark mode classes

**Checkpoint**: Dark mode fonctionnel sur tous les composants, préférence sauvegardée, détection système OS

---

## Phase 3: User Story 2 - Responsive Design Optimization (Priority: P1) 🎯 MVP

**Goal**: Optimiser le responsive design pour mobile, tablet et desktop

**Independent Test**: Redimensionner le navigateur de 320px à 2560px et vérifier que l'interface s'adapte correctement

### Implementation for User Story 2

- [X] T030 [P] [US2] Create ResponsiveService in frontend/src/app/core/services/responsive.service.ts
- [X] T031 [P] [US2] Create ResponsiveService tests in frontend/src/app/core/services/responsive.service.spec.ts
- [X] T032 [US2] Add responsive breakpoints to tailwind.config.js screens
- [X] T033 [US2] Optimize app.component.html grid layouts with responsive classes (sm:, md:, lg:, xl:)
- [X] T034 [US2] Optimize portfolio-dashboard.component.html grid from grid-cols-1 to responsive grid
- [X] T035 [US2] Add horizontal scroll + sticky first column to portfolio-table.component.html
- [X] T036 [P] [US2] Optimize portfolio-summary cards layout for mobile stacking
- [X] T037 [P] [US2] Optimize portfolio-stats grid for tablet 2-column layout
- [X] T038 [P] [US2] Optimize holdings.component.html responsive layout
- [X] T039 [P] [US2] Optimize watchlist.component.html responsive layout
- [X] T040 [P] [US2] Optimize market-overview cards for mobile/tablet/desktop
- [X] T041 [P] [US2] Add responsive text sizes (text-sm sm:text-base lg:text-lg) across components
- [X] T042 [P] [US2] Add responsive spacing (p-4 sm:p-6 lg:p-10) across components
- [X] T043 [US2] Test all breakpoints: 320px, 640px, 768px, 1024px, 1920px

**Checkpoint**: Interface parfaitement responsive sur tous les devices, sticky columns, grids adaptatives

---

## Phase 4: User Story 3 - Enhanced Visual Design (Priority: P2)

**Goal**: Ajouter animations, gradients, ombres et effets visuels modernes

**Independent Test**: Survoler les boutons/cards et vérifier les animations, observer les animations de chargement

### Implementation for User Story 3

- [ ] T050 [P] [US3] Add custom animations to tailwind.config.js (fade-in, slide-up, flash-price)
- [ ] T051 [P] [US3] Create animations.css with @keyframes for flash-green, flash-red, fade-in
- [ ] T052 [P] [US3] Add transition classes to all buttons (transition-all duration-200 ease-in-out)
- [ ] T053 [P] [US3] Add hover effects to buttons (hover:scale-105 hover:shadow-lg)
- [ ] T054 [P] [US3] Add hover effects to cards (hover:shadow-xl hover:-translate-y-1)
- [ ] T055 [P] [US3] Add gradients to portfolio summary cards (bg-gradient-to-br)
- [ ] T056 [P] [US3] Add subtle gradients to dashboard header
- [ ] T057 [US3] Implement price flash animation in portfolio-table (green=up, red=down)
- [ ] T058 [P] [US3] Add fade-in animation to data loading states
- [ ] T059 [P] [US3] Add modern shadows to sidebar and mobile nav (shadow-lg shadow-xl)
- [ ] T060 [US3] Add prefers-reduced-motion media query in animations.css
- [ ] T061 [P] [US3] Update tailwind.config.js with custom shadow scales
- [ ] T062 [P] [US3] Add border-radius tokens (rounded-2xl, rounded-3xl) to components

**Checkpoint**: Animations fluides <200ms, gradients subtils, ombres modernes, respect prefers-reduced-motion

---

## Phase 5: User Story 4 - Improved Component Design (Priority: P2)

**Goal**: Moderniser les composants avec meilleurs états visuels et ergonomie

**Independent Test**: Interagir avec formulaires, boutons, modals et vérifier les états (focus, hover, loading, error)

### Implementation for User Story 4

- [ ] T070 [P] [US4] Create FocusTrapDirective in frontend/src/app/shared/directives/focus-trap.directive.ts
- [ ] T071 [P] [US4] Add design tokens to tailwind.config.js theme.extend (spacing, fontSizes, etc.)
- [ ] T072 [P] [US4] Modernize all form inputs with floating labels pattern
- [ ] T073 [P] [US4] Add focus ring styles to all interactive elements (focus:ring-2 focus:ring-primary)
- [ ] T074 [P] [US4] Add loading states to all action buttons (spinner + disabled state)
- [ ] T075 [US4] Apply FocusTrapDirective to add-holding-dialog.component
- [ ] T076 [US4] Apply FocusTrapDirective to add-transaction-dialog.component
- [ ] T077 [US4] Apply FocusTrapDirective to add-to-watchlist-dialog.component
- [ ] T078 [P] [US4] Add overlay backdrop to all modals (bg-black/50 backdrop-blur-sm)
- [ ] T079 [P] [US4] Add ESC key handler to close all modals
- [ ] T080 [P] [US4] Add error states to form inputs (border-red-500 text-red-600)
- [ ] T081 [P] [US4] Add success states to form inputs (border-green-500 text-green-600)
- [ ] T082 [P] [US4] Modernize button variants (primary, secondary, outline, ghost)
- [ ] T083 [P] [US4] Add disabled states to all buttons (opacity-50 cursor-not-allowed)

**Checkpoint**: Formulaires avec floating labels, boutons avec loading states, modals avec focus trap, états visuels clairs

---

## Phase 6: User Story 5 - Accessibility Improvements (Priority: P3)

**Goal**: Garantir WCAG 2.1 AA compliance et navigation clavier complète

**Independent Test**: Navigation clavier Tab/Shift+Tab, lecteur d'écran, tests Lighthouse

### Implementation for User Story 5

- [ ] T090 [P] [US5] Create ReducedMotionDirective in frontend/src/app/shared/directives/reduced-motion.directive.ts
- [ ] T091 [P] [US5] Add aria-label to all icon-only buttons
- [ ] T092 [P] [US5] Add aria-describedby to form inputs with error messages
- [ ] T093 [P] [US5] Add role attributes to custom UI elements (role="dialog", role="button")
- [ ] T094 [P] [US5] Add sr-only class for screen reader only labels
- [ ] T095 [P] [US5] Verify all color contrasts meet WCAG 2.1 AA (4.5:1 ratio)
- [ ] T096 [P] [US5] Add skip navigation link for keyboard users
- [ ] T097 [P] [US5] Add focus-visible styles (remove outline on mouse click, show on keyboard focus)
- [ ] T098 [P] [US5] Add aria-live regions for dynamic content updates (price changes)
- [ ] T099 [P] [US5] Add aria-expanded to expandable elements
- [ ] T100 [P] [US5] Add aria-selected to tab navigation
- [ ] T101 [US5] Test keyboard navigation on all pages (Tab order logical)
- [ ] T102 [US5] Create Lighthouse accessibility test config in frontend/tests/a11y/lighthouse.config.js
- [ ] T103 [US5] Run Lighthouse tests and fix issues to reach >90 score
- [ ] T104 [US5] Test with screen reader (NVDA or VoiceOver) and fix issues

**Checkpoint**: Navigation clavier complète, aria labels complets, Lighthouse score >90/100, lecteur d'écran fonctionnel

---

## Phase 7: Testing & Validation

**Purpose**: Valider l'implémentation complète et les success criteria

- [ ] T110 [P] Run unit tests for ThemeService (coverage >90%)
- [ ] T111 [P] Run unit tests for ResponsiveService (coverage >90%)
- [ ] T112 [P] Test dark/light mode toggle performance (<100ms)
- [ ] T113 [P] Test animations performance (60fps, <200ms trigger)
- [ ] T114 Test responsive breakpoints manually (320px, 768px, 1024px, 1920px, 2560px)
- [ ] T115 [P] Run Lighthouse accessibility audit (target >90/100)
- [ ] T116 [P] Run Lighthouse performance audit
- [ ] T117 Test keyboard navigation on all pages
- [ ] T118 Test with screen reader (NVDA or VoiceOver)
- [ ] T119 [P] Visual regression tests (optional - Percy/Chromatic)
- [ ] T120 Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## Phase 8: Documentation & Polish

**Purpose**: Finaliser la documentation et les détails

- [ ] T130 [P] Update CLAUDE.md with new UI/UX guidelines
- [ ] T131 [P] Document design tokens usage in README
- [ ] T132 [P] Create component showcase/style guide (optional)
- [ ] T133 [P] Add code comments for accessibility patterns
- [ ] T134 Final review and cleanup

---

## Success Criteria Checklist

Référence spec.md Success Criteria:

- [ ] **SC-001**: Lighthouse Accessibility score >90/100
- [ ] **SC-002**: All color contrasts pass WCAG 2.1 AA (ratio 4.5:1)
- [ ] **SC-003**: Complete keyboard navigation without mouse
- [ ] **SC-004**: All animations trigger <200ms and run at 60fps
- [ ] **SC-005**: App works correctly from 320px to 2560px screens
- [ ] **SC-006**: Dark mode toggle takes <100ms without flash
- [ ] **SC-007**: Design tokens consistent across components
- [ ] **SC-008**: Visual tests cover all components (optional)

---

## Task Summary

**Total Tasks**: 134
- Phase 1 (Setup): 4 tasks
- Phase 2 (US1 - Dark Mode): 18 tasks
- Phase 3 (US2 - Responsive): 14 tasks
- Phase 4 (US3 - Visual Design): 13 tasks
- Phase 5 (US4 - Components): 14 tasks
- Phase 6 (US5 - Accessibility): 15 tasks
- Phase 7 (Testing): 11 tasks
- Phase 8 (Documentation): 5 tasks
- Success Criteria: 8 items

**Estimated Effort**: 5-7 days for complete implementation

**Parallelization**: ~60% of tasks can run in parallel within each phase

---

## Implementation Notes

1. **Phase Dependencies**: Complete Phase 1 (Setup) and Phase 2 (Dark Mode) before other phases
2. **Parallel Execution**: Tasks marked [P] within same phase can be done simultaneously
3. **Testing**: Run tests incrementally as each phase completes
4. **Review Points**: End of each User Story phase (US1-US5)
5. **Final Gate**: All Success Criteria must pass before marking feature complete
