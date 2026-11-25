/**
 * A tiny pixel canvas for drawing scenes in code. Cells hold one palette code
 * each ('.' is transparent); grid() hands the result to spritePaths, so scenes
 * ship as crisp SVG like the avatar does.
 */

export type Point = readonly [number, number];

export class Raster {
  private readonly cells: string[][];

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.cells = Array.from({ length: height }, () => Array<string>(width).fill('.'));
  }

  set(x: number, y: number, code: string): this {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    if (code !== '.' && cx >= 0 && cy >= 0 && cx < this.width && cy < this.height) this.cells[cy]![cx] = code;
    return this;
  }

  get(x: number, y: number): string {
    return this.cells[y]?.[x] ?? '.';
  }

  rect(x: number, y: number, w: number, h: number, code: string): this {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, code);
    return this;
  }

  /** Copy a character grid in at (x, y). `swap` recolours codes on the way in. */
  blit(grid: readonly string[], x: number, y: number, swap: Record<string, string> = {}): this {
    grid.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const code = row.charAt(i);
        if (code !== '.') this.set(x + i, y + j, swap[code] ?? code);
      }
    });
    return this;
  }

  /** A straight line, `w` pixels thick. */
  line(x0: number, y0: number, x1: number, y1: number, code: string, w = 1): this {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / steps);
      const y = Math.round(y0 + ((y1 - y0) * s) / steps);
      const off = Math.floor((w - 1) / 2);
      this.rect(x - off, y - off, w, w, code);
    }
    return this;
  }

  /** Fill a polygon: a pixel is in when its centre is. */
  poly(points: readonly Point[], code: string): this {
    const ys = points.map((p) => p[1]);
    const xs = points.map((p) => p[0]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
        if (inside(x + 0.5, y + 0.5, points)) this.set(x, y, code);
      }
    }
    return this;
  }

  disc(cx: number, cy: number, r: number, code: string): this {
    return this.ring(cx, cy, -1, r, code);
  }

  /** Pixels whose centres sit between radius r0 (exclusive) and r1 (inclusive). */
  ring(cx: number, cy: number, r0: number, r1: number, code: string): this {
    for (let y = Math.floor(cy - r1 - 1); y <= Math.ceil(cy + r1 + 1); y++) {
      for (let x = Math.floor(cx - r1 - 1); x <= Math.ceil(cx + r1 + 1); x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= r1 && d > r0) this.set(x, y, code);
      }
    }
    return this;
  }

  grid(): string[] {
    return this.cells.map((row) => row.join(''));
  }
}

function inside(x: number, y: number, pts: readonly Point[]): boolean {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i]!;
    const [xj, yj] = pts[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** A small seeded random, so scenes come out the same on every build. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}
