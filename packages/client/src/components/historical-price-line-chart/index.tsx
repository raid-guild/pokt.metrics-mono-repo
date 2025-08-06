import Image from 'next/image';
import { Fragment, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';

import { useTokenPairSortingOrder } from '@/hooks/usePoolSortingOrder';
import { useQueryPriceSnapshots } from '@/hooks/useQueryPriceSnapshots';
import {
  cn,
  formatPrice,
  getTokenPairColor,
  getTokenPairName,
  getTokenPairPlatformLogo,
  TokenPair,
} from '@/lib/utils';

import { ErrorWrapper } from '../error-wrapper';
import { Button } from '../ui/button';

const timestepOptions = [
  { label: '15m', value: '_15m' },
  { label: '30m', value: '_30m' },
  { label: '1hr', value: '_1h' },
] as const;

type FormattedPriceSnapshot = keyof typeof TokenPair | 'timestamp';

// Converts the data in Props to the format expected by recharts (array of { timestamp, wPOKT_wETH, POKT_wETH, POKT_SOL })
function formatHistoricalDataFromProps(
  data: Record<TokenPair, { timestamp: string; value: number }[]>
): Array<{ timestamp: number; wPOKT_wETH: number; POKT_wETH: number; POKT_SOL: number }> {
  // Collect all unique timestamps from all token pairs
  const timestampsSet = new Set<number>();
  Object.values(data).forEach((arr) => {
    arr.forEach((entry) => timestampsSet.add(new Date(entry.timestamp).getTime()));
  });
  const timestamps = Array.from(timestampsSet).sort((a, b) => a - b);

  // Build a map for each token pair for quick lookup
  const pairMaps: Partial<Record<TokenPair, Map<number, number>>> = {
    // [TokenPair.wPOKT_wETH]: new Map(),
    // [TokenPair.POKT_wETH]: new Map(),
    // [TokenPair.POKT_SOL]: new Map(),
  };

  for (const pair of Object.keys(data) as TokenPair[]) {
    pairMaps[pair] = new Map();
  }

  (Object.keys(pairMaps) as TokenPair[]).forEach((pair) => {
    (data[pair] || []).forEach((entry) => {
      pairMaps[pair]?.set(new Date(entry.timestamp).getTime(), entry.value);
    });
  });

  // Build the array in the recharts format, using 0 as fallback for missing values
  const result: Record<FormattedPriceSnapshot, number>[] = [];

  for (const timestamp of timestamps) {
    const resultToAdd = { timestamp } as Record<FormattedPriceSnapshot, number>;
    for (const pair of Object.keys(pairMaps) as TokenPair[]) {
      const valueForTimestamp = pairMaps[pair]?.get(timestamp);
      if (valueForTimestamp) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        resultToAdd[pair] = valueForTimestamp;
      }
    }
    result.push(resultToAdd);
  }

  return result;
}

