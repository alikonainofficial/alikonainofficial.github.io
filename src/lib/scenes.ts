/**
 * After hours: three short pixel scenes of Ali off the clock, drawn in code.
 *
 * A scene is a stack of layers. Each layer has one or more frames (full-size
 * character grids) and can scroll (`speed`, wrapping every `wrap` pixels) or
 * cycle its frames (`fps`) while the scene plays. `steps` is the script: at a
 * given time, set a layer's frame, visibility or offset, or the HUD line.
 * The still a visitor sees before pressing start is the end of the script,
 * so reduced motion, a scene scrolled away mid-play and the first paint all
 * show the same poster frame.
 */
import { Raster, seeded } from './pixel';
import { ali, hat, lids, EYE_ROWS, type Palette } from './sprite';

export interface LayerState {
  f?: number;
  show?: boolean;
  dx?: number;
  dy?: number;
}

export interface SceneLayer {
  name: string;
  frames: string[][];
  /** Pixels per second the layer scrolls left while playing; it repeats every `wrap` pixels. */
  speed?: number;
  wrap?: number;
  /** Frames per second to cycle through while playing. */
  fps?: number;
  /** Starting state, before any step. */
  start?: LayerState;
}

export interface Step {
  at: number;
  set?: Record<string, LayerState>;
  hud?: string;
}

export interface Scene {
  id: string;
  title: string;
  caption: string;
  /** What the still shows, for screen readers. */
  label: string;
  width: number;
  height: number;
  palette: Palette;
  layers: SceneLayer[];
  steps: Step[];
  duration: number;
}

export const W = 96;
export const H = 54;

/** Each layer's state once the whole script has run: the poster frame. */
export function finalState(scene: Scene): { layers: Record<string, Required<LayerState>>; hud: string } {
  const layers: Record<string, Required<LayerState>> = {};
  for (const l of scene.layers) layers[l.name] = { f: 0, show: true, dx: 0, dy: 0, ...l.start };
  let hud = '';
  for (const step of scene.steps) {
    for (const [name, s] of Object.entries(step.set ?? {})) Object.assign(layers[name]!, s);
    if (step.hud !== undefined) hud = step.hud;
  }
  return { layers, hud };
}

/* ----------------------------------------------------------------------------------------------
 * Shared poses. Ali's sprite keeps its head and legs; only rows 17 to 21 (shoulders to hands)
 * change, plus arms drawn outside the 20-pixel box when they go up.
 * -------------------------------------------------------------------------------------------- */

const ARMS_DOWN = ali.grid.slice(17, 22);

/** Hands in front of the chest, elbows in: holding a bar at row 18, or a sax. */
const ARMS_CHEST = [
  '..KAAOOOSSSSOOOAAK..',
  '.KSSAOlOOOOOOOOASSK.',
  '.KAAKOlOOOOOOOOKAAK.',
  '.KAaKOOOOOOOOOoKaAK.',
  '..KKKooooooooooKKK..',
];

/** The viewer's right arm up (his left), toward the volunteer; the other still at his side. */
const ARM_RAISED = [
  '..KAAOOOSSSSOOOAAK..',
  '.KAAAOlOOOOOOOOKK...',
  '.KAaKOlOOOOOOOoK....',
  '.KAaKOOOOOOOOOoK....',
  '.KSSKooooooooooK....',
];

function body(arms: readonly string[], eyesShut = false): string[] {
  const grid = [...ali.grid.slice(0, 17), ...arms, ...ali.grid.slice(22)];
  if (eyesShut) EYE_ROWS.forEach((row, i) => (grid[row] = overlay(grid[row]!, lids.grid[i]!)));
  return grid;
}

function overlay(base: string, top: string): string {
  return [...base].map((c, i) => (top[i] && top[i] !== '.' ? top[i] : c)).join('');
}

/* ----------------------------------------------------------------------------------------------
 * The night ride: the Kawasaki Z1000 through the city, three layers of parallax.
 * -------------------------------------------------------------------------------------------- */

const ROAD_Y = 44;

