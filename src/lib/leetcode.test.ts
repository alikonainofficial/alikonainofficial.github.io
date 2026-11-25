import { describe, expect, it } from 'vitest';
import { hardShare, level, practice, shortDate } from './leetcode';

const day = (iso: string) => String(Date.parse(`${iso}T00:00:00Z`) / 1000);

describe('level', () => {
  it('ramps from none to a big day', () => {
    expect([0, 1, 2, 3, 4, 6, 7, 20].map(level)).toEqual([0, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe('practice', () => {
  const today = new Date('2026-11-25T15:00:00Z'); // a Wednesday

  it('starts on the Monday of the first active week and ends today', () => {
    const p = practice({ [day('2026-07-24')]: 2, [day('2026-11-25')]: 1 }, today);
    const first = p.weeks[0]!;
    expect(first[0]!.date).toBe('2026-07-20');
    expect(first[4]).toMatchObject({ date: '2026-07-24', count: 2, level: 2 });
    const last = p.weeks.at(-1)!;
    expect(last[2]).toMatchObject({ date: '2026-11-25', count: 1 });
    expect(last[3]).toBeNull();
    expect(p.since).toBe('2026-07-24');
    expect(p.spanDays).toBe(125);
  });

  it('counts active days and the longest run', () => {
    const p = practice({ [day('2026-11-20')]: 1, [day('2026-11-21')]: 3, [day('2026-11-22')]: 1, [day('2026-11-24')]: 1 }, today);
    expect(p.activeDays).toBe(4);
    expect(p.longestRun).toBe(3);
  });

  it('shows at least the minimum number of weeks for a fresh start', () => {
    const p = practice({ [day('2026-11-24')]: 1 }, today, 12);
    expect(p.weeks).toHaveLength(12);
  });

  it('ignores anything older than a year', () => {
    const p = practice({ [day('2025-01-01')]: 5, [day('2026-11-01')]: 1 }, today);
    expect(p.activeDays).toBe(1);
    expect(p.since).toBe('2026-11-01');
  });

  it('labels each month once, at its first week', () => {
    const p = practice({ [day('2026-07-24')]: 1 }, today);
    expect(p.months.map((m) => m.label)).toEqual(['Aug', 'Sep', 'Oct', 'Nov']);
    expect(new Set(p.months.map((m) => m.week)).size).toBe(p.months.length);
  });
});

describe('formatting', () => {
  it('writes dates the site way', () => {
    expect(shortDate('2026-11-25T03:17:00Z')).toBe('25 Nov 2026');
    expect(shortDate(1795573624)).toBe('25 Nov 2026');
  });

  it('reports the Medium-and-Hard share', () => {
    expect(hardShare({ all: 154, easy: 48, medium: 91, hard: 15 })).toBe(69);
    expect(hardShare({ all: 0, easy: 0, medium: 0, hard: 0 })).toBe(0);
  });
});
