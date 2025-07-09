export type RetryOptions = {
  retries?: number; // Max number of attempts
  delayMs?: number; // Delay between attempts (ms)
  factor?: number; // Backoff multiplier; increase delay by this factor after each attempt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRetry?: (err: any, attempt: number) => void; // Optional callback on retry
};

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 3, delayMs = 500, factor = 2, onRetry } = options;

  let attempt = 0;
  let currentDelay = delayMs;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;

      if (onRetry) {
        onRetry(err, attempt + 1);
      }

      await new Promise((res) => setTimeout(res, currentDelay));
      currentDelay *= factor;
      attempt++;
    }
  }

  // This line should never be reached
  throw new Error('Retry logic failed unexpectedly');
}
