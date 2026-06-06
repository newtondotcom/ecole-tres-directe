export type PeriodOption = {
  code: string;
  name?: string;
};

export const TRIMESTER_COUNT = 3;

export function getTrimesterPeriods<T extends PeriodOption>(periods: T[]): T[] {
  return periods.slice(0, TRIMESTER_COUNT);
}

export function formatTrimesterLabel(index: number): string {
  return `Trimestre ${index + 1}`;
}

export function getTrimesterLabel(period: PeriodOption, periods: PeriodOption[]): string {
  const index = getTrimesterPeriods(periods).findIndex((item) => item.code === period.code);
  return index >= 0 ? formatTrimesterLabel(index) : formatTrimesterLabel(0);
}

/** Rough trimester guess from the current date (French school year). */
export function guessCurrentPeriodIndex(periodCount: number): number {
  const count = Math.min(Math.max(periodCount, 0), TRIMESTER_COUNT);
  if (count <= 0) return 0;

  const month = new Date().getMonth(); // 0 = Jan … 11 = Dec
  let trimester = 0;

  if (month >= 0 && month <= 2) {
    trimester = 1; // Jan–Mar → T2
  } else if (month >= 3 && month <= 5) {
    trimester = 2; // Apr–Jun → T3
  } else if (month >= 8 && month <= 11) {
    trimester = 0; // Sep–Dec → T1
  } else {
    trimester = count - 1; // Jul–Aug → latest trimester
  }

  return Math.min(trimester, count - 1);
}

export function pickDefaultPeriod(periods: PeriodOption[]): PeriodOption | undefined {
  const trimesters = getTrimesterPeriods(periods);
  if (!trimesters.length) return undefined;
  return trimesters[guessCurrentPeriodIndex(trimesters.length)] ?? trimesters[trimesters.length - 1];
}
