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

/** Ali in his everyday kit: swept hair, glasses, moustache, olive tank, track pants. */
export const ali: Sprite = {
  width: 20,
  height: 31,
  grid: [
    '......KKKKKKKK......',
    '....KKHHHHHHHHKK....',
    '...KHHHHHhhhHHHHK...',
    '..KHHHHhhhHHHHHHHK..',
    '..KHHHHHHHHHHHHHHK..',
    '..KHHHHHHHHHHHHHHK..',
    '..KHHHHHHHHHHHHHHK..',
    '...KHHHHHHSSSSSHHK..',
    '...KHSSSSSSSSSSHK...',
    '..KSGGGGGSSGGGGGSK..',
    '..KSGSSSGGGGSSSGSK..',
    '..KSGSESGSSGSESGSK..',
    '..KSGGGGGSSGGGGGSK..',
    '...KSSSSSssSSSSSK...',
    '...KSSMMMMMMMMSSK...',
    '...KSSSSSSmmSSSSK...',
    '....KSSSSSSSSSSK....',
    '.....KKsSSSSsKK.....',
    '..KAAOOOSSSSOOOAAK..',
    '.KAAAOOOOOOOOOOAAAK.',
    '.KAaKOOOOOOOOOOKaAK.',
    '.KAaKOOOoOOOOOOKaAK.',
    '.KAaKOOOOOOOOoOKaAK.',
    '.KAAKooooooooooKAAK.',
    '..KAKPPPPPPPPPPKAK..',
    '...KKPPPPPPPPPPKK...',
    '....KPYPPKKPPYPK....',
    '....KPYPPKKPPYPK....',
    '....KPYPPKKPPYPK....',
    '...KWWWwWKKWwWWWK...',
    '...KKKKKK..KKKKKK...',
  ],
  palette: {
    K: '#140f12', // outline
    H: '#241a16', // hair
    h: '#3e2d25', // hair highlight
    S: '#d9a17b', // skin
    s: '#b98261', // skin shade
    A: '#d9a17b', // arms
    a: '#b98261', // arm shade
    G: '#0f0d10', // glasses frame
    E: '#2a1c17', // eyes
    M: '#2a1c17', // moustache
    m: '#a35f4c', // lip
    O: '#5c5a2b', // olive tank
    o: '#47451f', // tank shade
    P: '#1c1b21', // track pants
    Y: '#d6b33a', // pant stripe
    W: '#ece9e1', // sneakers
    w: '#9a978e', // sneaker shade
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
