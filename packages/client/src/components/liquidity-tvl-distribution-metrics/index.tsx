import Image from 'next/image';
import { Cell, Pie, PieChart, Sector, Tooltip, TooltipContentProps } from 'recharts';

import { useTokenPairSortingOrder } from '@/hooks/usePoolSortingOrder';
import { ActiveShapeProps } from '@/lib/types';
import {
  formatNumber,
  formatPercentage,
  getTokenPairColor,
  getTokenPairName,
  getTokenPairPlatformLogo,
  TokenPair,
} from '@/lib/utils';

const data = [
  {
    type: TokenPair.wPOKT_wETH,
    value: 1000000,
    percentage: 0.2,
  },
  {
    type: TokenPair.POKT_wETH,
    value: 2000000,
    percentage: 0.4,
  },
  {
    type: TokenPair.POKT_SOL,
    value: 2000000,
    percentage: 0.4,
  },
];

export const LiquidityTvlDistributionMetrics = () => {
  const { sortingOrder } = useTokenPairSortingOrder();

  

  const chartWidth = 250;
  const chartHeight = 250;
  const grayText = '#64748B';
  const totalTvl = data.reduce((acc, entry) => acc + entry.value, 0);

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <div className="col-span-1 flex items-center justify-center">
        <PieChart width={chartWidth} height={chartHeight}>
          <text
            x={chartWidth / 2}
            y={chartHeight / 2 - 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12px"
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
            data={data}
            dataKey="value"
            nameKey="type"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={60}
            // @ts-expect-error - TODO: fix this
            activeShape={(props: ActiveShapeProps) => <ActiveShape {...props} />}
          >
            {data.map((entry) => (
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
          <h4 className="text-sm" style={{ color: grayText }}>Liquidity Pool</h4>
          <div className="grid grid-cols-7 gap-0">
            {sortingOrder.map((pairName) => {
              const entry = data.find((x) => x.type === pairName);
              if (!entry) return null;
              return (
                <>
                  <div
                    key={`item-${entry.type}`}
                    className=" col-span-4 text-sm flex items-center font-medium"
                  >
                    <div
                      className="min-h-4 h-4 min-w-4 w-4 mr-2 rounded-xs"
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
                </>
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