function nightRide(): Scene {
  const rand = seeded(1000);

  const sky = new Raster(W, H);
  for (let y = 0; y < ROAD_Y; y++) {
    for (let x = 0; x < W; x++) {
      const band = y < 12 ? '1' : y < 22 ? '2' : y < 32 ? '3' : '4';
      // Dither two rows at each band edge, like an old console gradient.
      const edge = y === 12 || y === 22 || y === 32 ? (x + y) % 2 === 0 : y === 13 || y === 23 || y === 33 ? (x + y) % 4 === 0 : false;
      const prev = y < 22 ? '1' : y < 32 ? '2' : '3';
      sky.set(x, y, edge ? prev : band);
    }
  }
  for (let i = 0; i < 26; i++) sky.set(Math.floor(rand() * W), Math.floor(rand() * 26), rand() < 0.35 ? '5' : '6');
  sky.disc(80, 9, 4.6, '7').set(79, 8, '8').set(81, 11, '8').set(78, 11, '8');

  const far = new Raster(W, H);
  for (let x = 0; x < W; ) {
    const w = Math.min(5 + Math.floor(rand() * 6), W - x);
    const h = 7 + Math.floor(rand() * 13);
    const top = 42 - h;
    far.rect(x, top, w, h, '9');
    for (let wy = top + 2; wy < 40; wy += 2) for (let wx = x + 1; wx < x + w - 1; wx += 2) if (rand() < 0.3) far.set(wx, wy, rand() < 0.6 ? 'y' : 'z');
    if (rand() < 0.3) far.rect(x + Math.floor(w / 2), top - 3, 1, 3, '9');
    x += w + (rand() < 0.3 ? 1 : 0);
  }

  const mid = new Raster(W, H);
  for (const lx of [20, 68]) {
    mid.poly(
      [
        [lx + 3, 25],
        [lx + 7, 25],
        [lx + 13, ROAD_Y + 6],
        [lx - 3, ROAD_Y + 6],
      ],
      'g',
    );
  }
  mid.rect(0, 40, W, 1, 'r');
  for (let x = 2; x < W; x += 6) mid.rect(x, 40, 1, 4, 'r');
  for (const lx of [20, 68]) mid.rect(lx, 21, 2, 23, 'p').rect(lx, 21, 6, 1, 'p').rect(lx + 4, 22, 3, 2, 'L');

  const road = new Raster(W, H);
  road.rect(0, ROAD_Y, W, H - ROAD_Y, 'q').rect(0, ROAD_Y, W, 1, 'e');
  for (let x = 0; x < W; x += 12) road.rect(x, 50, 6, 1, 'D');

  const bike = [0, 1].map((f) => drawBike(26, 20, f));

  return {
    id: 'night-ride',
    title: 'The night ride',
    caption: 'My Kawasaki Z1000, an empty road and the city asleep.',
    label: 'Pixel-art Ali riding his black Kawasaki Z1000 along a city road at night, under streetlights and a full moon.',
    width: W,
    height: H,
    palette: {
      '1': '#081328',
      '2': '#0d1d38',
      '3': '#132a4a',
      '4': '#1c3a5c',
      '5': '#f3efe6',
      '6': '#7f93b8',
      '7': '#f3e9c8',
      '8': '#d6cba3',
      '9': '#0b1a2e',
      y: '#e2bb6e',
      z: '#6f5d3a',
      r: '#22324a',
      p: '#2c3a4e',
      L: '#ffe7a3',
      g: 'rgba(255, 231, 163, 0.14)',
      q: '#15181f',
      e: '#394150',
      D: '#bdb6a3',
      ...BIKE_PALETTE,
    },
    layers: [
      { name: 'sky', frames: [sky.grid()] },
      { name: 'far', frames: [far.grid()], speed: 6, wrap: W },
      { name: 'mid', frames: [mid.grid()], speed: 30, wrap: W },
      { name: 'road', frames: [road.grid()], speed: 72, wrap: W },
      { name: 'bike', frames: bike, fps: 8 },
    ],
    steps: [],
    duration: 6000,
  };
}

