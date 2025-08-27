import { HoverCard, HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { CopyIcon, Info } from 'lucide-react';
import Image from 'next/image';

import { PoolSnapshot } from '@/hooks/useQueryPoolSnapshots';
import {
  formatNumber,
  formatPercentage,
  formatPrice,
  getTokenPairColor,
  getTokenPairName,
  TokenPair,
} from '@/lib/utils';

/**
 * Formats time elapsed since a Unix timestamp in the format "1y9m15d"
 * @param unixTimestamp - Unix timestamp in seconds
 * @returns Formatted string like "1y9m15d" or "6m2d" or "15d"
 */
const formatTimeElapsed = (unixTimestamp: number): string => {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  const elapsedSeconds = now - unixTimestamp;

  if (elapsedSeconds < 0) {
    return '0d'; // Handle future timestamps
  }

  const days = Math.floor(elapsedSeconds / (24 * 60 * 60));
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  const months = Math.floor(remainingDays / 30);
  const finalDays = remainingDays % 30;

  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years}y`);
  }

  if (months > 0) {
    parts.push(`${months}m`);
  }

  if (finalDays > 0 || parts.length === 0) {
    parts.push(`${finalDays}d`);
  }

  return parts.join('');
};

const getDexInfoByPairName = (pairName: string) => {
  switch (pairName) {
    case TokenPair.wPOKT_wETH:
      return {
        platformLogo: '/platform_icons/eth-uni.svg',
        dexToolsLink:
          'https://www.dextools.io/app/en/ether/pair-explorer/0xa7fd8ff8f4cada298286d3006ee8f9c11e2ff84e',
        dexScreenerLink:
          'https://dexscreener.com/ethereum/0xa7fd8ff8f4cada298286d3006ee8f9c11e2ff84e',
        poolAddress: '0xa7fd8ff8f4cada298286d3006ee8f9c11e2ff84e',
      };
    case TokenPair.POKT_wETH:
      return {
        platformLogo: '/platform_icons/base-aero.svg',
        dexToolsLink:
          'https://www.dextools.io/app/en/base/pair-explorer/0x32bb4ad5fed77f7abf97d1435f8d6aaae59aa64e',
        dexScreenerLink: 'https://dexscreener.com/base/0x32bb4ad5fed77f7abf97d1435f8d6aaae59aa64e',
        poolAddress: '0x32bb4ad5fed77f7abf97d1435f8d6aaae59aa64e',
      };
    case TokenPair.POKT_SOL:
      return {
        platformLogo: '/platform_icons/sol-orca.svg',
        dexToolsLink:
          'https://www.dextools.io/app/en/solana/pair-explorer/5qJCeYWzvkrKuD1r7bQDus8ffm2vjrunxNUht6NTeise',
        dexScreenerLink:
          'https://dexscreener.com/solana/5qJCeYWzvkrKuD1r7bQDus8ffm2vjrunxNUht6NTeise',
        poolAddress: '5qJCeYWzvkrKuD1r7bQDus8ffm2vjrunxNUht6NTeise',
      };
    default:
      return {
        platformLogo: '',
        dexToolsLink: '',
        dexScreenerLink: '',
        poolAddress: '',
      };
  }
};

export const MetricsRow = ({
  average_price: price24h,
  circulating_supply: circulatingSupply,
  volatility,
  market_cap: marketCap,
  holders,
  volume_usd: volume24h,
  tokenPair: pairName,
  tvl_usd: liquidity,
  pool_age: poolAge,
  spread,
  avg_price_change_perc: priceChange,
}: PoolSnapshot & { spread: number }) => {

  // Format pool age to the format of 1y9m15d from unix timestamp
  const poolAgeFormatted = formatTimeElapsed(poolAge);

  const poolColor = getTokenPairColor(pairName);
  const upColor = 'text-green-500';
  const downColor = 'text-red-500';


  const priceChangeColor = priceChange > 0 ? upColor : downColor;
  const spreadChangeColor = spread === 0 ? 'black' : spread > 0 ? upColor : downColor;
  const dexInfo = getDexInfoByPairName(pairName);

  return (
    <div
      className={`grid grid-cols-12 gap-4 h-21 rounded-lg px-8 items-center`}
      style={{ backgroundColor: poolColor }}
    >
      <div className="col-span-12 bg-white px-4 h-full border-bg-gray border-1 border-x-0 flex items-center">
        <div className="grid grid-cols-12 gap-4 items-center h-full grow">
          {/* Pair Name */}
          <div className="col-span-2">
            <h3 className="text-lg font-semibold font-rubik">{getTokenPairName(pairName)}</h3>
          </div>

          {/* Platform Logo */}
          <div className="col-span-1 flex justify-center">
            <Image src={dexInfo.platformLogo} alt="platform logo" height={32} width={86} />
          </div>

          {/* 24h Price Change */}
          <div className="col-span-1">
            <MetricsRowItem
              label={
                <span>
                  24h <span className={`${priceChangeColor}`}>({formatPercentage(priceChange)})</span>
                </span>
              }
              value={formatPrice(price24h, 5)}
            />
          </div>

          {/* Spread */}
          <div className="col-span-1">
            <MetricsRowItem
              label="Spread"
              value={
                <span className={spreadChangeColor}>
                  {spread === 0 ? 'FLOOR' : formatPercentage(spread)}
                </span>
              }
            />
          </div>

          {/* Market Cap */}
          <div className="col-span-1">
            <MetricsRowItem label="Market Cap" value={`$${formatNumber(marketCap)}`} />
          </div>

          {/* Circulating Supply */}
          <div className="col-span-1">
            <MetricsRowItem label="Circ Supply" value={formatNumber(circulatingSupply)} />
          </div>

          {/* Liquidity */}
          <div className="col-span-1">
            <MetricsRowItem label="Liquidity" value={`$${formatNumber(liquidity)}`} />
          </div>

          {/* 24h Volume */}
          <div className="col-span-1">
            <MetricsRowItem label="24h Volume" value={`$${formatNumber(volume24h)}`} />
          </div>

          {/* Total Supply */}
          {/* <div className="col-span-1">
            <MetricsRowItem label="Total Supply" value={formatNumber(totalSupply)} />
          </div> */}

          {/* Volatility */}
          <div className="col-span-1">
            <MetricsRowItem label={<VolatilityLabel />} value={`${volatility.toFixed(4)}`} />
          </div>

          {/* Holders */}
          <div className="col-span-1">
            <MetricsRowItem label="Holders" value={formatNumber(holders)} />
          </div>

          {/* Pool Age */}
          <div className="col-span-1">
            <MetricsRowItem label="Pool Age" value={poolAgeFormatted} />
          </div>
        </div>
        {/* DEX Links and Pool Address */}
        <div className="flex justify-end ml-12">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 justify-end">
                <a href={dexInfo.dexToolsLink} target="_blank" rel="noopener noreferrer">
                  <Image
                    src="/dex_icons/dex_tools.svg"
                    alt="dex tools logo"
                    width={24}
                    height={24}
                  />
                </a>
                <a href={dexInfo.dexScreenerLink} target="_blank" rel="noopener noreferrer">
                  <Image
                    src="/dex_icons/dex_screener.svg"
                    alt="dex screener logo"
                    width={24}
                    height={24}
                  />
                </a>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(dexInfo.poolAddress)}
                className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer text-center flex items-center justify-end"
                title="Click to copy pool ID"
              >
                {dexInfo.poolAddress.slice(0, 4)}...{dexInfo.poolAddress.slice(-2)}{' '}
                <CopyIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
      </div>
    </div>
  );
};

const VolatilityLabel = () => {
  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <HoverCardTrigger>
        <div className="flex items-center gap-0.5">Volatility <Info className="w-2.5 h-2.5" transform='translate(0, -2)' /></div>
      </HoverCardTrigger>
      <HoverCardContent side='right' className='-translate-y-4' sideOffset={10} alignOffset={-20}>
        <div className='bg-white rounded-lg p-2 shadow-md border border-bg-gray'>
          24h Vol/Liquidity
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

const MetricsRowItem = ({
  label,
  value,
}: {
  label: string | React.ReactNode;
  value: string | React.ReactNode;
}) => {
  return (
    <div className="flex flex-col items-end text-center min-w-0">
      <span className="text-xs text-gray-500 truncate max-w-full font-rubik">{label}</span>
      <span className="text-md font-semibold truncate max-w-full">{value}</span>
    </div>
  );
};

export const MetricsRowSkeleton = () => {
  return (
    <div className="grid grid-cols-12 gap-4 h-21 rounded-lg px-8 items-center bg-gray-100">
      <div className="col-span-12 bg-white px-4 h-full border-bg-gray border-1 border-x-0">
        <div className="grid grid-cols-13 gap-4 items-center h-full">
          {/* Pair Name */}
          <div className="col-span-2">
            <div className="w-24 h-6 bg-gray-300 rounded animate-pulse"></div>
          </div>

          {/* Platform Logo */}
          <div className="col-span-1 flex justify-center">
            <div className="w-20 h-8 bg-gray-300 rounded animate-pulse"></div>
          </div>

          {/* 24h Price Change */}
          <div className="col-span-1">
            <div className="flex flex-col items-center text-center min-w-0">
              <div className="w-16 h-3 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Spread */}
          <div className="col-span-1">
            <div className="flex flex-col items-center text-center min-w-0">
              <div className="w-12 h-3 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Market Cap */}
          <div className="col-span-1">
            <div className="flex flex-col items-center text-center min-w-0">
              <div className="w-20 h-3 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Liquidity */}
          <div className="col-span-1">
            <div className="flex flex-col items-center text-center min-w-0">
              <div className="w-16 h-3 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Circulating Supply */}
          <div className="col-span-1">
            <div className="flex flex-col items-center text-center min-w-0">
              <div className="w-20 h-3 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Holders */}
          <div className="col-span-1">
            <div className="flex flex-col items-center text-center min-w-0">
              <div className="w-14 h-3 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* 24h Volume */}
          <div className="col-span-1">
            <div className="flex flex-col items-center text-center min-w-0">
              <div className="w-20 h-3 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Volatility */}
          <div className="col-span-1">
            <div className="flex flex-col items-center text-center min-w-0">
              <div className="w-16 h-3 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="w-12 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* % Circ Supply */}
          <div className="col-span-1">
            <div className="flex flex-col items-center text-center min-w-0">
              <div className="w-24 h-3 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* DEX Links and Pool Address */}
          <div className="col-span-1">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 justify-center">
                <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
              </div>
              <div className="w-16 h-3 bg-gray-300 rounded animate-pulse mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
