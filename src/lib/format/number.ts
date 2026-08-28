/** Rounds half-up at a fixed number of decimals, correcting float representation drift. */
export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** decimals;
  return Math.round(Number((value * factor).toPrecision(15))) / factor;
}

/**
 * Formats a logged amount for display. Large values read better as whole numbers,
 * while small ones keep a decimal so an entry like 0.4 g never renders as "0".
 */
export function formatAmount(value: number, unit = ""): string {
  const rounded = Math.abs(value) >= 100 ? Math.round(value) : roundTo(value, 1);
  return `${rounded.toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit}`;
}
