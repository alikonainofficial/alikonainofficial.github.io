import { describe, expect, it } from 'vitest';
import { SEAM_OVERLAP, SEAM_RAMP, ditherSeam, halftoneSeam } from './seams';

const svgOf = (cssUrl: string) => decodeURIComponent(cssUrl.slice('url("data:image/svg+xml,'.length, -2));

describe('seams', () => {
  it('leave room for the fade inside the ramp', () => {
    expect(SEAM_RAMP).toBeGreaterThan(SEAM_OVERLAP);
  });

  it('start the halftone with no ink and end it fully covered', () => {
    const radii = [...svgOf(halftoneSeam()).matchAll(/r='([\d.]+)'/g)].map((m) => Number(m[1]));
    expect(radii[0]).toBeLessThan(1);
    // An 8px screen is covered once a dot reaches the cell's corner, about 5.66px out.
    expect(radii.at(-1)).toBeGreaterThan(5.66);
  });

  it('light every pixel of the last dither row and none of the first', () => {
    const svg = svgOf(ditherSeam(SEAM_RAMP, 8));
    const lastRow = Math.floor((SEAM_RAMP - 1) / 8) * 8;
    expect(svg.match(new RegExp(`y='${lastRow}'`, 'g'))).toHaveLength(4);
    expect(svg).not.toContain("y='0'");
  });
});