const BIKE_PALETTE: Palette = {
  T: '#0f0f13',
  M: '#a19d93',
  m: '#5d5b56',
  G: '#1f1f26',
  v: '#0c0c10',
  V: '#8a93a6',
  F: '#202026',
  Z: '#121216',
  N: '#33333b',
  n: '#5a5a66',
  X: '#bdb8ad',
  x: '#7d786e',
  U: '#d4a72c',
  I: '#fff3c4',
  R: '#e0403a',
  b: 'rgba(255, 240, 190, 0.16)',
  J: '#17171c',
  C: '#4f6f96',
  c: '#b9d2ec',
  k: '#6b6b2c',
  j: '#4a4a1c',
  Q: '#3d4f73',
  f: '#101014',
  i: '#17171c',
};

/** The Z1000, side on and facing right, with Ali tucked in. `f` 0/1 turns the spokes and bobs him a pixel. */
function drawBike(ox: number, oy: number, f: number): string[] {
  const r = new Raster(W, H);
  const P = (x: number, y: number): [number, number] => [ox + x, oy + y];

  // Headlight beam first, so everything sits on top of it.
  r.poly([P(35, 9), P(W, 2), P(W, 30), P(35, 12)], 'b');

  for (const cx of [8.5, 31.5]) {
    const [x, y] = P(cx, 22.5);
    r.ring(x, y, 3.4, 5.6, 'T').ring(x, y, 2.4, 3.4, 'M');
    const hx = Math.floor(x);
    const hy = Math.floor(y);
    if (f === 0) r.rect(hx - 2, hy, 5, 1, 'm').rect(hx, hy - 2, 1, 5, 'm');
    else r.set(hx - 1, hy - 1, 'm').set(hx + 1, hy - 1, 'm').set(hx - 1, hy + 1, 'm').set(hx + 1, hy + 1, 'm').set(hx - 2, hy - 2, 'm').set(hx + 2, hy + 2, 'm').set(hx + 2, hy - 2, 'm').set(hx - 2, hy + 2, 'm');
    r.rect(hx, hy, 1, 1, 'M');
  }

  const b = f; // the body rides a pixel lower on the second frame
  r.line(...P(8, 22), ...P(17, 19 + b), 'F', 2);
  r.poly([P(4, 14 + b), P(12, 14 + b), P(12, 16 + b), P(5, 17 + b)], 'X').line(...P(5, 17 + b), ...P(12, 16 + b), 'x');
  r.rect(...P(14, 16 + b), 9, 6, 'N');
  r.line(...P(15, 17 + b), ...P(21, 17 + b), 'n').line(...P(15, 19 + b), ...P(21, 19 + b), 'n');
  r.line(...P(16, 13 + b), ...P(14, 17 + b), 'F', 2).line(...P(26, 12 + b), ...P(23, 17 + b), 'F', 2);
  r.poly([P(6, 11 + b), P(17, 10 + b), P(17, 13 + b), P(7, 13 + b)], 'Z');
  r.poly([P(1, 10 + b), P(7, 10 + b), P(8, 12 + b), P(3, 13 + b)], 'G').rect(...P(0, 11 + b), 2, 1, 'R');
  r.poly([P(16, 9 + b), P(26, 8 + b), P(28, 11 + b), P(24, 15 + b), P(16, 14 + b)], 'G');
  r.line(...P(17, 9 + b), ...P(25, 8 + b), 'V').poly([P(16, 13 + b), P(24, 14 + b), P(24, 15 + b), P(16, 14 + b)], 'v');
  r.poly([P(24, 12 + b), P(29, 12 + b), P(28, 17 + b), P(24, 17 + b)], 'G').line(...P(24, 16 + b), ...P(28, 16 + b), 'v');
  r.line(...P(29, 9 + b), ...P(31, 22), 'U', 2);
  r.poly([P(28, 6 + b), P(34, 7 + b), P(34, 11 + b), P(29, 11 + b)], 'G').rect(...P(33, 8 + b), 2, 2, 'I');
  // Black paint needs a rim of light to read at night: catch the edges of the cowl, tail and shroud.
  r.line(...P(28, 6 + b), ...P(33, 7 + b), 'V').line(...P(1, 10 + b), ...P(6, 10 + b), 'V').line(...P(24, 12 + b), ...P(28, 12 + b), 'V');
  r.line(...P(25, 7 + b), ...P(29, 7 + b), 'F');

  // Ali, tucked in behind the screen: helmet, jacket, jeans and boots.
  r.line(...P(12, 11 + b), ...P(19, 15 + b), 'Q', 3).line(...P(19, 15 + b), ...P(17, 20 + b), 'Q', 2).rect(...P(15, 20 + b), 4, 2, 'f');
  r.poly([P(10, 10 + b), P(14, 4 + b), P(21, 3 + b), P(23, 6 + b), P(15, 12 + b)], 'k').line(...P(11, 10 + b), ...P(15, 12 + b), 'j');
  r.line(...P(20, 5 + b), ...P(26, 8 + b), 'k', 2).rect(...P(26, 7 + b), 2, 2, 'i');
  r.disc(...P(22.5, 2.5 + b), 3.3, 'J');
  r.rect(...P(20, -1 + b), 4, 1, 'V').rect(...P(23, 2 + b), 3, 2, 'C').set(...P(25, 2 + b), 'c');
  return r.grid();
}

