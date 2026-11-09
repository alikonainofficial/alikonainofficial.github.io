/**
 * Draws the cover for "The 300,000-book pipeline" as pixel art, in the site's
 * palette and the avatar's style: a bookshelf feeding books along a conveyor
 * into a machine and a database, under the number.
 *
 * Run with `node scripts/draw-books-cover.mjs`. It writes
 * src/assets/work/books-pipeline.png at 160 × 90 art pixels, scaled 10× with
 * nearest-neighbour so every pixel stays crisp.
 */

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const W = 160;
const H = 90;
const SCALE = 10;
const OUT = fileURLToPath(new URL('../src/assets/work/books-pipeline.png', import.meta.url));

const C = {
  room: '#0e2427',
  deep: '#0a1c1f',
  surface: '#163a42',
  surface2: '#1e4852',
  line: '#2a5a63',
  brass: '#e2bb6e',
  brassHi: '#efd096',
  marquee: '#ff7a59',
  cyan: '#5fe0d4',
  cyanDark: '#2f8f8a',
  cyanDeep: '#1f5f5c',
  magenta: '#f08cc8',
  cream: '#f3efe6',
  ink: '#1d1d1f',
  red: '#b0423a',
  wood: '#6b4a2f',
  woodDark: '#4a3220',
  woodLight: '#8a6340',
};

const pixels = new Uint8Array(W * H * 3);
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function px(x, y, hex) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const [r, g, b] = rgb(hex);
  const i = (y * W + x) * 3;
  pixels[i] = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
}

function rect(x, y, w, h, hex) {
  for (let j = y; j < y + h; j += 1) for (let i = x; i < x + w; i += 1) px(i, j, hex);
}

// A small deterministic random, so the shelf comes out the same on every run.
let seed = 300000;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/* ---------- the room and its spotlight ---------- */

rect(0, 0, W, H, C.room);
// Dithered pool of light behind the machinery: solid in the middle, a checkerboard at the edge.
for (let y = 0; y < H; y += 1) {
  for (let x = 0; x < W; x += 1) {
    const d = ((x - 100) / 58) ** 2 + ((y - 56) / 36) ** 2;
    if (d < 0.55 || (d < 1 && (x + y) % 2 === 0)) px(x, y, C.surface);
  }
}
rect(0, 78, W, 12, C.deep);
rect(0, 78, W, 1, C.line);

/* ---------- the bookshelf ---------- */

const shelf = { x: 6, y: 18, w: 46, h: 60 };
rect(shelf.x, shelf.y, shelf.w, shelf.h, C.woodDark);
rect(shelf.x + 2, shelf.y + 2, shelf.w - 4, shelf.h - 2, C.deep);
rect(shelf.x, shelf.y, shelf.w, 2, C.woodLight);

const SPINES = [C.brass, C.marquee, C.cyan, C.magenta, C.cream, C.red, C.cyanDark, C.brassHi, C.surface2];
const boards = [33, 47, 61, 75];
for (const board of boards) {
  rect(shelf.x, board, shelf.w, 2, C.wood);
  rect(shelf.x, board, shelf.w, 1, C.woodLight);
  let x = shelf.x + 3;
  const right = shelf.x + shelf.w - 3;
  while (x < right - 1) {
    const w = Math.min(2 + Math.floor(rand() * 3), right - x);
    const h = 8 + Math.floor(rand() * 4);
    const colour = SPINES[Math.floor(rand() * SPINES.length)];
    // Now and then, a gap on the shelf: a book that's already gone down the line.
    if (rand() < 0.08) {
      x += w + 1;
      continue;
    }
    rect(x, board - h, w, h, colour);
    rect(x, board - h, 1, h, C.ink);
    if (w > 2 && rand() < 0.6) rect(x + 1, board - h + 2, w - 1, 1, C.ink);
    x += w;
  }
}

/* ---------- the conveyor ---------- */

const belt = { x: 52, y: 70, w: 62 };
rect(belt.x, belt.y, belt.w, 1, C.ink);
rect(belt.x, belt.y + 1, belt.w, 2, C.line);
rect(belt.x, belt.y + 3, belt.w, 1, C.ink);
for (let x = belt.x + 2; x < belt.x + belt.w; x += 6) rect(x, belt.y + 1, 2, 2, C.surface2);
for (const legX of [58, 104]) rect(legX, belt.y + 4, 2, 78 - belt.y - 4, C.ink);

// Closed books riding the belt, pages showing at the top.
for (const [x, colour] of [
  [58, C.marquee],
  [71, C.cyan],
  [84, C.brass],
  [97, C.magenta],
]) {
  rect(x, 64, 8, 6, colour);
  rect(x, 64, 8, 1, C.cream);
  rect(x + 7, 65, 1, 5, C.cream);
  rect(x, 64, 1, 6, C.ink);
}

