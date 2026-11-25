/**
 * Material textures for the section worlds (cork, felt, chalk, velvet), drawn
 * as tiny SVG noise and inlined as CSS backgrounds. They are generated once at
 * build time, so they cost no request and no script.
 */

export interface Grain {
  /** feTurbulence base frequency: higher is finer. */
  frequency: number;
  octaves?: number;
  /** Specks darker than the surface, or lighter. */
  tone: 'dark' | 'light';
  /** How many specks survive, 0 to 1. */
  amount: number;
  /** Tile size in px. */
  size?: number;
  seed?: number;
}

/** A tileable noise texture as a CSS url(), for use in a background. */
export function grain({ frequency, octaves = 2, tone, amount, size = 220, seed = 7 }: Grain): string {
  // Map the noise's red channel to alpha, so only the strongest part of it shows as specks.
  // Fractal noise sits around 0.5; specks start at a threshold that drops as amount rises.
  const threshold = 0.7 - 0.4 * amount;
  const rgb = tone === 'dark' ? '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0' : '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1';
  const alpha = `4 0 0 0 ${(-4 * threshold).toFixed(2)}`;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>` +
    `<filter id='g' x='0' y='0'><feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/>` +
    `<feColorMatrix values='${rgb} ${alpha}'/></filter>` +
    `<rect width='100%' height='100%' filter='url(#g)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Inline style for a section: each entry becomes a custom property. */
export function styleVars(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
}
