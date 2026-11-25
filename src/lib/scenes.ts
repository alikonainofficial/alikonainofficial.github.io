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

/** Both arms up: the torso only. The arms themselves are drawn outside the box by armsUp(). */
const ARMS_UP = [
  '..KAAOOOSSSSOOOAAK..',
  '...KKOlOOOOOOOOKK...',
  '....KOlOOOOOOOoK....',
  '....KOOOOOOOOOoK....',
  '....KooooooooooK....',
];

/** The viewer's left arm up (his right), the other still at his side. */
const ARM_RAISED = [
  '..KAAOOOSSSSOOOAAK..',
  '...KKOlOOOOOOOOAAAK.',
  '....KOlOOOOOOOoKaAK.',
  '....KOOOOOOOOOoKaAK.',
  '....KooooooooooKSSK.',
];

function body(arms: readonly string[], eyesShut = false): string[] {
  const grid = [...ali.grid.slice(0, 17), ...arms, ...ali.grid.slice(22)];
  // With the hands away from his sides, the hip row loses the outline that framed them.
  if (arms === ARMS_UP) grid[22] = '....KPPPPPPPPPPK....';
  if (eyesShut) EYE_ROWS.forEach((row, i) => (grid[row] = overlay(grid[row]!, lids.grid[i]!)));
  return grid;
}

function overlay(base: string, top: string): string {
  return [...base].map((c, i) => (top[i] && top[i] !== '.' ? top[i] : c)).join('');
}

function armsUp(r: Raster, x: number, y: number, swap: Record<string, string> = {}): void {
  const A = swap.A ?? 'A';
  const a = swap.a ?? 'a';
  const S = swap.S ?? 'S';
  r.rect(x - 2, y - 4, 1, 21, 'K').rect(x - 1, y - 4, 1, 21, A).rect(x, y - 4, 1, 20, a);
  r.rect(x + 21, y - 4, 1, 21, 'K').rect(x + 20, y - 4, 1, 21, A).rect(x + 19, y - 4, 1, 20, a);
  r.rect(x + 1, y + 15, 2, 3, A).rect(x + 17, y + 15, 2, 3, A);
  r.rect(x - 2, y - 6, 3, 2, S).rect(x + 19, y - 6, 3, 2, S);
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
    label: 'Pixel-art Ali riding a lime-green Kawasaki Z1000 along a city road at night, under streetlights and a full moon.',
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
  G: '#6cc02c',
  v: '#3f7f1a',
  V: '#a6e25c',
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
  r.line(...P(25, 7 + b), ...P(29, 7 + b), 'F');

  // Ali, tucked in behind the screen: helmet, jacket, jeans and boots.
  r.line(...P(12, 11 + b), ...P(19, 15 + b), 'Q', 3).line(...P(19, 15 + b), ...P(17, 20 + b), 'Q', 2).rect(...P(15, 20 + b), 4, 2, 'f');
  r.poly([P(10, 10 + b), P(14, 4 + b), P(21, 3 + b), P(23, 6 + b), P(15, 12 + b)], 'k').line(...P(11, 10 + b), ...P(15, 12 + b), 'j');
  r.line(...P(20, 5 + b), ...P(26, 8 + b), 'k', 2).rect(...P(26, 7 + b), 2, 2, 'i');
  r.disc(...P(22.5, 2.5 + b), 3.3, 'J');
  r.rect(...P(20, -1 + b), 4, 1, 'G').rect(...P(23, 2 + b), 3, 2, 'C').set(...P(25, 2 + b), 'c');
  return r.grid();
}

/* ----------------------------------------------------------------------------------------------
 * The gym: three overhead presses and a new PR.
 * -------------------------------------------------------------------------------------------- */

