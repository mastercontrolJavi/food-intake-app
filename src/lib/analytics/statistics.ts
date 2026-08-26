export function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

export function mean(values: Array<number | null | undefined>): number | null {
  const known = values.filter((value): value is number => value != null && Number.isFinite(value));
  return known.length ? sum(known) / known.length : null;
}

export function median(values: Array<number | null | undefined>): number | null {
  const known = values.filter((value): value is number => value != null && Number.isFinite(value)).sort((a, b) => a - b);
  if (!known.length) return null;
  const middle = Math.floor(known.length / 2);
  return known.length % 2 ? known[middle] : (known[middle - 1] + known[middle]) / 2;
}

export function min(values: Array<number | null | undefined>): number | null {
  const known = values.filter((value): value is number => value != null && Number.isFinite(value));
  return known.length ? Math.min(...known) : null;
}

export function max(values: Array<number | null | undefined>): number | null {
  const known = values.filter((value): value is number => value != null && Number.isFinite(value));
  return known.length ? Math.max(...known) : null;
}

export function standardDeviation(values: Array<number | null | undefined>): number | null {
  const known = values.filter((value): value is number => value != null && Number.isFinite(value));
  const average = mean(known);
  if (average == null || known.length < 2) return null;
  return Math.sqrt(known.reduce((total, value) => total + (value - average) ** 2, 0) / known.length);
}

export function percentChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

export function percentagePointChange(currentRate: number, previousRate: number): number {
  return currentRate - previousRate;
}

export function rollingAverage(values: number[], windowSize: number): Array<number | null> {
  return values.map((_, index) => index + 1 < windowSize ? null : mean(values.slice(index + 1 - windowSize, index + 1)));
}

export function groupBy<T, K extends string | number>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce((groups, item) => {
    const group = key(item);
    (groups[group] ??= []).push(item);
    return groups;
  }, {} as Record<K, T[]>);
}
