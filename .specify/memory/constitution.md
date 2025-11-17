# Binance Portfolio Tracker Constitution

## Core Principles

### I. Security-First (NON-NEGOTIABLE)
- API keys and sensitive data NEVER stored in plain text or committed to version control
- All API keys stored in environment variables or secure vault
- Backend-only API communication - frontend never exposes API keys
- Rate limiting implemented to prevent API abuse
- Input validation and sanitization on all user inputs
- HTTPS only for production deployment

### II. Type Safety & Data Validation
- TypeScript strict mode enabled across the entire codebase
- All API responses validated with Zod or similar schema validation
- No `any` types except where absolutely necessary with justification
- All monetary values handled with proper decimal precision (avoid floating point errors)
- Data models defined with clear interfaces/types

### III. Modular Architecture
- Clear separation: Frontend (UI) / Backend (API integration) / Services (business logic)
- Each module has a single, well-defined responsibility
- API integration layer isolated from business logic
- Reusable components for UI (charts, tables, cards)
- Service layer for portfolio calculations, PnL, statistics

### IV. API Integration Reliability
- Graceful handling of Binance API failures and rate limits
- Exponential backoff and retry logic for failed requests
- Caching strategy for API responses to minimize calls
- Error handling with user-friendly messages
- Mock API responses for development and testing

### V. Testing Strategy
- Unit tests for business logic (calculations, transformations)
- Integration tests for Binance API interaction
- Component tests for critical UI components
- End-to-end tests for main user flows
- Test with realistic mock data (historical crypto prices)

### VI. Performance & Real-Time Updates
- Efficient polling or WebSocket for real-time price updates
- Pagination for large portfolios
- Lazy loading and code splitting for frontend
- Optimized re-renders (React.memo, useMemo, useCallback)
- Background refresh without blocking UI

### VII. Observability & User Experience
- Structured logging for all API calls and errors
- Loading states for all async operations
- Error boundaries to catch and display errors gracefully
- Clear feedback for user actions (success/error notifications)
- Responsive design for mobile and desktop

## Security Requirements

### Data Protection
- Environment variables for all secrets (.env file, never committed)
- API keys with read-only permissions only (no trading permissions)
- Session management if authentication is added later
- CORS configuration properly set up

### Code Security
- Dependencies regularly updated and audited
- No exposed endpoints without rate limiting
- Sanitize all user inputs before API calls
- Validate all data before storage

## Development Workflow

### Code Quality
- ESLint and Prettier configured and enforced
- Pre-commit hooks for linting and type checking
- Code reviews for all changes
- Clear commit messages following conventional commits

### Documentation
- README with setup instructions and architecture overview
- API integration documented (endpoints used, rate limits)
- Component documentation for complex UI components
- Environment variables documented in .env.example

### Deployment
- Separate development and production environments
- CI/CD pipeline with automated tests
- Environment-specific configuration
- Deployment checklist (env vars, API keys, HTTPS)

## Governance

This constitution defines the non-negotiable standards for the Binance Portfolio Tracker project. All code must comply with these principles, especially security and type safety requirements.

When in doubt:
- Prioritize security over convenience
- Prefer explicit types over implicit
- Keep modules small and focused
- Test critical paths thoroughly

**Version**: 1.0.0 | **Ratified**: 2025-11-17 | **Last Amended**: 2025-11-17
