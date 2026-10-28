import { describe, expect, it } from 'vitest';
import { soundPreferred } from './audio';

const stored = (value: string | null) => ({ getItem: () => value });

describe('the sound preference', () => {
  it('is on for a first-time visitor', () => {
    expect(soundPreferred(stored(null))).toBe(true);
    expect(soundPreferred(undefined)).toBe(true);
  });

  it('stays off once the visitor switches it off', () => {
    expect(soundPreferred(stored('off'))).toBe(false);
    expect(soundPreferred(stored('on'))).toBe(true);
  });

  it('defaults to on when storage is blocked', () => {
    expect(soundPreferred({ getItem: () => { throw new Error('blocked'); } })).toBe(true);
  });
});
