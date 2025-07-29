export type TokenPriceEvmResponse = {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string;
  tokenDecimals: string; // Still a string, can be cast if needed
  usdPrice: number;
  usdPriceFormatted: string;
  '24hrPercentChange': string;
  exchangeAddress: string;
  exchangeName: string;
  tokenAddress: string;
  toBlock: string;
  possibleSpam: string; // "false" or "true" string
  verifiedContract: boolean;
  pairAddress: string;
  pairTotalLiquidityUsd: string;
};

export type TokenHoldersEvmResponse = {
  totalHolders: number;
};

export type TokenHoldersSolanaResponse = {
  totalHolders: number;
};

export type TokenPriceSolanaResponse = {
  nativePrice: {
    value: string;
    decimals: string;
    name: string;
    symbol: string;
  };
  usdPrice: string;
  exchangeAddress: string;
  exchangeName: string;
};

export type TokenPairStatsEvmResponse = {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string;
  pairCreated: string; // ISO timestamp
  pairLabel: string;
  pairAddress: string;
  exchange: string;
  exchangeAddress: string;
  exchangeLogo: string;
  exchangeUrl: string;
  currentUsdPrice: string;
  currentNativePrice: string;
  totalLiquidityUsd: string;
  pricePercentChange: PercentChangeStats;
  liquidityPercentChange: PercentChangeStats;
  buys: TimeWindowCount;
  sells: TimeWindowCount;
  totalVolume: TimeWindowVolume;
  buyVolume: TimeWindowVolume;
  sellVolume: TimeWindowVolume;
  buyers: TimeWindowCount;
  sellers: TimeWindowCount;
};

export type TokenPairStatsSolanaResponse = {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenLogo: string;
  pairCreated: string | null;
  pairLabel: string;
  pairAddress: string;
  exchange: string;
  exchangeAddress: string;
  exchangeLogo: string;
  exchangeUrl: string | null;
  currentUsdPrice: string;
  currentNativePrice: string;
  totalLiquidityUsd: string;
  pricePercentChange: PercentChangeStats;
  liquidityPercentChange: PercentChangeStats;
  buys: TimeWindowCount;
  sells: TimeWindowCount;
  totalVolume: TimeWindowVolume;
  buyVolume: TimeWindowVolume;
  sellVolume: TimeWindowVolume;
  buyers: TimeWindowCount;
  sellers: TimeWindowCount;
};

type PercentChangeStats = {
  '5min': number;
  '1h': number;
  '4h': number;
  '24h': number;
};

type TimeWindowCount = {
  '5min': number;
  '1h': number;
  '4h': number;
  '24h': number;
};

type TimeWindowVolume = {
  '5min': number;
  '1h': number;
  '4h': number;
  '24h': number;
};
