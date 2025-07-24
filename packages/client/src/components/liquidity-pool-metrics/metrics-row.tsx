import { CopyIcon } from 'lucide-react';
import Image from 'next/image';

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  } else {
    return num.toFixed(2);
  }
};

const getDexInfoByPairName = (pairName: string) => {
  switch (pairName) {
    case "wPOKT/wETH":
      return {
        platformLogo: '/platform_icons/eth-uni.svg',
        dexToolsLink: "ttps://www.dextools.io/app/en/ether/pair-explorer/0xa7fd8ff8f4cada298286d3006ee8f9c11e2ff84e",
        dexScreenerLink: "https://dexscreener.com/ethereum/0xa7fd8ff8f4cada298286d3006ee8f9c11e2ff84e",
        poolAddress: "0xa7fd8ff8f4cada298286d3006ee8f9c11e2ff84e",
      }
    case "POKT/wETH":
      return {
        platformLogo: '/platform_icons/base-aero.svg',
        dexToolsLink: "https://www.dextools.io/app/en/base/pair-explorer/0x32bb4ad5fed77f7abf97d1435f8d6aaae59aa64e",
        dexScreenerLink: "https://dexscreener.com/base/0x32bb4ad5fed77f7abf97d1435f8d6aaae59aa64e",
        poolAddress: "0x32bb4ad5fed77f7abf97d1435f8d6aaae59aa64e",
      }
    case "POKT/SOL":
      return {
        platformLogo: '/platform_icons/sol-orca.svg',
        dexToolsLink: "https://www.dextools.io/app/en/solana/pair-explorer/5qJCeYWzvkrKuD1r7bQDus8ffm2vjrunxNUht6NTeise",
        dexScreenerLink: "https://dexscreener.com/solana/5qJCeYWzvkrKuD1r7bQDus8ffm2vjrunxNUht6NTeise",
        poolAddress: "5qJCeYWzvkrKuD1r7bQDus8ffm2vjrunxNUht6NTeise",
      }
    default:
        return {
          platformLogo: "",
          dexToolsLink: "",
          dexScreenerLink: "",
          poolAddress: "",
        }
  }
}

export const MetricsRow = ({
  price24h,
  priceChange,
  spread,
  marketCap,
  liquidity,
  poolColor,
  circulatingSupply,
  holders,
  volume24h,
  volatility,
  circulatingSupplyPercentage,
  pairName,
}: {
  price24h: number;
  priceChange: number;
  spread: number;
  marketCap: number;
  liquidity: number;
  poolColor: string;
  circulatingSupply: number;
  holders: number;
  volume24h: number;
  volatility: number;
  circulatingSupplyPercentage: number;
  pairName: string;
}) => {
  const upColor = 'text-green-500';
  const downColor = 'text-red-500';

  const price24hFormatted = price24h
    .toFixed(4)
    .replace(/^0+/, '')
    .replace(/\.?0+$/, '');

  const priceChangeFormatted = priceChange
    .toFixed(2)
    .replace(/^0+/, '')
    .replace(/\.?0+$/, '');
  const priceChangeColor = priceChange > 0 ? upColor : downColor;

  const spreadChangeColor = spread > 0 ? upColor : downColor;

  const dexInfo = getDexInfoByPairName(pairName);

  return (
    <div className={`grid grid-cols-12 gap-4 h-21 rounded-lg px-8 items-center`} style={{ backgroundColor: poolColor }}>
      <div className="col-span-12 bg-white px-4 h-full">
        <div className="grid grid-cols-13 gap-4 items-center h-full">
          {/* Pair Name */}
          <div className="col-span-2">
            <h3 className="text-lg font-bold">{pairName}</h3>
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
                  24h <span className={`${priceChangeColor}`}>({priceChangeFormatted}%)</span>
                </span>
              }
              value={`$${price24hFormatted}`}
            />
          </div>

          {/* Spread */}
          <div className="col-span-1">
            <MetricsRowItem
              label="Spread"
              value={<span className={spreadChangeColor}>spread</span>}
            />
          </div>

          {/* Market Cap */}
          <div className="col-span-1">
            <MetricsRowItem label="Market Cap" value={formatNumber(marketCap)} />
          </div>

          {/* Liquidity */}
          <div className="col-span-1">
            <MetricsRowItem label="Liquidity" value={formatNumber(liquidity)} />
          </div>

          {/* Circulating Supply */}
          <div className="col-span-1">
            <MetricsRowItem label="Circ Supply" value={formatNumber(circulatingSupply)} />
          </div>

          {/* Holders */}
          <div className="col-span-1">
            <MetricsRowItem label="Holders" value={formatNumber(holders)} />
          </div>

          {/* 24h Volume */}
          <div className="col-span-1">
            <MetricsRowItem label="24h Volume" value={formatNumber(volume24h)} />
          </div>

          {/* Total Supply */}
          {/* <div className="col-span-1">
            <MetricsRowItem label="Total Supply" value={formatNumber(totalSupply)} />
          </div> */}

          {/* Volatility */}
          <div className="col-span-1">
            <MetricsRowItem label="Volatility" value={`${volatility}%`} />
          </div>

          {/* % Circ Supply */}
          <div className="col-span-1">
            <MetricsRowItem label="% Circ Supply" value={`${circulatingSupplyPercentage}%`} />
          </div>

          {/* DEX Links and Pool Address */}
          <div className="col-span-1">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 justify-center">
                <a href={dexInfo.dexToolsLink} target="_blank" rel="noopener noreferrer">
                  <Image src="/dex_icons/dex_tools.svg" alt="dex tools logo" width={24} height={24} />
                </a>
                <a href={dexInfo.dexScreenerLink} target="_blank" rel="noopener noreferrer">
                  <Image src="/dex_icons/dex_screener.svg" alt="dex screener logo" width={24} height={24} />
                </a>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(dexInfo.poolAddress)}
                className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer text-center flex items-center justify-center"
                title="Click to copy pool ID"
              >
                {dexInfo.poolAddress.slice(0, 4)}...{dexInfo.poolAddress.slice(-2)} <CopyIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricsRowItem = ({
  label,
  value,
}: {
  label: string | React.ReactNode;
  value: string | React.ReactNode;
}) => {
  return (
    <div className="flex flex-col items-center text-center min-w-0">
      <span className="text-xs text-gray-500 truncate max-w-full">{label}</span>
      <span className="text-md font-semibold truncate max-w-full">{value}</span>
    </div>
  );
};
