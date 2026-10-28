import { describe, expect, it } from 'vitest';
import { soundChosen, soundPreferred } from './audio';

const stored = (value: string | null) => ({ getItem: () => value });
const blocked = { getItem: (): string | null => { throw new Error('blocked'); } };

describe('the sound preference', () => {
  it('is off until the visitor presses play', () => {
    expect(soundPreferred(stored(null))).toBe(false);
    expect(soundPreferred(undefined)).toBe(false);
    expect(soundPreferred(blocked)).toBe(false);
  });

  it('remembers the visitor turning it on, and off again', () => {
    expect(soundPreferred(stored('on'))).toBe(true);
    expect(soundPreferred(stored('off'))).toBe(false);
  });
});

describe('the invitation to press play', () => {
  it('shows until the visitor has made a choice either way', () => {
    expect(soundChosen(stored(null))).toBe(false);
    expect(soundChosen(blocked)).toBe(false);
    expect(soundChosen(stored('on'))).toBe(true);
    expect(soundChosen(stored('off'))).toBe(true);
  });
});
