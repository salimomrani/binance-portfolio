// Binance Earn API types and interfaces

export interface BinanceFlexiblePosition {
  asset: string;
  productId: string;
  productName: string;
  totalAmount: string;
  tierAnnualPercentageRate: {
    '0-5BTC': number;
    '5-10BTC': number;
    '>10BTC': number;
  };
  latestAnnualPercentageRate: string;
  yesterdayAirdropPercentageRate: string;
  canRedeem: boolean;
  autoSubscribe: boolean;
  redeemingAmount?: string;
}

export interface BinanceLockedPosition {
  positionId: string;
  projectId: string;
  asset: string;
  amount: string;
  purchaseTime: string;
  duration: string; // Duration in days
  accrualDays: string;
  rewardAsset: string;
  apy: string;
  isRenewable: boolean;
  isAutoRenew: boolean;
  redeemDate: string;
}

export interface BinanceFlexibleReward {
  asset: string;
  rewards: string;
  projectId: string;
  type: string; // 'BONUS' | 'REALTIME' | 'REWARDS'
  time: number; // Timestamp
}

export interface BinanceLockedReward {
  positionId: string;
  time: number; // Timestamp
  asset: string;
  lockPeriod: string;
  amount: string;
}

export interface BinanceFlexibleProductList {
  asset: string;
  latestAnnualPercentageRate: string;
  tierAnnualPercentageRate: {
    '0-5BTC': number;
    '5-10BTC': number;
    '>10BTC': number;
  };
  airDropPercentageRate: string;
  canPurchase: boolean;
  canRedeem: boolean;
  isSoldOut: boolean;
  hot: boolean;
  minPurchaseAmount: string;
  productId: string;
  subscriptionStartTime: string;
  status: string;
}

export interface BinanceLockedProductList {
  projectId: string;
  detail: {
    asset: string;
    rewardAsset: string;
    duration: number; // days
    renewable: boolean;
    apy: string;
  };
  quota: {
    totalPersonalQuota: string;
    minimum: string;
  };
}

export interface EarnPosition {
  asset: string;
  productId: string;
  productName: string;
  type: 'FLEXIBLE' | 'LOCKED';
  amount: number;
  currentApy: number;
  dailyEarnings?: number;
  lockPeriod?: number;
  lockedUntil?: Date;
  canRedeem: boolean;
  autoSubscribe: boolean;
}

export interface EarnReward {
  asset: string;
  amount: number;
  type: 'FLEXIBLE' | 'LOCKED';
  rewardDate: Date;
  positionId?: string;
}