function gym(): Scene {
  const x = 38;
  const y = 19;
  const room = new Raster(W, H);
  room.rect(0, 0, W, 46, '1').rect(0, 30, W, 16, '2').rect(0, 30, W, 1, '3');
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

  const bar = (r: Raster, row: number) => {
    const by = y + row;
    r.rect(x - 15, by, 50, 1, 'b');
    for (const px of [x - 13, x + 30]) r.rect(px, by - 5, 3, 11, 'p').rect(px, by - 5, 3, 1, 'q').rect(px, by + 5, 3, 1, 'q');
    r.rect(x - 10, by - 1, 1, 3, 'X').rect(x + 29, by - 1, 1, 3, 'X');
  };

  const pose = (kind: 'down' | 'chest' | 'up', shut: boolean, sweat = false) => {
    const r = new Raster(W, H);
    if (kind === 'up') armsUp(r, x, y);
    r.blit(body(kind === 'down' ? ARMS_DOWN : kind === 'chest' ? ARMS_CHEST : ARMS_UP, shut), x, y);
    bar(r, kind === 'down' ? 21 : kind === 'chest' ? 18 : -5);
    if (kind === 'up') r.rect(x - 2, y - 6, 3, 2, 'S').rect(x + 19, y - 6, 3, 2, 'S');
    if (sweat) r.set(x + 19, y + 5, 'x').rect(x + 19, y + 6, 1, 2, 'x');
    return r.grid();
  };

  const spark = new Raster(W, H);
  for (const [sx, sy] of [
    [x - 22, y - 9],
    [x + 40, y - 3],
  ] as const) {
    spark.rect(sx, sy - 2, 1, 5, '*').rect(sx - 2, sy, 5, 1, '*');
  }

  const DOWN = 0;
  const CHEST = 1;
  const UP_STRAIN = 2;
  const UP_PROUD = 3;
  const steps: Step[] = [{ at: 0, set: { lifter: { f: DOWN }, spark: { show: false } }, hud: 'SET 1 · REP 0' }];
  let t = 300;
  for (let rep = 1; rep <= 3; rep++) {
    steps.push({ at: t, set: { lifter: { f: CHEST } } });
    steps.push({ at: t + 350, set: { lifter: { f: UP_STRAIN } }, hud: `SET 1 · REP ${rep}` });
    if (rep < 3) {
      steps.push({ at: t + 850, set: { lifter: { f: CHEST } } });
      steps.push({ at: t + 1150, set: { lifter: { f: DOWN } } });
      t += 1400;
    } else t += 850;
  }
  steps.push({ at: t + 200, set: { lifter: { f: UP_PROUD }, spark: { show: true } }, hud: 'NEW PR!' });

  return {
    id: 'gym',
    title: 'Every day, no excuses',
    caption: 'The gym, every single day. The barbell is the only thing I never debug.',
    label: 'Pixel-art Ali in his olive gym tank, pressing a loaded barbell overhead in a gym at night.',
    width: W,
    height: H,
    palette: {
      ...ali.palette,
      '1': '#0f262c',
      '2': '#14323a',
      '3': '#1f4650',
      '4': '#191b21',
      '5': '#23262e',
      m: '#183843',
      M: '#24505c',
      r: '#3c4250',
      R: '#59606f',
      D: '#24242b',
      X: '#8f8a80',
      b: '#c9c4b8',
      p: '#141418',
      q: '#e2bb6e',
      x: '#9fd3f0',
      '*': '#ff7a59',
    },
    layers: [
      { name: 'room', frames: [room.grid()] },
      { name: 'lifter', frames: [pose('down', false), pose('chest', false), pose('up', true, true), pose('up', false)] },
      { name: 'spark', frames: [spark.grid()] },
    ],
    steps,
    duration: t + 1600,
  };
}

/* ----------------------------------------------------------------------------------------------
 * The volunteer: a snap, a sway, and the volunteer finds out they can play the sax.
 * -------------------------------------------------------------------------------------------- */

/** The volunteer wears Ali's build in their own colours: copper hair, a blue hoodie, grey jeans. */
const VOLUNTEER: Record<string, string> = {
  H: '1',
  h: '2',
  d: '3',
  B: '3',
  S: '4',
  s: '5',
  A: '4',
  a: '5',
  O: '6',
  o: '7',
  l: '8',
  P: '9',
  Y: '9',
};

const SAX = ['......kk.', '.....GG..', '.....GG..', '....GGg..', '....GGg..', '...GGg...', '...GGg...', 'GG.GGg...', 'GGGGGg...', '.GGGg....', '..gg.....'];

const NOTE = ['..nn', '..n.', '..n.', 'nnn.', 'nn..'];

