// T051: Binance API adapter implementation

import axios, { AxiosInstance } from 'axios';
import { MarketDataAdapter, CryptoPrice, PriceHistory, Timeframe, AdapterConfig } from './market-data.types';
import { retry } from '../../shared/utils/retry.util';
import { logger } from '../../shared/services/logger.service';

export class BinanceAdapter implements MarketDataAdapter {
  private readonly client: AxiosInstance;
  private readonly config: AdapterConfig;
  private readonly BASE_URL = 'https://api.binance.com/api/v3';

  constructor(config: AdapterConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: this.BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getCurrentPrice(symbol: string): Promise<CryptoPrice> {
    try {
      const binanceSymbol = `${symbol}USDT`;

      const [ticker, stats] = await Promise.all([
        this.client.get(`/ticker/24hr`, { params: { symbol: binanceSymbol } }),
        this.client.get(`/ticker/price`, { params: { symbol: binanceSymbol } }),
      ]);

      const tickerData = ticker.data;
      const priceData = stats.data;

      return {
        symbol,
        name: this.getFullName(symbol),
        price: parseFloat(priceData.price),
        change24h: parseFloat(tickerData.priceChangePercent),
        volume24h: parseFloat(tickerData.volume) * parseFloat(priceData.price),
        marketCap: 0, // Binance doesn't provide market cap
        high24h: parseFloat(tickerData.highPrice),
        low24h: parseFloat(tickerData.lowPrice),
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error(`Binance adapter error for ${symbol}:`, error);
      throw error;
    }
  }

  async getMultiplePrices(symbols: string[]): Promise<Map<string, CryptoPrice>> {
    try {
      const binanceSymbols = symbols.map(s => `${s}USDT`);

      const response = await this.client.get('/ticker/24hr', {
        params: { symbols: JSON.stringify(binanceSymbols) },
      });

      const pricesMap = new Map<string, CryptoPrice>();

      for (const ticker of response.data) {
        const symbol = ticker.symbol.replace('USDT', '');

        if (symbols.includes(symbol)) {
          pricesMap.set(symbol, {
            symbol,
            name: this.getFullName(symbol),
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent),
            volume24h: parseFloat(ticker.volume) * parseFloat(ticker.lastPrice),
            marketCap: 0,
            high24h: parseFloat(ticker.highPrice),
            low24h: parseFloat(ticker.lowPrice),
            lastUpdated: new Date(),
          });
        }
      }

      return pricesMap;
    } catch (error) {
      logger.error('Binance adapter error for multiple prices:', error);
      throw error;
    }
  }

  async getHistoricalPrices(symbol: string, timeframe: Timeframe): Promise<PriceHistory[]> {
    try {
      const binanceSymbol = `${symbol}USDT`;
      const { interval, limit } = this.getTimeframeParams(timeframe);

      const response = await this.client.get('/klines', {
        params: {
          symbol: binanceSymbol,
          interval,
          limit,
        },
      });

      return response.data.map((kline: unknown[]) => ({
        timestamp: new Date(kline[0] as number),
        price: parseFloat(kline[4] as string), // Close price
        volume: parseFloat(kline[5] as string),
      }));
    } catch (error) {
      logger.error(`Binance adapter error for historical data ${symbol}:`, error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/ping');
      return response.status === 200;
    } catch (error) {
      logger.warn('Binance API unavailable:', error);
      return false;
    }
  }

  private getTimeframeParams(timeframe: Timeframe): { interval: string; limit: number } {
    const params: Record<Timeframe, { interval: string; limit: number }> = {
      '1h': { interval: '1m', limit: 60 },
      '24h': { interval: '1h', limit: 24 },
      '7d': { interval: '1h', limit: 168 },
      '30d': { interval: '1d', limit: 30 },
      '1y': { interval: '1d', limit: 365 },
    };

    return params[timeframe];
  }

  private getFullName(symbol: string): string {
    const names: Record<string, string> = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      ADA: 'Cardano',
      SOL: 'Solana',
      DOT: 'Polkadot',
      MATIC: 'Polygon',
      AVAX: 'Avalanche',
      LINK: 'Chainlink',
      UNI: 'Uniswap',
      ATOM: 'Cosmos',
    };

    return names[symbol] || symbol;
  }
}
