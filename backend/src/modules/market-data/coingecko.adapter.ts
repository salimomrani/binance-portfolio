// T052: CoinGecko API adapter as fallback

import axios, { AxiosInstance } from 'axios';
import { MarketDataAdapter, CryptoPrice, PriceHistory, Timeframe, AdapterConfig } from './market-data.types';
import { logger } from '../../shared/services/logger.service';

export class CoinGeckoAdapter implements MarketDataAdapter {
  private readonly client: AxiosInstance;
  private readonly config: AdapterConfig;
  private readonly BASE_URL = 'https://api.coingecko.com/api/v3';

  // Map crypto symbols to CoinGecko IDs
  private readonly COIN_IDS: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    ADA: 'cardano',
    SOL: 'solana',
    DOT: 'polkadot',
    MATIC: 'matic-network',
    AVAX: 'avalanche-2',
    LINK: 'chainlink',
    UNI: 'uniswap',
    ATOM: 'cosmos',
  };

  constructor(config: AdapterConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: this.BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.coingeckoApiKey && { 'x-cg-pro-api-key': config.coingeckoApiKey }),
      },
    });
  }

  async getCurrentPrice(symbol: string): Promise<CryptoPrice> {
    try {
      const coinId = this.getCoinId(symbol);

      const response = await this.client.get(`/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
        },
      });

      const data = response.data;
      const marketData = data.market_data;

      return {
        symbol,
        name: data.name,
        price: marketData.current_price.usd,
        change1h: marketData.price_change_percentage_1h_in_currency?.usd || 0,
        change24h: marketData.price_change_percentage_24h || 0,
        change7d: marketData.price_change_percentage_7d || 0,
        change30d: marketData.price_change_percentage_30d || 0,
        volume24h: marketData.total_volume.usd,
        marketCap: marketData.market_cap.usd,
        high24h: marketData.high_24h.usd,
        low24h: marketData.low_24h.usd,
        lastUpdated: new Date(data.last_updated),
      };
    } catch (error) {
      logger.error(`CoinGecko adapter error for ${symbol}:`, error);
      throw error;
    }
  }

  async getMultiplePrices(symbols: string[]): Promise<Map<string, CryptoPrice>> {
    try {
      const coinIds = symbols.map(s => this.getCoinId(s));

      const response = await this.client.get('/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids: coinIds.join(','),
          order: 'market_cap_desc',
          per_page: symbols.length,
          page: 1,
          sparkline: false,
          price_change_percentage: '1h,24h,7d,30d',
        },
      });

      const pricesMap = new Map<string, CryptoPrice>();

      for (const coin of response.data) {
        const symbol = this.getSymbolFromId(coin.id);

        if (symbol) {
          pricesMap.set(symbol, {
            symbol,
            name: coin.name,
            price: coin.current_price,
            change1h: coin.price_change_percentage_1h_in_currency || 0,
            change24h: coin.price_change_percentage_24h || 0,
            change7d: coin.price_change_percentage_7d || 0,
            change30d: coin.price_change_percentage_30d || 0,
            volume24h: coin.total_volume,
            marketCap: coin.market_cap,
            high24h: coin.high_24h,
            low24h: coin.low_24h,
            lastUpdated: new Date(coin.last_updated),
          });
        }
      }

      return pricesMap;
    } catch (error) {
      logger.error('CoinGecko adapter error for multiple prices:', error);
      throw error;
    }
  }

  async getHistoricalPrices(symbol: string, timeframe: Timeframe): Promise<PriceHistory[]> {
    try {
      const coinId = this.getCoinId(symbol);
      const days = this.getTimeframeDays(timeframe);

      const response = await this.client.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days,
        },
      });

      return response.data.prices.map((point: [number, number]) => ({
        timestamp: new Date(point[0]),
        price: point[1],
        volume: 0, // CoinGecko separates volume data
      }));
    } catch (error) {
      logger.error(`CoinGecko adapter error for historical data ${symbol}:`, error);
      throw error;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/ping');
      return response.status === 200 && response.data.gecko_says === '(V3) To the Moon!';
    } catch (error) {
      logger.warn('CoinGecko API unavailable:', error);
      return false;
    }
  }

  private getCoinId(symbol: string): string {
    const coinId = this.COIN_IDS[symbol];
    if (!coinId) {
      throw new Error(`Unknown cryptocurrency symbol: ${symbol}`);
    }
    return coinId;
  }

  private getSymbolFromId(coinId: string): string | null {
    for (const [symbol, id] of Object.entries(this.COIN_IDS)) {
      if (id === coinId) {
        return symbol;
      }
    }
    return null;
  }

  private getTimeframeDays(timeframe: Timeframe): number {
    const days: Record<Timeframe, number> = {
      '1h': 0.042, // 1 hour
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '1y': 365,
    };

    return days[timeframe];
  }
}
