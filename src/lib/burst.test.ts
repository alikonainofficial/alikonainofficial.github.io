import { describe, expect, it } from 'vitest';
import { launch } from './burst';

describe('card burst', () => {
  it('launches every card upward from the origin', () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const cards = launch(50, { x: 200, y: 300 }, random);
    expect(cards).toHaveLength(50);
    for (const c of cards) {
      expect(c.x).toBe(200);
      expect(c.y).toBe(300);
      expect(c.vy).toBeLessThan(0);
    }
  });

  it('fans out to both sides', () => {
    const cards = launch(2, { x: 0, y: 0 }, (() => {
      // Four draws per card: angle, speed, spin, phase.
      const values = [0, 0, 0, 0, 0.999, 0, 0, 0];
      return () => values.shift() ?? 0.5;
    })());
    expect(cards[0]!.vx).toBeLessThan(0);
    expect(cards[1]!.vx).toBeGreaterThan(0);
  });
});
