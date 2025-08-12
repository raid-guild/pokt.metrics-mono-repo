import Image from 'next/image';
import * as React from 'react';
import { Cell, Pie, PieChart, Sector, Tooltip, TooltipContentProps } from 'recharts';

import { useTokenPairSortingOrder } from '@/hooks/usePoolSortingOrder';
import { useQueryPoolSnapshots } from '@/hooks/useQueryPoolSnapshots';
import { ActiveShapeProps } from '@/lib/types';
import {
  formatNumber,
  formatPercentage,
  getTokenPairColor,
  getTokenPairName,
  getTokenPairPlatformLogo,
} from '@/lib/utils';

import { ErrorWrapper } from '../error-wrapper';

export const LiquidityTvlDistributionMetricsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {/* Chart skeleton */}
      <div className="col-span-1 flex items-center justify-center">
        <div className="w-[250px] h-[250px] bg-gray-200 rounded-full animate-pulse flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-3 bg-gray-300 rounded animate-pulse mb-2"></div>
            <div className="w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
      
      {/* Legend skeleton */}
      <div className="col-span-1">
        <div className="flex flex-col gap-2 h-full justify-start">
          <div className="w-24 h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
          <div className="grid grid-cols-7 gap-0">
            {Array.from({ length: 3 }).map((_, index) => (
              <React.Fragment key={index}>
                <div className="col-span-4 text-sm flex items-center">
                  <div className="w-4 h-4 bg-gray-300 rounded animate-pulse mr-2"></div>
                  <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="col-span-2 justify-end flex pr-6">
                  <div className="w-10 h-4 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="col-span-1 text-right">
                  <div className="w-8 h-4 bg-gray-300 rounded animate-pulse ml-auto"></div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LiquidityTvlDistributionMetrics = () => {
  const { sortingOrder } = useTokenPairSortingOrder();
  const { data: poolsnapshots, fetching, error } = useQueryPoolSnapshots();

  if (error) {
    return (
      <ErrorWrapper>
        {error.message || 'Failed to load liquidity TVL distribution metrics. Please try again later.'}
      </ErrorWrapper>
    );
  }

  if (fetching) {
    return <LiquidityTvlDistributionMetricsSkeleton />;
  }

  // Transform pool snapshots into chart data
  const chartData = poolsnapshots?.map((snapshot) => ({
    type: snapshot.tokenPair,
    value: snapshot.tvl_usd || 0,
    percentage: 0, // Will be calculated below
  })) || [];

  // Calculate percentages
  const totalTvl = chartData.reduce((acc, entry) => acc + entry.value, 0);
  const dataWithPercentages = chartData.map((entry) => ({
    ...entry,
    percentage: totalTvl > 0 ? entry.value / totalTvl : 0,
  }));

  const chartWidth = 250;
  const chartHeight = 250;
  const grayText = '#64748B';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <div className="col-span-1 flex items-center justify-center">
        <PieChart width={chartWidth} height={chartHeight}>
          <text
            x={chartWidth / 2}
            y={chartHeight / 2 - 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12px"
            fontFamily="Rubik"
            fill={grayText}
          >
            Total TVL:
          </text>
          <text
            x={chartWidth / 2}
            y={chartHeight / 2 + 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="18px"
            fontWeight="semibold"
          >
            ${formatNumber(totalTvl)}
          </text>

          <Pie
            data={dataWithPercentages}
            dataKey="value"
            nameKey="type"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={60}
            // @ts-expect-error - TODO: fix this
            activeShape={(props: ActiveShapeProps) => <ActiveShape {...props} />}
          >
            {dataWithPercentages.map((entry) => (
              <Cell
                key={`cell-${entry.type}`}
                fill={getTokenPairColor(entry.type)}
              />
            ))}
          </Pie>
          <Tooltip content={CustomTooltip} />
        </PieChart>
      </div>
      <div className="col-span-1">
        <div className="flex flex-col gap-2 h-full justify-start">
          <h4 className="text-sm font-rubik" style={{ color: grayText }}>Liquidity Pool</h4>
          <div className="grid grid-cols-7 gap-0">
            {sortingOrder.map((pairName) => {
              const entry = dataWithPercentages.find((x) => x.type === pairName);
              if (!entry) return null;
              return (
                <React.Fragment key={`item-${entry.type}`}>
                  <div
                    className="col-span-4 text-sm flex items-center font-medium font-rubik"
                  >
                    <div
                      className="min-h-4 h-4 min-w-4 w-4 mr-2 rounded-xs "
                      style={{ backgroundColor: getTokenPairColor(entry.type) }}
                    />
                    {getTokenPairName(entry.type)}
                  </div>
                  <div className="col-span-2 justify-end flex pr-6">
                    <Image
                      src={getTokenPairPlatformLogo(entry.type)}
                      alt={getTokenPairName(entry.type)}
                      height={14}
                      width={38}
                    />
                  </div>
                  <div className="col-span-1 text-right font-medium">
                    {formatPercentage(entry.percentage)}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const ActiveShape = (props: ActiveShapeProps) => {
  return <Sector {...props} outerRadius={props.outerRadius + 10} />;
};

const CustomTooltip = ({ active, payload }: TooltipContentProps<number, string>) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload;
    return (
      <div className="custom-tooltip bg-background p-2 rounded-md shadow-md mx-10 flex items-center gap-2">
        <div
          className="min-h-4 h-4 min-w-4 w-4 mr-2 rounded-xs"
          style={{ backgroundColor: getTokenPairColor(entry.type) }}
        />
        <p className="label font-medium">${formatNumber(entry.value)}</p>
      </div>
    );
  }
  return null;
};