/* ----------------------------------------------------------------------------------------------
 * The gym: three barbell curls and a new PR, in a bright yellow gym that doesn't
 * borrow the club's teal.
 * -------------------------------------------------------------------------------------------- */

function gym(): Scene {
  const x = 38;
  const y = 19;
  const room = new Raster(W, H);
  room.rect(0, 0, W, 46, '1').rect(0, 30, W, 16, '2').rect(0, 29, W, 2, '3');
  room.rect(0, 46, W, H - 46, '4');
  for (let fx = 0; fx < W; fx += 12) room.rect(fx, 46, 1, H - 46, '5');
  room.rect(0, 46, W, 1, '5');
  // A wall mirror, a squat rack on the left and a dumbbell rack on the right.
  room.rect(30, 6, 36, 22, 'm').line(34, 26, 46, 8, 'M').line(38, 26, 50, 8, 'M');
  room.rect(5, 8, 2, 38, 'r').rect(19, 8, 2, 38, 'r').rect(5, 8, 16, 2, 'r').rect(6, 8, 1, 38, 'R');
  for (const hy of [22, 30]) room.rect(7, hy, 2, 1, 'R').rect(17, hy, 2, 1, 'R');
  room.rect(74, 30, 18, 2, 'r').rect(74, 38, 18, 2, 'r').rect(75, 32, 1, 14, 'r').rect(90, 32, 1, 14, 'r');
  for (let dx = 76; dx < 90; dx += 5) {
    room.rect(dx, 27, 1, 3, 'D').rect(dx + 1, 28, 2, 1, 'X').rect(dx + 3, 27, 1, 3, 'D');
    room.rect(dx, 35, 1, 3, 'D').rect(dx + 1, 36, 2, 1, 'X').rect(dx + 3, 35, 1, 3, 'D');
  }

  // Curls keep his arms their real length: the bar travels from his hands at row 21 to his chest at row 18.
  const pose = (curled: boolean, shut: boolean, sweat = false) => {
    const r = new Raster(W, H);
    r.blit(body(curled ? ARMS_CHEST : ARMS_DOWN, shut), x, y);
    const row = curled ? 18 : 21;
    const by = y + row;
    r.rect(x - 9, by, 38, 1, 'b');
    for (const px of [x - 8, x + 25]) r.rect(px, by - 4, 3, 9, 'p').rect(px, by - 4, 3, 1, 'q').rect(px, by + 4, 3, 1, 'q');
    r.rect(x - 5, by - 1, 1, 3, 'X').rect(x + 24, by - 1, 1, 3, 'X');
    // Hands back on top of the bar.
    r.rect(x + 2, by, 2, 1, 'S').rect(x + 16, by, 2, 1, 'S');
    if (sweat) r.set(x + 19, y + 5, 'x').rect(x + 19, y + 6, 1, 2, 'x');
    return r.grid();
  };

  const spark = new Raster(W, H);
  for (const [sx, sy] of [
    [x - 6, y + 2],
    [x + 26, y + 6],
  ] as const) {
    spark.rect(sx, sy - 2, 1, 5, '*').rect(sx - 2, sy, 5, 1, '*');
  }

  const DOWN = 0;
  const CURL = 1;
  const PROUD = 2;
  const steps: Step[] = [{ at: 0, set: { lifter: { f: DOWN }, spark: { show: false } }, hud: 'SET 1 · REP 0' }];
  let t = 300;
  for (let rep = 1; rep <= 3; rep++) {
    steps.push({ at: t, set: { lifter: { f: CURL } }, hud: `SET 1 · REP ${rep}` });
    if (rep < 3) {
      steps.push({ at: t + 650, set: { lifter: { f: DOWN } } });
      t += 1150;
    } else t += 700;
  }
  steps.push({ at: t, set: { lifter: { f: PROUD }, spark: { show: true } }, hud: 'NEW PR!' });

  return {
    id: 'gym',
    title: 'Every day, no excuses',
    caption: 'The gym, every single day. The barbell is the only thing I never debug.',
    label: 'Pixel-art Ali in his olive gym tank, curling a loaded barbell in a bright yellow gym.',
    width: W,
    height: H,
    palette: {
      ...ali.palette,
      '1': '#ffd447',
      '2': '#ffb72e',
      '3': '#ff6b3d',
      '4': '#3d3566',
      '5': '#4d4480',
      m: '#bfe8f5',
      M: '#ffffff',
      r: '#2b3350',
      R: '#4a5680',
      D: '#22263a',
      X: '#9aa3b8',
      b: '#e9e5da',
      p: '#1d1f2e',
      q: '#ff4f6d',
      x: '#2fa8e8',
      '*': '#ff2f7a',
    },
    layers: [
      { name: 'room', frames: [room.grid()] },
      { name: 'lifter', frames: [pose(false, false), pose(true, true, true), pose(true, false)] },
      { name: 'spark', frames: [spark.grid()] },
    ],
    steps,
    duration: t + 1600,
  };
}

