import { vi } from 'vitest';

vi.useFakeTimers();
vi.setSystemTime(new Date('2025-08-18T00:00:00Z'));

// reduce noise in test output
const noop = () => {};
globalThis.console = {
  ...console,
  info: noop,
  log: noop,
  debug: noop,
  // eslint-disable-next-line no-console
  warn: console.warn,
  // eslint-disable-next-line no-console
  error: console.error,
};
