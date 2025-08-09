import { Card } from '@/components/card';
import { CumulativeMarketData } from '@/components/cumulative-market-data';
import { HistoricalPriceLineChart } from '@/components/historical-price-line-chart';
import { LiquidityPoolMetrics } from '@/components/liquidity-pool-metrics';
import { LiquidityTvlDistributionMetrics } from '@/components/liquidity-tvl-distribution-metrics';
import { SwapWidget } from '@/components/swap-widget';

export default function Home() {
  return (
    <div
      className={`grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20`}
    >
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex gap-4 w-full">
          <div className="w-full">
            <Card title="Bridge and Swap">
              <SwapWidget />
            </Card>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="w-full">
              <Card title="POKT Cumulative Market Data" separateTitle>
                <CumulativeMarketData />
              </Card>
            </div>
            <div className="w-full">
              <Card title="Liquidity TVL Distribution by Pool">
                <LiquidityTvlDistributionMetrics />
              </Card>
            </div>
          </div>
        </div>
        <Card title="Price Comparison by Pool">
          <HistoricalPriceLineChart />
        </Card>
        <Card title="Liquidity Pool Metrics" separateTitle>
          <LiquidityPoolMetrics />
        </Card>
      </main>
    </div>
  );
}