/* ----------------------------------------------------------------------------------------------
 * The show in my head: a snap, a sway, and a girl from the audience finds out she can play the sax.
 * -------------------------------------------------------------------------------------------- */

/** The volunteer: long hair, a pink bow, a lavender dress. Same build and outline as Ali's sprite. */
const GIRL = [
  '......KKKKKKKK.KKK..',
  '....KKqqqqqqqqKRRRK.',
  '...KqqqqqQQQqqKRKRK.',
  '..KqqqqQQqqqqqKRRRK.',
  '..KqqqqqqqqqqqqKKK..',
  '.KqqqqqqqqqqqqqqqqK.',
  '.KqqqqqqqqqqqqqqqqK.',
  '.KqqqqqqqqqqqqqqqqK.',
  '.KqqxxxxxxxxxxxxqqK.',
  '.KqqjjjjjjjjjjjjqqK.',
  '.KqjjKKjjjjjjKKjjqK.',
  '.KqjjEWjjjjjjEWjjqK.',
  '.KqjjEEjjjjjjEEjjqK.',
  '.KqjppjjjmmjjjppjqK.',
  '.KqqKjjjjjjjjjjKqqK.',
  '.KqqqKKjjjjjjKKqqqK.',
  '.KqqqKVVjjjjVVKqqqK.',
  '.KqqKVVVVjjVVVVKqqK.',
  '..KjjVVVVVVVVVVjjK..',
  '..KjKVVViVVVVVVKjK..',
  '..KjKVVVVVVVVVVKjK..',
  '..KJKvVVVVVVVVvKJK..',
  '...KvvVVVVVVVVvvK...',
  '....KKKKKKKKKKKK....',
  '......KjjK.KjjK.....',
  '.....KyyyyKyyyyK....',
  '.....KKKKKKKKKKK....',
];

/** A pocket watch on a chain, swinging like a pendulum from `pivot`. */
function watchAt(r: Raster, px: number, py: number, deg: number): void {
  const len = 8;
  const rad = (deg * Math.PI) / 180;
  const cx = px + Math.sin(rad) * len;
  const cy = py + Math.cos(rad) * len;
  // The chain, a pixel at a time so it reads as links.
  for (let d = 1; d < len - 2; d++) r.set(px + Math.sin(rad) * d, py + Math.cos(rad) * d, d % 2 ? 'G' : 'g');
  r.disc(cx, cy, 2.9, 'G').disc(cx, cy, 1.7, 'n').set(cx, cy, 'k').set(cx - 1, cy - 2, 'n');
}

