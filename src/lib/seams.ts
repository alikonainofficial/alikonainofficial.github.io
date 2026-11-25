/**
 * The seams between the home page's worlds. Each section overlaps the one above
 * it and fades its own top edge in over it, so two worlds cross-fade instead of
 * meeting at a line. How it fades suits the material: screentone dots into and
 * out of the manga page, an ordered pixel dither into the pixel worlds, and a
 * plain eased fade everywhere else (that one is pure CSS, in global.css).
 *
 * These masks are drawn at build time and set on <main> as custom properties.
 */

/**
 * How far a section reaches up over the one above it (every section leaves at least this much
 * room at its foot), and how long the fade is: the overlap plus a little of the section's own top
 * padding. global.css sets the same two numbers as --seam and --seam-ramp: change them together.
 */
export const SEAM_OVERLAP = 120;
export const SEAM_RAMP = 184;

/** Starts and finishes gently. */
const ease = (t: number) => t * t * (3 - 2 * t);

const url = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Halftone: an 8px screen, alternate rows offset half a cell, the dots growing until they cover. */
export function halftoneSeam(ramp = SEAM_RAMP): string {
  const dots: string[] = [];
  for (let y = 4, row = 0; y < ramp; y += 8, row++) {
    const r = 5.8 * ease(y / ramp);
    if (r < 0.35) continue;
    const off = row % 2 ? 4 : 0;
    for (const x of [off, off + 8, off + 16]) dots.push(`<circle cx='${x}' cy='${y}' r='${r.toFixed(2)}'/>`);
  }
  return url(`<svg xmlns='http://www.w3.org/2000/svg' width='16' height='${ramp}'>${dots.join('')}</svg>`);
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

/** Ordered dither: 8px pixels from a 4x4 Bayer matrix, each lighting once the ramp passes its threshold. */
export function ditherSeam(ramp = SEAM_RAMP, pixel = 8): string {
  const px: string[] = [];
  for (let y = 0, j = 0; y < ramp; y += pixel, j++) {
    const t = ease((y + pixel / 2) / ramp);
    for (let i = 0; i < 4; i++) {
      if ((BAYER[j % 4]![i]! + 0.5) / 16 < t) px.push(`<rect x='${i * pixel}' y='${y}' width='${pixel}' height='${pixel}'/>`);
    }
  }
  return url(`<svg xmlns='http://www.w3.org/2000/svg' width='${pixel * 4}' height='${ramp}' shape-rendering='crispEdges'>${px.join('')}</svg>`);
}

/** Inline style for <main>: the two drawn masks. */
export function seamStyle(): string {
  return `--seam-halftone:${halftoneSeam()};--seam-dither:${ditherSeam()}`;
}
