import Image from 'next/image';
import { Fragment,useState } from 'react';
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
import {
  formatNumber,
  getTokenPairColor,
  getTokenPairName,
  getTokenPairPlatformLogo,
  TokenPair,
} from '@/lib/utils';

import { Button } from '../ui/button';

interface Props {
  data?: Record<TokenPair, { timestamp: number; value: number }[]>;
}

const timestepOptions = [
  {
    label: "15m"
  },
  {
    label: "30m",
  },
  {
    label: "1hr"
  }
] as const;

// Converts the data in Props to the format expected by recharts (array of { timestamp, wPOKT_wETH, POKT_wETH, POKT_SOL })
function formatHistoricalDataFromProps(
  data: Record<TokenPair, { timestamp: number; value: number }[]>
): Array<{ timestamp: number; wPOKT_wETH: number; POKT_wETH: number; POKT_SOL: number }> {
  // Collect all unique timestamps from all token pairs
  const timestampsSet = new Set<number>();
  Object.values(data).forEach((arr) => {
    arr.forEach((entry) => timestampsSet.add(entry.timestamp));
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
      pairMaps[pair]?.set(entry.timestamp, entry.value);
    });
  });

  type X = keyof typeof TokenPair | 'timestamp';
  // Build the array in the recharts format, using 0 as fallback for missing values
  const result: Record<X, number>[] = [];

  for (const timestamp of timestamps) {
    const resultToAdd = { timestamp } as Record<X, number>;
    for (const pair of Object.keys(pairMaps) as TokenPair[]) {
      resultToAdd[pair] = pairMaps[pair]?.get(timestamp) ?? 0;
    }
    result.push(resultToAdd);
  }

  return result;
}

