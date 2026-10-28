import { describe, expect, it } from 'vitest';
import { pickEncore } from './acts';
import {
  BITS,
  MAX,
  VANISH_AFTER,
  VANISH_BEFORE,
  binaryCard,
  decodeBinary,
  duration,
  strongest,
  steps1089,
  thinkOfANumber,
  times,
  trick1089,
  valid1089,
} from './tricks';

describe("the engineer's trick", () => {
  it('starts each card with its place value and lists 32 numbers', () => {
    for (let bit = 0; bit < BITS; bit += 1) {
      const card = binaryCard(bit);
      expect(card[0]).toBe(2 ** bit);
      expect(card).toHaveLength(32);
    }
  });

  it('finds every number from 1 to 63 from the cards it is on', () => {
    for (let n = 1; n <= MAX; n += 1) {
      const picked = [...Array(BITS).keys()].filter((bit) => binaryCard(bit).includes(n));
      expect(decodeBinary(picked)).toBe(n);
    }
  });
});

describe('the vanishing card', () => {
  it('brings back none of the original six', () => {
    const key = (c: { rank: string; suit: string }) => c.rank + c.suit;
    const before = new Set(VANISH_BEFORE.map(key));
    expect(VANISH_AFTER.some((c) => before.has(key(c)))).toBe(false);
    expect(VANISH_AFTER).toHaveLength(VANISH_BEFORE.length - 1);
  });
});

describe('the arithmetic tricks', () => {
  it('always lands on 5', () => {
    for (let n = 1; n <= 10; n += 1) expect(thinkOfANumber(n)).toBe(5);
  });

  it('always lands on 1089 for every valid starting number', () => {
    for (let n = 100; n <= 999; n += 1) if (valid1089(n)) expect(trick1089(n)).toBe(1089);
  });

  it('shows its working', () => {
    expect(steps1089(731)).toEqual({ reversed: 137, diff: 594, diffReversed: 495, total: 1089 });
    expect(steps1089(312)).toEqual({ reversed: 213, diff: 99, diffReversed: 990, total: 1089 });
  });

  it('rejects starting numbers that would break it', () => {
    expect(valid1089(121)).toBe(false);
    expect(valid1089(99)).toBe(false);
    expect(valid1089(731)).toBe(true);
  });
});

describe('tallies and wording', () => {
  it('picks the strongest entry', () => {
    expect(strongest({ a: 2, b: 5, c: 1 })).toEqual({ key: 'b', value: 5 });
    expect(strongest({})).toBeNull();
  });

  it('reads naturally', () => {
    expect(times(2)).toBe('twice');
    expect(duration(4_000)).toBe('4 seconds');
    expect(duration(61_000)).toBe('1 minute and 1 second');
  });
});

describe('encore rotation', () => {
  it('honours an explicit request, then unseen favourites, then anything unseen', () => {
    expect(pickEncore('#encore-eleven', 'vanish', new Set())).toBe('eleven');
    expect(pickEncore('', 'vanish', new Set())).toBe('vanish');
    expect(pickEncore('', 'vanish', new Set(['vanish']))).toBe('number');
    expect(pickEncore('', 'vanish', new Set(['vanish', 'number', 'eleven']))).toBe('vanish');
    expect(pickEncore('#work', 'number', new Set())).toBe('number');
  });
});
