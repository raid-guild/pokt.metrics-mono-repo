import { ErrorWrapper } from "@/components/error-wrapper";
import { useQueryPoolSnapshots } from "@/hooks/useQueryPoolSnapshots";
import { calculatePercentageChange } from "@/lib/utils";

import { MetricsRow, MetricsRowSkeleton } from "./metrics-row";

export const LiquidityPoolMetrics = () => {
  const { data: poolsnapshots, fetching, error } = useQueryPoolSnapshots();
  
  if (error) {
    return (
      <ErrorWrapper>
        {error.message || 'Failed to load liquidity pool metrics. Please try again later.'}
      </ErrorWrapper>
    );
  }
  
  if (fetching) {
    return (
      <div className="flex flex-col gap-4 w-full overflow-x-scroll">
        {Array.from({ length: 3 }).map((_, index) => (
          <MetricsRowSkeleton key={index} />
        ))}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-2 w-full overflow-x-scroll">
      {poolsnapshots?.map((snapshot) => {
        const basePrice = poolsnapshots[0].average_price;
        const spread = calculatePercentageChange(snapshot.average_price, basePrice);
        return (
          <MetricsRow key={snapshot.tokenPair} {...snapshot} spread={spread} />
        )
      })}
    </div>
  );
};