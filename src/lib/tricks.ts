/** The arithmetic and card logic behind each trick, kept pure so it can be tested. */

/* ---------- The engineer's trick: binary cards ---------- */

export const BITS = 6;
export const MAX = 2 ** BITS - 1; // 63

/** Card n lists every number from 1 to 63 whose bit n is set. Its first number is 2^n. */
export function binaryCard(bit: number): number[] {
  const out: number[] = [];
  for (let n = 1; n <= MAX; n += 1) if (n & (1 << bit)) out.push(n);
  return out;
}

/** The number is the sum of the first numbers on the cards it appears on. */
export function decodeBinary(pickedBits: Iterable<number>): number {
  let n = 0;
  for (const bit of pickedBits) n |= 1 << bit;
  return n;
}

/* ---------- The vanishing card ---------- */

export interface Card {
  rank: 'K' | 'Q' | 'J';
  suit: '♠' | '♥' | '♣' | '♦';
}

export const isRed = (c: Card) => c.suit === '♥' || c.suit === '♦';
export const cardName = (c: Card) =>
  `${{ K: 'King', Q: 'Queen', J: 'Jack' }[c.rank]} of ${{ '♠': 'spades', '♥': 'hearts', '♣': 'clubs', '♦': 'diamonds' }[c.suit]}`;

/** Six court cards to remember... */
export const VANISH_BEFORE: readonly Card[] = [
  { rank: 'K', suit: '♠' },
  { rank: 'Q', suit: '♥' },
  { rank: 'J', suit: '♣' },
  { rank: 'K', suit: '♦' },
  { rank: 'Q', suit: '♠' },
  { rank: 'J', suit: '♥' },
];

/** ...and five that come back. None of them was in the first six, which is the whole trick. */
export const VANISH_AFTER: readonly Card[] = [
  { rank: 'K', suit: '♣' },
  { rank: 'Q', suit: '♦' },
  { rank: 'J', suit: '♠' },
  { rank: 'K', suit: '♥' },
  { rank: 'Q', suit: '♣' },
];

/* ---------- Think of a number ---------- */

/** Double it, add 10, halve it, take away the start: always 5. */
export function thinkOfANumber(n: number): number {
  return (n * 2 + 10) / 2 - n;
}

/* ---------- The 1089 ---------- */

const reverse3 = (n: number) => Number(String(n).padStart(3, '0').split('').reverse().join(''));

/** Every step of the 1089, so the page can show its working. */
export function steps1089(n: number): { reversed: number; diff: number; diffReversed: number; total: number } {
  const reversed = reverse3(n);
  const diff = Math.abs(n - reversed);
  const diffReversed = reverse3(diff);
  return { reversed, diff, diffReversed, total: diff + diffReversed };
}

/** For a three-digit number whose first and last digits differ by 2 or more, this is always 1089. */
export function trick1089(n: number): number {
  return steps1089(n).total;
}

export function valid1089(n: number): boolean {
  if (!Number.isInteger(n) || n < 100 || n > 999) return false;
  const first = Math.floor(n / 100);
  const last = n % 10;
  return Math.abs(first - last) >= 2;
}

/* ---------- The hover tell and the sealed prediction ---------- */

/** The key with the largest value, or null when nothing was recorded. */
export function strongest<T extends string>(tally: Partial<Record<T, number>>): { key: T; value: number } | null {
  let best: { key: T; value: number } | null = null;
  for (const [key, value] of Object.entries(tally) as [T, number][]) {
    if (typeof value === 'number' && value > 0 && (!best || value > best.value)) best = { key, value };
  }
  return best;
}

export function times(n: number): string {
  if (n === 1) return 'once';
  if (n === 2) return 'twice';
  if (n === 3) return 'three times';
  return `${n} times`;
}

export function duration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} second${s === 1 ? '' : 's'}`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m} minute${m === 1 ? '' : 's'}` : `${m} minute${m === 1 ? '' : 's'} and ${r} second${r === 1 ? '' : 's'}`;
}
