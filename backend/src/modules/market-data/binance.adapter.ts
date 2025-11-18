// T051: Binance API adapter implementation
// T143: Enhanced to support full market data with all trend indicators

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import {
  MarketDataAdapter,
  CryptoPrice,
  CryptoMarketData,
  PriceHistory,
  Timeframe,
  AdapterConfig,
} from './market-data.types';
import { logger } from '../../shared/services/logger.service';
import {
  BinanceFlexiblePosition,
  BinanceLockedPosition,
  BinanceFlexibleReward,
  BinanceLockedReward,
  EarnPosition,
  EarnReward,
} from './binance-earn.types';

export interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export class BinanceAdapter implements MarketDataAdapter {
  private readonly client: AxiosInstance;
  private readonly sapiClient: AxiosInstance;
  private readonly BASE_URL = 'https://api.binance.com/api/v3';
  private readonly SAPI_BASE_URL = 'https://api.binance.com/sapi/v1';
  private readonly apiKey?: string;
  private readonly apiSecret?: string;

  constructor(config: AdapterConfig) {
    this.apiKey = config.binanceApiKey;
    this.apiSecret = config.binanceSecretKey;

    this.client = axios.create({
      baseURL: this.BASE_URL,
      timeout: config.retryDelay || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.binanceApiKey ? { 'X-MBX-APIKEY': config.binanceApiKey } : {}),
      },
    });

    // SAPI client for Earn endpoints
    this.sapiClient = axios.create({
      baseURL: this.SAPI_BASE_URL,
      timeout: config.retryDelay || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.binanceApiKey ? { 'X-MBX-APIKEY': config.binanceApiKey } : {}),
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

  /**
   * T143: Get full market data with all trend indicators (1h, 24h, 7d, 30d)
   */
  async getFullMarketData(symbol: string): Promise<CryptoMarketData> {
    try {
      const binanceSymbol = `${symbol}USDT`;

      // Fetch current price and 24h stats
      const [ticker, currentPrice] = await Promise.all([
        this.client.get(`/ticker/24hr`, { params: { symbol: binanceSymbol } }),
        this.client.get(`/ticker/price`, { params: { symbol: binanceSymbol } }),
      ]);

      const tickerData = ticker.data;
      const price = parseFloat(currentPrice.data.price);

      // Calculate percentage changes from historical data
      const now = Date.now();
      const changes = await Promise.all([
        this.calculatePercentageChange(binanceSymbol, price, now - 60 * 60 * 1000), // 1h ago
        this.calculatePercentageChange(binanceSymbol, price, now - 7 * 24 * 60 * 60 * 1000), // 7d ago
        this.calculatePercentageChange(binanceSymbol, price, now - 30 * 24 * 60 * 60 * 1000), // 30d ago
      ]);

      return {
        symbol,
        name: this.getFullName(symbol),
        price,
        change1h: changes[0],
        change24h: parseFloat(tickerData.priceChangePercent),
        change7d: changes[1],
        change30d: changes[2],
        volume24h: parseFloat(tickerData.volume) * price,
        marketCap: 0, // Binance doesn't provide market cap - would need CoinGecko
        high24h: parseFloat(tickerData.highPrice),
        low24h: parseFloat(tickerData.lowPrice),
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error(`Binance adapter error for full market data ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Calculate percentage change between current price and historical price
   */
  private async calculatePercentageChange(
    binanceSymbol: string,
    currentPrice: number,
    timestamp: number
  ): Promise<number> {
    try {
      const response = await this.client.get('/klines', {
        params: {
          symbol: binanceSymbol,
          interval: '1h',
          startTime: timestamp - 60 * 60 * 1000, // 1 hour before timestamp
          endTime: timestamp + 60 * 60 * 1000, // 1 hour after timestamp
          limit: 1,
        },
      });

      if (response.data.length === 0) {
        return 0; // No data available
      }

      const historicalPrice = parseFloat(response.data[0][4]); // Close price
      const change = ((currentPrice - historicalPrice) / historicalPrice) * 100;
      return parseFloat(change.toFixed(4));
    } catch (error) {
      logger.warn(`Failed to calculate percentage change for ${binanceSymbol}:`, error);
      return 0; // Return 0 on error
    }
  }

  async getMultiplePrices(symbols: string[]): Promise<Map<string, CryptoPrice>> {
    try {
      const binanceSymbols = symbols.map((s) => `${s}USDT`);

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

  /**
   * Create HMAC SHA256 signature for authenticated requests
   */
  private createSignature(queryString: string): string {
    if (!this.apiSecret) {
      throw new Error('Binance API secret is required for authenticated requests');
    }
    return crypto.createHmac('sha256', this.apiSecret).update(queryString).digest('hex');
  }

  /**
   * Fetch account balances from Binance
   * Requires API key and secret to be configured
   */
  async getAccountBalances(): Promise<BinanceBalance[]> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('Binance API key and secret are required to fetch account balances');
      }

      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.createSignature(queryString);

      const response = await this.client.get('/account', {
        params: {
          timestamp,
          signature,
        },
      });

      // Filter out balances with 0 quantity
      const balances: BinanceBalance[] = response.data.balances.filter(
        (balance: BinanceBalance) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
      );

      logger.info(`Successfully fetched ${balances.length} non-zero balances from Binance`);
      return balances;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        logger.error('Binance account balances fetch error:', {
          message: error.message,
          code: error.response?.data?.code,
          msg: error.response?.data?.msg,
        });
      } else {
        logger.error('Binance account balances fetch error:', error);
      }
      throw error;
    }
  }

  /**
   * ============================================================================
   * BINANCE EARN API METHODS
   * ============================================================================
   */

  /**
   * Fetch flexible savings positions from Binance Earn
   * Endpoint: GET /sapi/v1/simple-earn/flexible/position
   */
  async getFlexibleEarnPositions(): Promise<EarnPosition[]> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('Binance API key and secret are required to fetch earn positions');
      }

      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.createSignature(queryString);

      const response = await this.sapiClient.get('/simple-earn/flexible/position', {
        params: {
          timestamp,
          signature,
        },
      });

      const positions: EarnPosition[] = response.data.rows.map((pos: BinanceFlexiblePosition) => ({
        asset: pos.asset,
        productId: pos.productId,
        productName: pos.productName || 'Flexible Savings',
        type: 'FLEXIBLE' as const,
        amount: parseFloat(pos.totalAmount),
        currentApy: parseFloat(pos.latestAnnualPercentageRate),
        dailyEarnings:
          pos.totalAmount && pos.latestAnnualPercentageRate
            ? (parseFloat(pos.totalAmount) * parseFloat(pos.latestAnnualPercentageRate)) / 365 / 100
            : undefined,
        canRedeem: pos.canRedeem,
        autoSubscribe: pos.autoSubscribe,
      }));

      logger.info(`Successfully fetched ${positions.length} flexible earn positions from Binance`);
      return positions;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        logger.error('Binance flexible earn positions fetch error:', {
          message: error.message,
          code: error.response?.data?.code,
          msg: error.response?.data?.msg,
        });
      } else {
        logger.error('Binance flexible earn positions fetch error:', error);
      }
      throw error;
    }
  }

  /**
   * Fetch locked staking positions from Binance Earn
   * Endpoint: GET /sapi/v1/simple-earn/locked/position
   */
  async getLockedEarnPositions(): Promise<EarnPosition[]> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('Binance API key and secret are required to fetch earn positions');
      }

      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.createSignature(queryString);

      const response = await this.sapiClient.get('/simple-earn/locked/position', {
        params: {
          timestamp,
          signature,
        },
      });

      const positions: EarnPosition[] = response.data.rows.map((pos: BinanceLockedPosition) => ({
        asset: pos.asset,
        productId: pos.projectId,
        productName: 'Locked Staking',
        type: 'LOCKED' as const,
        amount: parseFloat(pos.amount),
        currentApy: parseFloat(pos.apy),
        lockPeriod: parseInt(pos.duration),
        lockedUntil: new Date(pos.redeemDate),
        canRedeem: new Date(pos.redeemDate) <= new Date(),
        autoSubscribe: pos.isAutoRenew,
      }));

      logger.info(`Successfully fetched ${positions.length} locked earn positions from Binance`);
      return positions;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        logger.error('Binance locked earn positions fetch error:', {
          message: error.message,
          code: error.response?.data?.code,
          msg: error.response?.data?.msg,
        });
      } else {
        logger.error('Binance locked earn positions fetch error:', error);
      }
      throw error;
    }
  }

  /**
   * Fetch all earn positions (flexible + locked)
   */
  async getAllEarnPositions(): Promise<EarnPosition[]> {
    try {
      const [flexible, locked] = await Promise.all([
        this.getFlexibleEarnPositions(),
        this.getLockedEarnPositions(),
      ]);

      return [...flexible, ...locked];
    } catch (error) {
      logger.error('Error fetching all earn positions:', error);
      throw error;
    }
  }

  /**
   * Fetch flexible savings rewards history
   * Endpoint: GET /sapi/v1/simple-earn/flexible/history/rewardsRecord
   */
  async getFlexibleRewardsHistory(
    asset?: string,
    startTime?: number,
    endTime?: number
  ): Promise<EarnReward[]> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('Binance API key and secret are required to fetch rewards history');
      }

      const timestamp = Date.now();
      const params: Record<string, string | number> = {
        timestamp,
      };

      if (asset) params.asset = asset;
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;

      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      const signature = this.createSignature(queryString);

      const response = await this.sapiClient.get('/simple-earn/flexible/history/rewardsRecord', {
        params: {
          ...params,
          signature,
        },
      });

      const rewards: EarnReward[] = response.data.rows.map((reward: BinanceFlexibleReward) => ({
        asset: reward.asset,
        amount: parseFloat(reward.rewards),
        type: 'FLEXIBLE' as const,
        rewardDate: new Date(reward.time),
        positionId: reward.projectId,
      }));

      logger.info(`Successfully fetched ${rewards.length} flexible rewards from Binance`);
      return rewards;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        logger.error('Binance flexible rewards history fetch error:', {
          message: error.message,
          code: error.response?.data?.code,
          msg: error.response?.data?.msg,
        });
      } else {
        logger.error('Binance flexible rewards history fetch error:', error);
      }
      throw error;
    }
  }

  /**
   * Fetch locked staking rewards history
   * Endpoint: GET /sapi/v1/simple-earn/locked/history/rewardsRecord
   */
  async getLockedRewardsHistory(
    asset?: string,
    startTime?: number,
    endTime?: number
  ): Promise<EarnReward[]> {
    try {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('Binance API key and secret are required to fetch rewards history');
      }

      const timestamp = Date.now();
      const params: Record<string, string | number> = {
        timestamp,
      };

      if (asset) params.asset = asset;
      if (startTime) params.startTime = startTime;
      if (endTime) params.endTime = endTime;

      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      const signature = this.createSignature(queryString);

      const response = await this.sapiClient.get('/simple-earn/locked/history/rewardsRecord', {
        params: {
          ...params,
          signature,
        },
      });

      const rewards: EarnReward[] = response.data.rows.map((reward: BinanceLockedReward) => ({
        asset: reward.asset,
        amount: parseFloat(reward.amount),
        type: 'LOCKED' as const,
        rewardDate: new Date(reward.time),
        positionId: reward.positionId,
      }));

      logger.info(`Successfully fetched ${rewards.length} locked rewards from Binance`);
      return rewards;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        logger.error('Binance locked rewards history fetch error:', {
          message: error.message,
          code: error.response?.data?.code,
          msg: error.response?.data?.msg,
        });
      } else {
        logger.error('Binance locked rewards history fetch error:', error);
      }
      throw error;
    }
  }

  /**
   * Fetch all rewards history (flexible + locked)
   */
  async getAllRewardsHistory(
    asset?: string,
    startTime?: number,
    endTime?: number
  ): Promise<EarnReward[]> {
    try {
      const [flexible, locked] = await Promise.all([
        this.getFlexibleRewardsHistory(asset, startTime, endTime),
        this.getLockedRewardsHistory(asset, startTime, endTime),
      ]);

      return [...flexible, ...locked].sort(
        (a, b) => b.rewardDate.getTime() - a.rewardDate.getTime()
      );
    } catch (error) {
      logger.error('Error fetching all rewards history:', error);
      throw error;
    }
  }
}
