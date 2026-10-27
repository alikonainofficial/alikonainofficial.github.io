import { describe, expect, it } from 'vitest';
import { ali, spritePaths, spriteSvg } from './sprite';

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

  it('renders a standalone SVG with a custom crop', () => {
    expect(spriteSvg(ali, '1 0 18 18')).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="1 0 18 18"/);
  });
});