export const HistoricalPriceLineChartSkeleton = () => {
  return (
    <div className="flex flex-col gap-8">
      {/* Time step buttons skeleton */}
      <div className="flex flex-row gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-10 w-16 bg-gray-300 rounded-md animate-pulse" />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="w-full h-[300px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
          <div className="w-48 h-6 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export function HistoricalPriceLineChart() {
  const activeDot = { r: 6 };

  // Use static data if no prop is provided
  // const formattedData = data ? formatHistoricalDataFromProps(data) : historicalData;
  const [timestep, setTimestep] = useState<(typeof timestepOptions)[number]>(timestepOptions[0]);
  const { data, fetching, error } = useQueryPriceSnapshots({ interval: timestep.value });

  const formattedData = useMemo(() => {
    if (!data) return null;

    const result = formatHistoricalDataFromProps({
      [TokenPair.wPOKT_wETH]: data.priceSnapshots.ethereum.map((snapshot) => ({
        timestamp: snapshot.timestamp,
        value: snapshot.price,
      })),
      [TokenPair.POKT_SOL]: data.priceSnapshots.solana.map((snapshot) => ({
        timestamp: snapshot.timestamp,
        value: snapshot.price,
      })),
      [TokenPair.POKT_wETH]: data.priceSnapshots.base.map((snapshot) => ({
        timestamp: snapshot.timestamp,
        value: snapshot.price,
      })),
    });

    // If timestep is 15m, get the data for the last 24 hours
    if (timestep.value === '_15m') {
      const timeStamp24HoursAgo = new Date().getTime() - 24 * 60 * 60 * 1000;
      return result.filter((item) => item.timestamp >= timeStamp24HoursAgo);
    }

    // If timestep is 30m, get the data for the last 12 hours
    if (timestep.value === '_30m') {
      const timeStamp12HoursAgo = new Date().getTime() - 12 * 60 * 60 * 1000;
      return result.filter((item) => item.timestamp >= timeStamp12HoursAgo);
    }

    // If timestep is 1hr, get the data for the last 6 hours
    if (timestep.value === '_1h') {
      const timeStamp6HoursAgo = new Date().getTime() - 6 * 60 * 60 * 1000;
      return result.filter((item) => item.timestamp >= timeStamp6HoursAgo);
    }

    return [];
  }, [data, timestep]);

  const domain = useMemo(() => {
  if (!formattedData) return [0, 0];
  const allPrices = [
    ...formattedData.map((item) => item.wPOKT_wETH),
    ...formattedData.map((item) => item.POKT_wETH),
    ...formattedData.map((item) => item.POKT_SOL),
  ].filter((price) => price !== undefined && !isNaN(price));

  if (allPrices.length === 0) return [0, 1]; // Default domain if no valid prices

  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  return [min, max];
}, [formattedData]);

  if (error) {
    return (
      <ErrorWrapper>
        {error.message || 'Failed to load price snapshots. Please try again later.'}
      </ErrorWrapper>
    );
  }

  if (!data && fetching) {
    return <HistoricalPriceLineChartSkeleton />;
  }

  const yPadding = 0;

  if (!formattedData) return null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-row gap-2">
        {timestepOptions.map((option) => (
          <Button
            key={option.label}
            onClick={() => setTimestep(option)}
            variant={timestep.value === option.value ? 'default' : 'outline'}
            className={cn("font-rubik border-primary", timestep.value !== option.value && "hover:text-primary")}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            textAnchor="end"
            tickLine={false}
            tickFormatter={formatTimestamp}
            axisLine={false}
          />
          <YAxis
            domain={domain}
            tickFormatter={(value) => `${formatPrice(value, 6)}`}
            tickLine={false}
            axisLine={false}
            tickCount={5}
            padding={{ top: yPadding, bottom: yPadding }}
          />
          <Tooltip content={CustomTooltip} />
          {Object.keys(TokenPair)
            .filter((key) => key !== 'timestamp')
            .map((key) => {
              const tokenPair = key as TokenPair;
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={getTokenPairColor(tokenPair)}
                  strokeWidth={2}
                  name={getTokenPairName(tokenPair)}
                  activeDot={activeDot}
                  dot={false}
                />
              );
            })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: TooltipContentProps<number, string>) => {
  const { sortingOrder } = useTokenPairSortingOrder();

  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-background p-2 rounded-md shadow-md mx-10">
        <p className="label font-medium">{formatDate(Number(label))}</p>
        {/* Grid with 5 columns */}
        <div className="grid grid-cols-5 gap-0">
          {sortingOrder.map((pairName) => {
            const entry = payload.find((x) => x.dataKey === pairName);
            if (!entry) return null;
            return (
              <Fragment key={`item-${entry.name}`}>
                <div
                  className=" col-span-2 text-sm flex items-center font-rubik"
                  style={{ color: entry.color }}
                >
                  <div
                    className="min-h-4 h-4 min-w-4 w-4 mr-2 rounded-xs"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}
                </div>
                <div className="col-span-1 justify-end flex">
                  <Image
                    src={getTokenPairPlatformLogo(entry.dataKey as TokenPair)}
                    alt={entry.name}
                    height={14}
                    width={38}
                  />
                </div>
                <div className="col-span-2 text-right font-medium">
                  {formatPrice(entry.value, 6)}
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};
// Format the timestamp to the desired date format
const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  const day = date.getDate();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const timezone = date.toLocaleDateString('en-US', { timeZoneName: 'short' }).split(', ')[1];

  return `${month} ${day}, ${year}, ${time} ${timezone}`;
};

const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // If it's midnight (00:00), show date in "Jul15" format
  if (hours === 0 && minutes === 0) {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  // Otherwise show time in "hh:mm" format
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};