function volunteerShow(): Scene {
  const hx = 16;
  const vx = 58;
  const y = 21;

  const stage = new Raster(W, H);
  for (let x = 0; x < W; x++) {
    const fold = x % 8;
    stage.rect(x, 0, 1, 44, fold === 0 || fold === 1 ? 'C' : fold === 4 ? 'u' : 'c');
  }
  // A valance across the top with brass fringe, then the boards.
  stage.rect(0, 0, W, 4, 'C').rect(0, 4, W, 1, 'G');
  for (let x = 1; x < W; x += 3) stage.set(x, 5, 'G');
  stage.rect(0, 44, W, H - 44, 'f');
  for (let py = 46; py < H; py += 3) stage.rect(0, py, W, 1, 'F');
  stage.rect(0, H - 1, W, 1, 'e');
  const light = new Raster(W, H).poly(
    [
      [30, 5],
      [66, 5],
      [92, 52],
      [4, 52],
    ],
    'L',
  );

  const host = (raised: boolean) => {
    const r = new Raster(W, H);
    if (raised) r.line(hx + 1, y + 17, hx - 2, y + 9, 'A', 2).rect(hx - 3, y + 7, 2, 2, 'S');
    r.blit(body(raised ? ARM_RAISED : ARMS_DOWN), hx, y);
    r.blit(hat.grid, hx, y - hat.height, { K: 'Z', B: 'b' });
    return r.grid();
  };

  const volunteer = (pose: 'down' | 'sax', shut: boolean) => {
    const r = new Raster(W, H);
    r.blit(body(pose === 'sax' ? ARMS_CHEST : ARMS_DOWN, shut), vx, y, VOLUNTEER);
    if (pose === 'sax') r.blit(SAX, vx + 4, y + 14);
    return r.grid();
  };

  const spark = new Raster(W, H);
  spark.rect(hx - 5, y + 2, 1, 5, '*').rect(hx - 7, y + 4, 5, 1, '*').set(hx - 8, y + 1, '*').set(hx - 1, y + 1, '*');

  const notes = [0, 1, 2].map((f) => {
    const r = new Raster(W, H);
    r.blit(NOTE, vx - 4, y + 10 - f * 3).blit(NOTE, vx - 9, y + 2 - f * 2).blit(NOTE, vx + 21, y + 6 - f * 3);
    return r.grid();
  });

  const steps: Step[] = [
    { at: 0, set: { host: { f: 1 }, spark: { show: true }, volunteer: { f: 0, dx: 0 }, notes: { show: false } } },
    { at: 450, set: { host: { f: 0 }, spark: { show: false }, volunteer: { f: 1 } } },
    { at: 900, set: { volunteer: { dx: -1 } } },
    { at: 1300, set: { volunteer: { dx: 1 } } },
    { at: 1700, set: { volunteer: { dx: -1 } } },
    { at: 2100, set: { volunteer: { dx: 0 } } },
    { at: 2500, set: { host: { f: 1 }, spark: { show: true } } },
    { at: 2950, set: { spark: { show: false }, volunteer: { f: 2 }, notes: { show: true } } },
  ];

  return {
    id: 'volunteer',
    title: 'A volunteer from the audience',
    caption: 'Beginner mentalism and stage hypnosis. Every volunteer leaves with a new skill.',
    label: 'Pixel-art Ali in a top hat on a curtained stage, arm raised toward a smiling volunteer who is playing a saxophone, with music notes in the air.',
    width: W,
    height: H,
    palette: {
      ...ali.palette,
      c: '#7a1a24',
      C: '#5e121b',
      u: '#932a35',
      G: '#e2bb6e',
      g: '#a8823e',
      k: '#1c1315',
      f: '#5a3b24',
      F: '#4a2f1c',
      e: '#2f1d10',
      L: 'rgba(255, 236, 190, 0.13)',
      Z: '#101014',
      T: '#26262e',
      t: '#3a3a46',
      b: '#d9b36c',
      n: '#f3efe6',
      '*': '#ff7a59',
      '1': '#b5632d',
      '2': '#d98a4e',
      '3': '#6e3818',
      '4': '#c68b62',
      '5': '#a9714d',
      '6': '#4f78b0',
      '7': '#3b5d8c',
      '8': '#7aa0d4',
      '9': '#3a3640',
    },
    layers: [
      { name: 'stage', frames: [stage.grid()] },
      { name: 'light', frames: [light.grid()] },
      { name: 'host', frames: [host(false), host(true)] },
      { name: 'spark', frames: [spark.grid()] },
      { name: 'volunteer', frames: [volunteer('down', false), volunteer('down', true), volunteer('sax', true)] },
      { name: 'notes', frames: notes, fps: 4 },
    ],
    steps,
    duration: 6400,
  };
}

export const scenes: Scene[] = [nightRide(), gym(), volunteerShow()];
