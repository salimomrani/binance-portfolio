# Crypto Portfolio Dashboard

A comprehensive cryptocurrency portfolio tracking and monitoring application that allows users to view their holdings, track gains/losses, visualize portfolio data through charts, and monitor market trends.

## Features

- **Portfolio Overview**: View all cryptocurrency holdings with real-time valuations
- **Gains & Losses Tracking**: Monitor investment performance with detailed P&L calculations
- **Interactive Charts**: Visualize portfolio allocation and performance trends
- **Market Trends**: Track cryptocurrency price movements and market indicators
- **Watchlist**: Monitor cryptocurrencies you don't own to identify investment opportunities
- **Real-time Data**: Portfolio values update within 60 seconds of market changes

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Prisma
- **Cache**: Redis
- **Validation**: Zod
- **Testing**: Jest
- **Security**: Helmet, CORS, Rate Limiting

### Frontend
- **Framework**: Angular 19
- **State Management**: NgRx
- **Charts**: Chart.js
- **Styling**: Tailwind CSS
- **Testing**: Jasmine & Karma

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database Management**: pgAdmin (optional)

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd binance-portfolio
```

### 2. Start Infrastructure Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

To include pgAdmin for database management:

```bash
docker-compose --profile tools up -d
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:3000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend application will be available at `http://localhost:4200`

## Development

### Backend Commands

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format

# Prisma commands
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database
```

### Frontend Commands

```bash
# Development server
npm start
# or
ng serve

# Build for production
npm run build
# or
ng build

# Run tests
npm test
# or
ng test

# Build and watch for changes
npm run watch
# or
ng build --watch --configuration development
```

### Docker Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Start with pgAdmin
docker-compose --profile tools up -d
```

**Service Ports:**
- PostgreSQL: `5433`
- Redis: `6379`
- pgAdmin: `5050` (http://localhost:5050)

**pgAdmin Credentials:**
- Email: `admin@cryptoportfolio.local`
- Password: `admin`

## Project Structure

```
binance-portfolio/
├── backend/                # Backend API (Node.js/Express)
│   ├── src/               # Source code
│   ├── tests/             # Test files
│   ├── prisma/            # Database schema and migrations
│   └── package.json
├── frontend/              # Frontend application (Angular)
│   ├── src/               # Source code
│   └── package.json
├── specs/                 # Feature specifications and documentation
│   └── 001-crypto-portfolio-dashboard/
├── docker-compose.yml     # Docker services configuration
└── README.md
```

## Environment Variables

### Backend (.env)

Create a `.env` file in the `backend/` directory based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://crypto_user:crypto_password_dev@localhost:5433/crypto_portfolio_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# Application
PORT=3000
NODE_ENV=development

# API Keys (add your keys)
BINANCE_API_KEY=your_api_key_here
BINANCE_API_SECRET=your_api_secret_here
```

## API Documentation

The backend API provides endpoints for:
- Portfolio management
- Cryptocurrency price data
- User watchlists
- Market trends and analytics

For detailed API documentation, see the backend source code or run Prisma Studio:

```bash
cd backend
npm run prisma:studio
```

## Testing

### Backend Tests

```bash
cd backend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### Frontend Tests

```bash
cd frontend
npm test                # Run all tests
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please create an issue in the repository.

---

**Note**: This application is for educational and personal use. Always ensure you're complying with cryptocurrency exchange APIs' terms of service and rate limits.
