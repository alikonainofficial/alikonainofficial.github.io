/**
 * The rehearsal log's numbers, worked out at build time from the LeetCode
 * snapshot in src/data/leetcode.json (see scripts/fetch-leetcode.mjs).
 * Everything here is pure, so the page ships the answers and no script.
 */

export interface Snapshot {
  username: string;
  fetchedAt: string;
  solved: { all: number; easy: number; medium: number; hard: number };
  /** Unix seconds at UTC midnight → accepted submissions that day. */
  calendar: Record<string, number>;
  tags: { name: string; solved: number }[];
  recent: { title: string; slug: string; at: number }[];
}

export interface Day {
  /** YYYY-MM-DD, UTC. */
  date: string;
  count: number;
  /** 0 (none) to 4 (a big day), for the colour ramp. */
  level: 0 | 1 | 2 | 3 | 4;
}

export interface Practice {
  /** Week columns, Monday first. Days after today are null. */
  weeks: (Day | null)[][];
  /** Month labels, placed at the first week column that starts in that month. */
  months: { label: string; week: number }[];
  activeDays: number;
  /** Days from the first day shown up to today, inclusive. */
  spanDays: number;
  longestRun: number;
  since: string;
}

const DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function level(count: number): Day['level'] {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function utcMidnight(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function iso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * The practice calendar. It starts on the Monday of the week of the first
 * active day in the last year, so a run that began recently fills the grid
 * instead of sitting at the end of a mostly empty year, and never shows fewer
 * than minWeeks.
 */
export function practice(calendar: Snapshot['calendar'], today: Date, minWeeks = 12): Practice {
  const end = utcMidnight(today);
  const yearAgo = end - 364 * DAY;
  const counts = new Map<number, number>();
  for (const [secs, n] of Object.entries(calendar)) {
    const ms = utcMidnight(new Date(Number(secs) * 1000));
    if (ms >= yearAgo && ms <= end && n > 0) counts.set(ms, (counts.get(ms) ?? 0) + n);
  }

  const first = counts.size ? Math.min(...counts.keys()) : end;
  const mondayOf = (ms: number) => ms - ((new Date(ms).getUTCDay() + 6) % 7) * DAY;
  let start = mondayOf(first);
  const earliest = mondayOf(end) - (minWeeks - 1) * 7 * DAY;
  if (start > earliest) start = Math.max(earliest, mondayOf(yearAgo));

  const weeks: (Day | null)[][] = [];
  const months: Practice['months'] = [];
  for (let w = start, col = 0; w <= end; w += 7 * DAY, col++) {
    const week: (Day | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const ms = w + d * DAY;
      const count = counts.get(ms) ?? 0;
      week.push(ms > end ? null : { date: iso(ms), count, level: level(count) });
    }
    // Label a column when its Monday starts a new month. The first column only gets one
    // if most of its month is still ahead, so two labels never crowd each other.
    const month = new Date(w).getUTCMonth();
    const newMonth = col === 0 ? new Date(w).getUTCDate() <= 14 : new Date(w - 7 * DAY).getUTCMonth() !== month;
    if (newMonth) months.push({ label: MONTHS[month]!, week: col });
    weeks.push(week);
  }

  let longestRun = 0;
  let run = 0;
  for (let ms = start; ms <= end; ms += DAY) {
    run = counts.has(ms) ? run + 1 : 0;
    longestRun = Math.max(longestRun, run);
  }

  return {
    weeks,
    months,
    activeDays: [...counts.keys()].filter((ms) => ms >= start).length,
    spanDays: Math.round((end - first) / DAY) + 1,
    longestRun,
    since: iso(first),
  };
}

/** "24 Jul 2026", the way the rest of the site writes dates. */
export function shortDate(input: string | number | Date): string {
  const d = typeof input === 'number' ? new Date(input * 1000) : new Date(input);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Share of solved problems that were Medium or Hard, as a whole percentage. */
export function hardShare(solved: Snapshot['solved']): number {
  return solved.all ? Math.round(((solved.medium + solved.hard) / solved.all) * 100) : 0;
}
