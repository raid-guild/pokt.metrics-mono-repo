import { expect, it } from 'vitest';

const roundToIntervalSec = (tsMs: number, minutes: number) => {
  const intervalMs = minutes * 60_000;
  const secPerInterval = minutes * 60;
  return Math.round(tsMs / intervalMs) * secPerInterval; // epoch seconds (rounded)
};

it('rounds ms to 15m intervals and returns seconds (relative checks)', () => {
  const base = Date.UTC(2025, 7, 18, 0, 0, 0); // ms
  const baseRounded = roundToIntervalSec(base, 15);

  // ~00:01 → same bucket as base
  expect(roundToIntervalSec(base + 1 * 60_000, 15) - baseRounded).toBe(0);

  // ~00:07 → same bucket as base
  expect(roundToIntervalSec(base + 7 * 60_000, 15) - baseRounded).toBe(0);

  // ~00:08 → next bucket (+900s)
  expect(roundToIntervalSec(base + 8 * 60_000, 15) - baseRounded).toBe(900);
});
