export const START_DATE = "2026-10-03";
export const DAYS = 15;
export const HOURS = 24;

const WEEKDAYS = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

export type Day = {
  date: string;
  dayOfMonth: number;
  weekday: string;
};

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const DAY_LIST: Day[] = Array.from({ length: DAYS }, (_, i) => {
  const date = parseIsoDate(START_DATE);
  date.setDate(date.getDate() + i);
  return {
    date: toIsoDate(date),
    dayOfMonth: date.getDate(),
    weekday: WEEKDAYS[date.getDay()],
  };
});

export const DATE_SET = new Set(DAY_LIST.map((d) => d.date));

export function isInRange(date: string, hour: number): boolean {
  return DATE_SET.has(date) && Number.isInteger(hour) && hour >= 0 && hour < HOURS;
}

/**
 * The server runs with TZ set to the user's zone (see docker-compose.yml), so
 * local time here is the same wall clock the browser reports.
 */
export function localNow(): { date: string; hour: number } {
  const now = new Date();
  return { date: toIsoDate(now), hour: now.getHours() };
}

export function isFuture(date: string, hour: number, now: { date: string; hour: number }): boolean {
  if (date > now.date) return true;
  return date === now.date && hour > now.hour;
}

export function cellKey(date: string, hour: number): string {
  return `${date}#${hour}`;
}
