export const ANALYTICS_LIMITS = {
  defaultPageSize: 25,
  maxPageSize: 100,
  rankingSize: 10,
  recentEventsSize: 20,
} as const;

export function rate(numerator: number, denominator: number) {
  return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
}

export function averageMilliseconds(values: Array<{ start: Date | null; end: Date | null }>) {
  const durations = values
    .filter((value): value is { start: Date; end: Date } => Boolean(value.start && value.end && value.end >= value.start))
    .map((value) => value.end.getTime() - value.start.getTime());
  return durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0;
}

