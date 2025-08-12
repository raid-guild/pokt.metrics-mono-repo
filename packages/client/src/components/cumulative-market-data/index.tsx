import Image from 'next/image';

import { ErrorWrapper } from '@/components/error-wrapper';
import { useQueryCumulativeMarketData } from '@/hooks/useQueryCumulativeMarketData';
import { calculatePercentageChange, formatPercentage,formatPrice } from '@/lib/utils';

import {
  MarketDataTile,
  MarketDataTileSkeleton,
  MarketDataTileTitle,
  MarketDataTileValue,
} from './market-data-tile';

export const CumulativeMarketData = () => {
  const { data, loading, error } = useQueryCumulativeMarketData();

  if (error) return <ErrorWrapper>{error.message}</ErrorWrapper>;

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <MarketDataTileSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  const marketData = data?.marketData;

  // Calculate percentage changes
  const athPercentageDifference = calculatePercentageChange(
    marketData?.price || 0,
    marketData?.all_time_high || 0
  );
  const atlPercentageDifference = calculatePercentageChange(
    marketData?.price || 0,
    marketData?.all_time_low || 0
  );

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <MarketDataTile>
          <MarketDataTileTitle>
            <Image src="/icons/24h-volume.svg" alt="24h Volume" width={16} height={16} />
            24h Volume
          </MarketDataTileTitle>
          <MarketDataTileValue>{formatPrice(marketData?.day_volume || 0)}</MarketDataTileValue>
        </MarketDataTile>
        <MarketDataTile>
          <MarketDataTileTitle>
            <Image src="/icons/market-cap.svg" alt="Market Cap" width={16} height={16} />
            Market Cap
          </MarketDataTileTitle>
          <MarketDataTileValue>{formatPrice(marketData?.market_cap || 0)}</MarketDataTileValue>
        </MarketDataTile>
        <MarketDataTile>
          <MarketDataTileTitle>
            <Image
              src="/icons/circulating-supply.svg"
              alt="Circulating Supply"
              width={16}
              height={16}
            />
            Circulating Supply
          </MarketDataTileTitle>
          <MarketDataTileValue>{marketData?.circulating_supply?.toFixed(2)}</MarketDataTileValue>
        </MarketDataTile>
        <MarketDataTile>
          <MarketDataTileTitle>
            <Image src="/icons/current-price.svg" alt="Price" width={100} height={28} />
          </MarketDataTileTitle>
          <MarketDataTileValue>{formatPrice(marketData?.price || 0, 6)}</MarketDataTileValue>
        </MarketDataTile>
        <MarketDataTile>
          <MarketDataTileTitle>
            <Image src="/icons/24h-high-low.svg" alt="24h High/Low" width={16} height={16} />
            24h High/Low
          </MarketDataTileTitle>
          <MarketDataTileValue className="text-sm">
            <span className="text-positive-green">
              {formatPrice(marketData?.day_high_price || 0, 6)}
            </span>
            /
            <span className="text-negative-red">
              {formatPrice(marketData?.day_low_price || 0, 6)}
            </span>
          </MarketDataTileValue>
        </MarketDataTile>
        <MarketDataTile>
          <MarketDataTileTitle>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1">
                <Image src="/icons/all-time-high.svg" alt="All Time High" width={16} height={16} />
                ATH
              </div>
            <div
              className={`${athPercentageDifference >= 0 ? 'text-positive-green' : 'text-negative-red'}`}
            >
              ({formatPercentage(athPercentageDifference)})
            </div>
            </div>
          </MarketDataTileTitle>
          <MarketDataTileValue>
            <span>{formatPrice(marketData?.all_time_high || 0, 6)}</span>
          </MarketDataTileValue>
        </MarketDataTile>
        <MarketDataTile>
          <MarketDataTileTitle>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1">
                <Image src="/icons/all-time-low.svg" alt="All Time Low" width={16} height={16} />
                ATL
              </div>
              <div
                className={`${atlPercentageDifference >= 0 ? 'text-positive-green' : 'text-negative-red'}`}
              >
                ({formatPercentage(atlPercentageDifference)})
              </div>
            </div>
          </MarketDataTileTitle>
          <MarketDataTileValue>
            <span>{formatPrice(marketData?.all_time_low || 0, 6)}</span>
          </MarketDataTileValue>
        </MarketDataTile>
        <MarketDataTile>
          <MarketDataTileTitle>CEX Market Data</MarketDataTileTitle>
          <MarketDataTileValue>
            <div className="flex items-center gap-2">
            <a href="https://coinmarketcap.com/currencies/pocket-network/" target="_blank" rel="noopener noreferrer">
              <Image src="/icons/coin-market-cap.svg" alt="CoinMarketCap" width={24} height={24} />
            </a>
            <a href="https://tokenterminal.com/explorer/projects/pocket-network/metrics/all" target="_blank" rel="noopener noreferrer">
              <Image src="/icons/token-terminal.svg" alt="TokenTerminal" width={24} height={24} />
            </a>
            </div>
          </MarketDataTileValue>
        </MarketDataTile>
      </div>
    </div>
  );
};