// Chevrons over the belt, pointing at the machine.
for (const x of [62, 76, 90]) {
  for (let i = 0; i < 3; i += 1) {
    px(x + i, 56 + i, C.brass);
    px(x + i, 60 - i, C.brass);
    px(x + i + 1, 56 + i, C.brass);
    px(x + i + 1, 60 - i, C.brass);
  }
}

/* ---------- the machine ---------- */

const m = { x: 114, y: 38, w: 27, h: 40 };
rect(m.x - 1, m.y - 1, m.w + 2, m.h + 1, C.ink);
rect(m.x, m.y, m.w, m.h, C.surface2);
rect(m.x, m.y, m.w, 1, C.line);
// The intake slot the belt runs into.
rect(m.x - 1, 63, 4, 10, C.ink);
// A screen of log lines and a progress bar.
rect(m.x + 3, m.y + 4, m.w - 6, 16, C.deep);
for (const [row, len] of [
  [m.y + 6, 14],
  [m.y + 8, 9],
  [m.y + 10, 16],
  [m.y + 12, 11],
]) {
  rect(m.x + 5, row, 1, 1, C.brass);
  rect(m.x + 7, row, len - 2, 1, C.cyan);
}
rect(m.x + 5, m.y + 16, m.w - 10, 2, C.line);
rect(m.x + 5, m.y + 16, Math.round((m.w - 10) * 0.85), 2, C.brass);
// Three status lights and a vent.
rect(m.x + 4, m.y + 24, 3, 3, C.marquee);
rect(m.x + 9, m.y + 24, 3, 3, C.cyan);
rect(m.x + 14, m.y + 24, 3, 3, C.brass);
for (let y = m.y + 30; y < m.y + 37; y += 2) rect(m.x + 4, y, m.w - 8, 1, C.line);
// The lamp on top, lit.
rect(m.x + 11, m.y - 4, 5, 3, C.ink);
rect(m.x + 12, m.y - 3, 3, 2, C.marquee);
px(m.x + 13, m.y - 6, C.marquee);
px(m.x + 9, m.y - 5, C.marquee);
px(m.x + 17, m.y - 5, C.marquee);

/* ---------- the database ---------- */

rect(141, 60, 4, 2, C.ink);
const db = { x: 145, w: 13 };
for (const top of [47, 57, 67]) {
  rect(db.x + 2, top, db.w - 4, 1, C.cyan);
  rect(db.x + 1, top + 1, db.w - 2, 1, C.cyan);
  rect(db.x, top + 2, db.w, 6, C.cyanDark);
  rect(db.x, top + 2, 2, 6, C.cyan);
  rect(db.x + 1, top + 8, db.w - 2, 1, C.cyanDeep);
  rect(db.x + 2, top + 9, db.w - 4, 1, C.cyanDeep);
}
rect(db.x + 9, 51, 2, 1, C.brass);
rect(db.x + 9, 61, 2, 1, C.brass);
rect(db.x + 9, 71, 2, 1, C.brass);

/* ---------- the number ---------- */

const FONT = {
  0: ['111', '101', '101', '101', '111'],
  3: ['111', '001', '011', '001', '111'],
  ',': ['0', '0', '0', '1', '1'],
  '+': ['000', '010', '111', '010', '000'],
  B: ['110', '101', '110', '101', '110'],
  O: ['111', '101', '101', '101', '111'],
  K: ['101', '101', '110', '101', '101'],
  S: ['111', '100', '111', '001', '111'],
};

function text(str, x, y, scale, colour, shadow) {
  let cx = x;
  for (const ch of str) {
    const glyph = FONT[ch];
    if (!glyph) throw new Error(`No glyph for "${ch}"`);
    glyph.forEach((row, gy) =>
      [...row].forEach((bit, gx) => {
        if (bit !== '1') return;
        if (shadow) rect(cx + gx * scale + 1, y + gy * scale + 1, scale, scale, shadow);
        rect(cx + gx * scale, y + gy * scale, scale, scale, colour);
      }),
    );
    cx += (glyph[0].length + 1) * scale;
  }
  return cx;
}

text('300,000+', 64, 7, 3, C.cream, C.red);
text('BOOKS', 64, 27, 2, C.brass);

/* ---------- write it ---------- */

await sharp(Buffer.from(pixels), { raw: { width: W, height: H, channels: 3 } })
  .resize(W * SCALE, H * SCALE, { kernel: 'nearest' })
  .png({ compressionLevel: 9, palette: true })
  .toFile(OUT);

console.log(`Wrote ${OUT}`);
