import { Card } from '@/components/card';
import { HistoricalPriceLineChart } from '@/components/historical-price-line-chart';
import { LiquidityPoolMetrics } from '@/components/liquidity-pool-metrics';
import { LiquidityTvlDistributionMetrics } from '@/components/liquidity-tvl-distribution-metrics';

export default function Home() {
  return (
    <div
      className={`grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
    >
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className='w-1/2'>

        <Card title="Liquidity TVL Distribution by Pool">
          <LiquidityTvlDistributionMetrics />
        </Card>
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