// Historical price data for the three token pairs over the last 30 days (every 6 hours)
const historicalData = [
  { timestamp: 1704067200, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 1 00:00
  { timestamp: 1704088800, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 1 06:00
  { timestamp: 1704110400, wPOKT_wETH: 0.041, POKT_wETH: 0.04, POKT_SOL: 0.043 }, // Jan 1 12:00
  { timestamp: 1704132000, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 1 18:00
  { timestamp: 1704153600, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 2 00:00
  { timestamp: 1704175200, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 2 06:00
  { timestamp: 1704196800, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 2 12:00
  { timestamp: 1704218400, wPOKT_wETH: 0.048, POKT_wETH: 0.047, POKT_SOL: 0.05 }, // Jan 2 18:00
  { timestamp: 1704240000, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 3 00:00
  { timestamp: 1704261600, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 3 06:00
  { timestamp: 1704283200, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 3 12:00
  { timestamp: 1704304800, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 3 18:00
  { timestamp: 1704326400, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 4 00:00
  { timestamp: 1704348000, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 4 06:00
  { timestamp: 1704369600, wPOKT_wETH: 0.049, POKT_wETH: 0.048, POKT_SOL: 0.051 }, // Jan 4 12:00
  { timestamp: 1704391200, wPOKT_wETH: 0.048, POKT_wETH: 0.047, POKT_SOL: 0.05 }, // Jan 4 18:00
  { timestamp: 1704412800, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 5 00:00
  { timestamp: 1704434400, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 5 06:00
  { timestamp: 1704456000, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 5 12:00
  { timestamp: 1704477600, wPOKT_wETH: 0.04, POKT_wETH: 0.039, POKT_SOL: 0.042 }, // Jan 5 18:00
  { timestamp: 1704499200, wPOKT_wETH: 0.041, POKT_wETH: 0.04, POKT_SOL: 0.043 }, // Jan 6 00:00
  { timestamp: 1704520800, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 6 06:00
  { timestamp: 1704542400, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 6 12:00
  { timestamp: 1704564000, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 6 18:00
  { timestamp: 1704585600, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 7 00:00
  { timestamp: 1704607200, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 7 06:00
  { timestamp: 1704628800, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 7 12:00
  { timestamp: 1704650400, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 7 18:00
  { timestamp: 1704672000, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 8 00:00
  { timestamp: 1704693600, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 8 06:00
  { timestamp: 1704715200, wPOKT_wETH: 0.049, POKT_wETH: 0.048, POKT_SOL: 0.051 }, // Jan 8 12:00
  { timestamp: 1704736800, wPOKT_wETH: 0.048, POKT_wETH: 0.047, POKT_SOL: 0.05 }, // Jan 8 18:00
  { timestamp: 1704758400, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 9 00:00
  { timestamp: 1704780000, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 9 06:00
  { timestamp: 1704801600, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 9 12:00
  { timestamp: 1704823200, wPOKT_wETH: 0.04, POKT_wETH: 0.039, POKT_SOL: 0.042 }, // Jan 9 18:00
  { timestamp: 1704844800, wPOKT_wETH: 0.041, POKT_wETH: 0.04, POKT_SOL: 0.043 }, // Jan 10 00:00
  { timestamp: 1704866400, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 10 06:00
  { timestamp: 1704888000, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 10 12:00
  { timestamp: 1704909600, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 10 18:00
  { timestamp: 1704931200, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 11 00:00
  { timestamp: 1704952800, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 11 06:00
  { timestamp: 1704974400, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 11 12:00
  { timestamp: 1704996000, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 11 18:00
  { timestamp: 1705017600, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 12 00:00
  { timestamp: 1705039200, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 12 06:00
  { timestamp: 1705060800, wPOKT_wETH: 0.049, POKT_wETH: 0.048, POKT_SOL: 0.051 }, // Jan 12 12:00
  { timestamp: 1705082400, wPOKT_wETH: 0.048, POKT_wETH: 0.047, POKT_SOL: 0.05 }, // Jan 12 18:00
  { timestamp: 1705104000, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 13 00:00
  { timestamp: 1705125600, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 13 06:00
  { timestamp: 1705147200, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 13 12:00
  { timestamp: 1705168800, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 13 18:00
  { timestamp: 1705190400, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 14 00:00
  { timestamp: 1705212000, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 14 06:00
  { timestamp: 1705233600, wPOKT_wETH: 0.049, POKT_wETH: 0.048, POKT_SOL: 0.051 }, // Jan 14 12:00
  { timestamp: 1705255200, wPOKT_wETH: 0.048, POKT_wETH: 0.047, POKT_SOL: 0.05 }, // Jan 14 18:00
  { timestamp: 1705276800, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 15 00:00
  { timestamp: 1705298400, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 15 06:00
  { timestamp: 1705320000, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 15 12:00
  { timestamp: 1705341600, wPOKT_wETH: 0.04, POKT_wETH: 0.039, POKT_SOL: 0.042 }, // Jan 15 18:00
  { timestamp: 1705363200, wPOKT_wETH: 0.041, POKT_wETH: 0.04, POKT_SOL: 0.043 }, // Jan 16 00:00
  { timestamp: 1705384800, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 16 06:00
  { timestamp: 1705406400, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 16 12:00
  { timestamp: 1705428000, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 16 18:00
  { timestamp: 1705449600, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 17 00:00
  { timestamp: 1705471200, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 17 06:00
  { timestamp: 1705492800, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 17 12:00
  { timestamp: 1705514400, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 17 18:00
  { timestamp: 1705536000, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 18 00:00
  { timestamp: 1705557600, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 18 06:00
  { timestamp: 1705579200, wPOKT_wETH: 0.049, POKT_wETH: 0.048, POKT_SOL: 0.051 }, // Jan 18 12:00
  { timestamp: 1705600800, wPOKT_wETH: 0.048, POKT_wETH: 0.047, POKT_SOL: 0.05 }, // Jan 18 18:00
  { timestamp: 1705622400, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 19 00:00
  { timestamp: 1705644000, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 19 06:00
  { timestamp: 1705665600, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 19 12:00
  { timestamp: 1705687200, wPOKT_wETH: 0.04, POKT_wETH: 0.039, POKT_SOL: 0.042 }, // Jan 19 18:00
  { timestamp: 1705708800, wPOKT_wETH: 0.041, POKT_wETH: 0.04, POKT_SOL: 0.043 }, // Jan 20 00:00
  { timestamp: 1705730400, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 20 06:00
  { timestamp: 1705752000, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 20 12:00
  { timestamp: 1705773600, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 20 18:00
  { timestamp: 1705795200, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 21 00:00
  { timestamp: 1705816800, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 21 06:00
  { timestamp: 1705838400, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 21 12:00
  { timestamp: 1705860000, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 21 18:00
  { timestamp: 1705881600, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 22 00:00
  { timestamp: 1705903200, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 22 06:00
  { timestamp: 1705924800, wPOKT_wETH: 0.049, POKT_wETH: 0.048, POKT_SOL: 0.051 }, // Jan 22 12:00
  { timestamp: 1705946400, wPOKT_wETH: 0.048, POKT_wETH: 0.047, POKT_SOL: 0.05 }, // Jan 22 18:00
  { timestamp: 1705968000, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 23 00:00
  { timestamp: 1705989600, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 23 06:00
  { timestamp: 1706011200, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 23 12:00
  { timestamp: 1706032800, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 23 18:00
  { timestamp: 1706054400, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 24 00:00
  { timestamp: 1706076000, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 24 06:00
  { timestamp: 1706097600, wPOKT_wETH: 0.049, POKT_wETH: 0.048, POKT_SOL: 0.051 }, // Jan 24 12:00
  { timestamp: 1706119200, wPOKT_wETH: 0.048, POKT_wETH: 0.047, POKT_SOL: 0.05 }, // Jan 24 18:00
  { timestamp: 1706140800, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 25 00:00
  { timestamp: 1706162400, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 25 06:00
  { timestamp: 1706184000, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 25 12:00
  { timestamp: 1706205600, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 25 18:00
  { timestamp: 1706227200, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 26 00:00
  { timestamp: 1706248800, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 26 06:00
  { timestamp: 1706270400, wPOKT_wETH: 0.049, POKT_wETH: 0.048, POKT_SOL: 0.051 }, // Jan 26 12:00
  { timestamp: 1706292000, wPOKT_wETH: 0.048, POKT_wETH: 0.047, POKT_SOL: 0.05 }, // Jan 26 18:00
  { timestamp: 1706313600, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 27 00:00
  { timestamp: 1706335200, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 27 06:00
  { timestamp: 1706356800, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 27 12:00
  { timestamp: 1706378400, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 27 18:00
  { timestamp: 1706400000, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 28 00:00
  { timestamp: 1706421600, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 28 06:00
  { timestamp: 1706443200, wPOKT_wETH: 0.049, POKT_wETH: 0.048, POKT_SOL: 0.051 }, // Jan 28 12:00
  { timestamp: 1706464800, wPOKT_wETH: 0.048, POKT_wETH: 0.047, POKT_SOL: 0.05 }, // Jan 28 18:00
  { timestamp: 1706486400, wPOKT_wETH: 0.046, POKT_wETH: 0.045, POKT_SOL: 0.048 }, // Jan 29 00:00
  { timestamp: 1706508000, wPOKT_wETH: 0.044, POKT_wETH: 0.043, POKT_SOL: 0.046 }, // Jan 29 06:00
  { timestamp: 1706529600, wPOKT_wETH: 0.042, POKT_wETH: 0.041, POKT_SOL: 0.044 }, // Jan 29 12:00
  { timestamp: 1706551200, wPOKT_wETH: 0.043, POKT_wETH: 0.042, POKT_SOL: 0.045 }, // Jan 29 18:00
  { timestamp: 1706572800, wPOKT_wETH: 0.045, POKT_wETH: 0.044, POKT_SOL: 0.047 }, // Jan 30 00:00
  { timestamp: 1706594400, wPOKT_wETH: 0.047, POKT_wETH: 0.046, POKT_SOL: 0.049 }, // Jan 30 06:00
  { timestamp: 1706616000, wPOKT_wETH: 0.049, POKT_wETH: 0.048, POKT_SOL: 0.051 }, // Jan 30 12:00
  { timestamp: 1706637600, wPOKT_wETH: 0.048, POKT_wETH: 0.047, POKT_SOL: 0.05 }, // Jan 30 18:00
];

// const historicalData2 = Array.from({ length: 100 }, (_, i) => ({
//   timestamp: new Date().getTime() / 1000 + i * 60,
//   wPOKT_wETH: 0.048 + i * 0.001,
//   POKT_wETH: 0.047 + i * 0.001,
//   POKT_SOL: 0.05 + i * 0.001,
// }));

export function HistoricalPriceLineChart({ data }: Props) {
  const activeDot = { r: 6 };

  // Use static data if no prop is provided
  const formattedData = data ? formatHistoricalDataFromProps(data) : historicalData;
  const [timestep, setTimestep] = useState<typeof timestepOptions[number]>(timestepOptions[0]);

const yPadding = 0;

  return (
    <div className='flex flex-col gap-8'>
    <div className='flex flex-row gap-2'>
    {
      timestepOptions.map((option) => (
        <Button key={option.label} onClick={() => setTimestep(option)} variant={timestep === option ? 'default' : 'outline'}>{option.label}</Button>
      ))
    }
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
            domain={[0.035, 0.055]}
            tickFormatter={(value) => `${formatNumber(value)}`}
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
            const entry = payload.find(x => x.dataKey === pairName)
            return (
              <Fragment key={`item-${entry.name}`}>
                <div
                  className=" col-span-2 text-sm flex items-center"
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
                  ${formatNumber(entry.value)}
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
