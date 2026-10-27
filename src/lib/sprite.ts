/**
 * Pixel art as data.
 *
 * Each sprite is a grid of single-character codes mapped to a palette. At build
 * time the grid is turned into one SVG <path> per colour, merging horizontal
 * runs, so the avatar ships as ~2 KB of crisp vector markup instead of an image.
 */

export type Palette = Record<string, string>;

export interface Sprite {
  width: number;
  height: number;
  grid: readonly string[];
  palette: Palette;
}

export interface SpritePath {
  fill: string;
  d: string;
}

/** Ali in his gym kit, drawn like a classic handheld-RPG character: big head, swept fringe, olive tank, track pants. */
export const ali: Sprite = {
  width: 20,
  height: 27,
  grid: [
    '......KKKKKKKK......',
    '....KKHHHHHHHHKK....',
    '...KHHHHHhhhHHHHK...',
    '..KHHHHhhHHHHHHHHK..',
    '..KHHHHHHHHHHHHHHK..',
    '.KHHHHHHHHHHHHHHHHK.',
    '.KHHHHHHHHHHHHHHHHK.',
    '.KHHHHHHHHHHHHHHHHK.',
    '.KHHHHHHHHHHdsSSHHK.',
    '.KHHHHHHdsSSSSSSHHK.',
    '.KHHHHdsSSSSSSSSHHK.',
    '.KHHdSBBSSSSBBSSSHK.',
    '.KSSSSEWSSSSEWSSSSK.',
    '.KSSSSEESSSSEESSSSK.',
    '..KSSSSSSSSSSSSSSK..',
    '...KsSSSSSSSSSSsK...',
    '....KKsSSSSSSsKK....',
    '..KAAOOOSSSSOOOAAK..',
    '.KAAAOlOOOOOOOOAAAK.',
    '.KAaKOlOOOOOOOoKaAK.',
    '.KAaKOOOOOOOOOoKaAK.',
    '.KSSKooooooooooKSSK.',
    '..KKKPPPPPPPPPPKKK..',
    '....KPYPPKKPPYPK....',
    '....KPYPPKKPPYPK....',
    '...KwWWWWKKWWWWwK...',
    '...KKKKKKKKKKKKKK...',
  ],
  palette: {
    K: '#1c1315', // outline
    H: '#43302a', // hair
    h: '#7a5b4b', // hair shine
    d: '#2a1d19', // fringe edge
    B: '#2a1d19', // eyebrows
    S: '#eab48d', // skin
    s: '#cf9572', // skin shade
    A: '#eab48d', // arms
    a: '#cf9572', // arm shade
    E: '#2a1d1f', // eyes
    W: '#ffffff', // eye shine and sneakers
    O: '#7a7a34', // olive tank
    o: '#5b5b24', // tank shade
    l: '#9b9b4a', // tank highlight
    P: '#2b2a33', // track pants
    Y: '#e8c547', // pant stripe
    w: '#b9b4a8', // sneaker shade
  },
};

/** Turn a sprite into one path per colour. Transparent cells are '.'. */
export function spritePaths(sprite: Sprite): SpritePath[] {
  const byColour = new Map<string, string[]>();

  sprite.grid.forEach((row, y) => {
    if (row.length !== sprite.width) {
      throw new Error(`Sprite row ${y} is ${row.length} wide, expected ${sprite.width}`);
    }
    let x = 0;
    while (x < row.length) {
      const code = row.charAt(x);
      if (code === '.') {
        x += 1;
        continue;
      }
      const fill = sprite.palette[code];
      if (!fill) throw new Error(`No palette entry for "${code}"`);
      let end = x + 1;
      while (end < row.length && row.charAt(end) !== '.' && sprite.palette[row.charAt(end)] === fill) end += 1;
      const run = end - x;
      const segments = byColour.get(fill) ?? [];
      segments.push(`M${x} ${y}h${run}v1h-${run}z`);
      byColour.set(fill, segments);
      x = end;
    }
  });

  return [...byColour].map(([fill, segments]) => ({ fill, d: segments.join('') }));
}

/** A standalone SVG string, used for the favicon and the social card. */
export function spriteSvg(sprite: Sprite, viewBox = `0 0 ${sprite.width} ${sprite.height}`): string {
  const paths = spritePaths(sprite)
    .map(({ fill, d }) => `<path fill="${fill}" d="${d}"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" shape-rendering="crispEdges">${paths}</svg>`;
}
