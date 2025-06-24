/**
 * Determines whether the price has changed significantly enough to insert in db.
 */
export const isSignificantlyDifferent = (a: number, b: number, epsilon = 0.000001): boolean => {
  return Math.abs(a - b) > epsilon;
};
