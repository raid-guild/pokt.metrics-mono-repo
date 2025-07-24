import { useQuery } from "@tanstack/react-query";
import { base, mainnet } from "viem/chains";

import { MetricsRow } from "./metrics-row";

// Test data for MetricsRow component
export const TEST_METRICS_DATA = [
  {
    price24h: 0.045,
    priceChange: 2.5,
    spread: 0.12,
    marketCap: 12500000,
    liquidity: 850000,
    poolColor: "#D35400",
    circulatingSupply: 275000000,
    holders: 15420,
    volume24h: 125000,
    totalSupply: 1000000000,
    volatility: 15.8,
    circulatingSupplyPercentage: 27.5,
    poolAddress: "0x1234567890abcdef1234567890abcdef12345678",
    poolIconFrom: "https://example.com/eth-icon.png",
    poolIconTo: "https://example.com/pokt-icon.png",
    chainId: mainnet.id,
    platformId: "uniswap-v3",
    pairName: "wPOKT/wETH",
  },
  {
    price24h: 0.043,
    priceChange: -1.2,
    spread: 0.08,
    marketCap: 11800000,
    liquidity: 720000,
    poolColor: "#0E7490",
    circulatingSupply: 275000000,
    holders: 14850,
    volume24h: 98000,
    totalSupply: 1000000000,
    volatility: 12.3,
    circulatingSupplyPercentage: 27.5,
    poolAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    poolIconFrom: "https://example.com/base-icon.png",
    poolIconTo: "https://example.com/pokt-icon.png",
    chainId: base.id,
    platformId: "aerodrome",
    pairName: "POKT/wETH",
  },
  {
    price24h: 0.047,
    priceChange: 3.8,
    spread: 0.15,
    marketCap: 13200000,
    liquidity: 920000,
    poolColor: "#6B46C1",
    circulatingSupply: 275000000,
    holders: 15980,
    volume24h: 145000,
    totalSupply: 1000000000,
    volatility: 18.2,
    circulatingSupplyPercentage: 27.5,
    poolAddress: "0x7890abcdef1234567890abcdef1234567890abcd",
    poolIconFrom: "https://example.com/sol-icon.png",
    poolIconTo: "https://example.com/pokt-icon.png",
    chainId: 101,
    platformId: "orca",
    pairName: "POKT/SOL",
  },
];

export const LiquidityPoolMetrics = () => {
  const { data } = useQuery({
    queryKey: ["liquidity-pool-metrics"],
    queryFn: async () => {
      return TEST_METRICS_DATA;
    },
  });
  
  return (
    <div className="flex flex-col gap-4 w-full overflow-x-scroll">
      <div className="flex bg-primary rounded-lg text-white p-4">
        <h1 className="text-3xl font-bold">Liquidity Pool Metrics</h1>
      </div>
        {data?.map((metrics, index) => (
          <MetricsRow key={index} {...metrics} />
        ))}
    </div>
  );
};