const Z_BIG = ['ZZZZZ', '...Z.', '..Z..', '.Z...', 'ZZZZZ'];
const Z_SMALL = ['ZZZZ', '..Z.', '.Z..', 'ZZZZ'];

function showInMyHead(): Scene {
  const hx = 22;
  const y = 19;
  const vx = hx + 19;
  const gy = 18;

  // A cosy room at night: striped wallpaper, a moonlit window, a lamp, a rug and an armchair.
  const room = new Raster(W, H);
  room.rect(0, 0, W, 44, '1');
  for (let x = 2; x < W; x += 6) room.rect(x, 0, 2, 34, '2');
  room.rect(0, 34, W, 10, '3').rect(0, 34, W, 1, '4');
  room.rect(4, 6, 18, 20, '5').rect(5, 7, 16, 18, '6').rect(12, 7, 2, 18, '5').rect(5, 15, 16, 1, '5');
  room.disc(9, 11, 2.6, 'M').set(17, 9, 'N').set(19, 13, 'N').set(16, 20, 'N').set(7, 21, 'N');
  room.rect(0, 44, W, H - 44, '7');
  for (let py = 46; py < H; py += 3) room.rect(0, py, W, 1, '8');
  room.poly(
    [
      [34, 47],
      [80, 47],
      [86, 52],
      [28, 52],
    ],
    'r',
  ).poly(
    [
      [36, 48],
      [78, 48],
      [83, 51],
      [31, 51],
    ],
    '9',
  );
  room.rect(85, 14, 1, 31, 'X').rect(82, 44, 7, 1, 'X').poly(
    [
      [82, 8],
      [89, 8],
      [91, 14],
      [80, 14],
    ],
    'L',
  );

  const glow = new Raster(W, H).disc(85.5, 14, 13, 'e');

  // The armchair, built around where she sits.
  // The back and seat sit behind her; the armrests go in front, so she sits in it, not on it.
  const chair = new Raster(W, H);
  chair.rect(vx - 5, gy + 5, 30, 22, 'C').rect(vx - 4, gy + 4, 28, 1, 'C').rect(vx - 2, gy + 3, 24, 1, 'C');
  chair.rect(vx - 3, gy + 5, 26, 17, 'c').rect(vx - 2, gy + 4, 24, 1, 'u');
  for (const bx of [vx + 2, vx + 9, vx + 16]) chair.set(bx, gy + 9, 'C').set(bx, gy + 14, 'C');
  chair.rect(vx - 4, gy + 22, 28, 2, 'u').rect(vx - 4, gy + 24, 28, 3, 'C');
  chair.rect(vx - 4, gy + 27, 2, 2, 'f').rect(vx + 22, gy + 27, 2, 2, 'f');
  const arms = new Raster(W, H);
  for (const ax of [vx - 3, vx + 16]) arms.rect(ax, gy + 16, 7, 11, 'c').rect(ax, gy + 16, 7, 2, 'u').rect(ax, gy + 25, 7, 2, 'C').rect(ax + 6, gy + 18, 1, 7, 'C');

  const host = () => {
    const r = new Raster(W, H);
    r.line(hx + 18, y + 17, hx + 22, y + 8, 'A', 2).rect(hx + 22, y + 6, 2, 2, 'S');
    r.blit(body(ARM_RAISED), hx, y);
    r.blit(hat.grid, hx, y - hat.height, { K: 'Z', B: 'b' });
    return r.grid();
  };

  /** Her, sitting: head and dress as standing, legs dangling over the seat. */
  const SITTING_LEGS = ['....KKKKKKKKKKKK....', '......KjjK.KjjK.....', '.....KyyyyKyyyyK....', '.....KKKKKKKKKKK....'];
  const girlSitting = (eyes: 'open' | 'drowsy' | 'asleep') => {
    const g = [...GIRL.slice(0, 23), ...SITTING_LEGS];
    if (eyes === 'drowsy') {
      // Heavy lids: the top half of each eye goes dark.
      g[11] = g[11]!.replace(/EW/g, 'KK');
    }
    if (eyes === 'asleep') {
      g[11] = g[11]!.replace(/EW/g, 'jj');
      g[12] = g[12]!.replace(/EE/g, 'KK');
      g[13] = g[13]!.replace('mm', 'jm');
    }
    const r = new Raster(W, H);
    r.blit(g, vx, gy);
    return r.grid();
  };

  // The pendulum swings from his hand: centre, out to the right, back through the middle, out to the left.
  const angles = [0, 16, 28, 16, 0, -16, -28, -16];
  const watch = angles.map((deg) => {
    const r = new Raster(W, H);
    watchAt(r, hx + 23, y + 7, deg);
    return r.grid();
  });

  const zzz = [0, 1, 2].map((f) => {
    const r = new Raster(W, H);
    r.blit(Z_SMALL, vx + 18, gy - 1 - f).blit(Z_BIG, vx + 22, gy - 6 - f).blit(Z_SMALL, vx + 28, gy - 11 - f);
    return r.grid();
  });

  const OPEN = 0;
  const DROWSY = 1;
  const ASLEEP = 2;
  const steps: Step[] = [
    { at: 0, set: { girl: { f: OPEN, dy: 0 }, zzz: { show: false } }, hud: 'You are getting sleepy…' },
    { at: 1500, set: { girl: { f: DROWSY } } },
    { at: 2400, set: { girl: { dy: 1 } }, hud: 'veeery sleepy…' },
    { at: 2800, set: { girl: { dy: 0 } } },
    { at: 3300, set: { girl: { dy: 1 } } },
    { at: 3600, set: { girl: { f: ASLEEP }, zzz: { show: true } }, hud: 'Sweet dreams.' },
  ];

  return {
    id: 'sleepy',
    title: 'You are getting sleepy…',
    caption: "A beginner's interest in mentalism and hypnosis. This is how I picture it going: a pocket watch, a comfy chair, a very good nap.",
    label:
      'Pixel-art Ali in a top hat, swinging a pocket watch like a pendulum in front of a cute girl in a pink armchair. She has dozed off with a little smile, and Zzz float above her. A cosy room at night, with a lamp and a moonlit window.',
    width: W,
    height: H,
    palette: {
      ...ali.palette,
      '1': '#2e2350',
      '2': '#352a5c',
      '3': '#47336c',
      '4': '#6b4f9a',
      '5': '#1b1433',
      '6': '#163566',
      M: '#fff1c7',
      N: '#ffffff',
      '7': '#6b4630',
      '8': '#5a3a27',
      '9': '#c2577a',
      r: '#e98aa8',
      X: '#2a2238',
      L: '#ffd27a',
      e: 'rgba(255, 210, 122, 0.16)',
      p: '#ff9db5',
      m: '#c2546a',
      c: '#d65a6e',
      C: '#a8404f',
      u: '#ef8494',
      f: '#3a2416',
      G: '#e8c05a',
      g: '#c9a24a',
      n: '#fff7dd',
      k: '#1c1315',
      Z: '#101014',
      T: '#26262e',
      t: '#3a3a46',
      b: '#d9b36c',
      q: '#4b2c2a',
      Q: '#8a5a4e',
      x: '#2e1a1a',
      R: '#ff6f9f',
      j: '#f5cfb0',
      J: '#dba98a',
      v: '#7f63d6',
      V: '#a98bff',
      i: '#cbb8ff',
      y: '#ff6f9f',
      z: '#ffffff',
    },
    layers: [
      { name: 'room', frames: [room.grid()] },
      { name: 'glow', frames: [glow.grid()] },
      { name: 'chair', frames: [chair.grid()] },
      { name: 'girl', frames: [girlSitting('open'), girlSitting('drowsy'), girlSitting('asleep')] },
      { name: 'armrests', frames: [arms.grid()] },
      { name: 'host', frames: [host()] },
      { name: 'watch', frames: watch, fps: 8 },
      { name: 'zzz', frames: zzz.map((g) => g.map((row) => row.replace(/Z/g, 'z'))), fps: 3 },
    ],
    steps,
    duration: 6000,
  };
}

export const scenes: Scene[] = [nightRide(), gym(), showInMyHead()];
