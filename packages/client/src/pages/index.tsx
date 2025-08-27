import { Card } from '@/components/card';
import { CumulativeMarketData } from '@/components/cumulative-market-data';
import { HistoricalPriceLineChart } from '@/components/historical-price-line-chart';
import { LiquidityPoolMetrics } from '@/components/liquidity-pool-metrics';
import { LiquidityTvlDistributionMetrics } from '@/components/liquidity-tvl-distribution-metrics';
import { SwapWidget } from '@/components/swap-widget';

export default function Home() {
  return (
    <div
      className={`grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 sm:pt-0`}
    >
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex md:flex-row flex-col gap-4 w-full ">
          <Card title="Bridge and Swap" className="w-full md:w-2/5 h-full">
            <SwapWidget />
          </Card>
          <div className="flex flex-col gap-4 w-full md:w-3/5 grow">
            <Card title="POKT Cumulative Market Data" separateTitle className="w-full">
              <CumulativeMarketData />
            </Card>
            <Card title="Liquidity TVL Distribution by Pool" className="w-full">
              <div className="h-full flex items-center justify-center">
                <LiquidityTvlDistributionMetrics />
              </div>
            </Card>
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
