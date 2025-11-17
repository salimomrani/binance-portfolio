import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create a demo user
  const passwordHash = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@cryptoportfolio.com' },
    update: {},
    create: {
      email: 'demo@cryptoportfolio.com',
      passwordHash,
      firstName: 'Demo',
      lastName: 'User',
    },
  });

  console.log(`Created user: ${user.email}`);

  // Create user preferences
  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      currency: 'USD',
      theme: 'light',
      defaultView: 'table',
      priceAlerts: false,
    },
  });

  console.log('Created user preferences');

  // Seed initial price cache for popular cryptocurrencies
  const cryptoData = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: new Decimal('42500.50'),
      change1h: new Decimal('0.5'),
      change24h: new Decimal('2.3'),
      change7d: new Decimal('5.7'),
      change30d: new Decimal('12.4'),
      volume24h: new Decimal('28500000000'),
      marketCap: new Decimal('835000000000'),
      high24h: new Decimal('43200.00'),
      low24h: new Decimal('41800.00'),
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: new Decimal('2250.75'),
      change1h: new Decimal('0.3'),
      change24h: new Decimal('1.8'),
      change7d: new Decimal('4.2'),
      change30d: new Decimal('8.9'),
      volume24h: new Decimal('15200000000'),
      marketCap: new Decimal('270000000000'),
      high24h: new Decimal('2280.00'),
      low24h: new Decimal('2220.00'),
    },
    {
      symbol: 'BNB',
      name: 'BNB',
      price: new Decimal('312.45'),
      change1h: new Decimal('-0.2'),
      change24h: new Decimal('1.2'),
      change7d: new Decimal('3.5'),
      change30d: new Decimal('15.2'),
      volume24h: new Decimal('1200000000'),
      marketCap: new Decimal('48000000000'),
      high24h: new Decimal('315.00'),
      low24h: new Decimal('308.00'),
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      price: new Decimal('98.32'),
      change1h: new Decimal('0.8'),
      change24h: new Decimal('3.5'),
      change7d: new Decimal('8.2'),
      change30d: new Decimal('22.1'),
      volume24h: new Decimal('2500000000'),
      marketCap: new Decimal('42000000000'),
      high24h: new Decimal('99.50'),
      low24h: new Decimal('96.00'),
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      price: new Decimal('0.52'),
      change1h: new Decimal('0.1'),
      change24h: new Decimal('1.5'),
      change7d: new Decimal('3.8'),
      change30d: new Decimal('10.5'),
      volume24h: new Decimal('450000000'),
      marketCap: new Decimal('18000000000'),
      high24h: new Decimal('0.53'),
      low24h: new Decimal('0.51'),
    },
  ];

  for (const crypto of cryptoData) {
    await prisma.priceCache.upsert({
      where: { symbol: crypto.symbol },
      update: {
        ...crypto,
        lastUpdated: new Date(),
        source: 'binance',
      },
      create: {
        ...crypto,
        lastUpdated: new Date(),
        source: 'binance',
      },
    });
    console.log(`Seeded price cache for ${crypto.symbol}`);
  }

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
