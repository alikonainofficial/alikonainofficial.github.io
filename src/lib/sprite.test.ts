import { describe, expect, it } from 'vitest';
import { EYE_ROWS, WAIST_ROW, ali, eyes, lids, rows, spritePaths, spriteSvg, withoutEyes } from './sprite';

describe('sprite', () => {
  it('has a rectangular grid and a colour for every code', () => {
    expect(ali.grid).toHaveLength(ali.height);
    for (const row of ali.grid) {
      expect(row).toHaveLength(ali.width);
      for (const code of row.replaceAll('.', '')) expect(ali.palette[code]).toBeDefined();
    }
  });

  it('merges runs into one path per colour', () => {
    const paths = spritePaths({ width: 3, height: 1, grid: ['AAB'], palette: { A: '#000', B: '#fff' } });
    expect(paths).toEqual([
      { fill: '#000', d: 'M0 0h2v1h-2z' },
      { fill: '#fff', d: 'M2 0h1v1h-1z' },
    ]);
  });

  it('rejects rows of the wrong width', () => {
    expect(() => spritePaths({ width: 2, height: 1, grid: ['AAA'], palette: { A: '#000' } })).toThrow();
  });

  it('lines the eye layers up with the eyes in the face', () => {
    for (const layer of [eyes, lids]) {
      layer.grid.forEach((row, i) => {
        const face = ali.grid[EYE_ROWS[i]!]!;
        [...row].forEach((code, x) => {
          if (code !== '.') expect(face.charAt(x)).toMatch(/[EW]/);
        });
      });
    }
  });

  it('paints over the eyes but leaves the sneakers white', () => {
    const blank = withoutEyes(ali);
    for (const y of EYE_ROWS) expect(blank.grid[y]).not.toMatch(/[EW]/);
    expect(blank.grid.slice(20).join('')).toContain('W');
  });

  it('splits the body at the waist without losing a pixel', () => {
    const top = rows(ali, 0, WAIST_ROW);
    const legs = rows(ali, WAIST_ROW, ali.height);
    ali.grid.forEach((row, y) => {
      [...row].forEach((code, x) => {
        const fromTop = top.grid[y]!.charAt(x);
        const fromLegs = legs.grid[y]!.charAt(x);
        expect(fromTop === '.' ? fromLegs : fromTop).toBe(code);
      });
    });
  });

  it('renders a standalone SVG with a custom crop', () => {
    expect(spriteSvg(ali, '1 0 18 18')).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="1 0 18 18"/);
  });
});
