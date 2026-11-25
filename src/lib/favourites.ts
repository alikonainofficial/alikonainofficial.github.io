/**
 * Ali's top fives, in his order. Images live in src/assets/favourites/<slug>.(jpg|png|webp);
 * a title without an image yet gets a lettered title card until one is added.
 *
 * `focus` is where a crop centres (CSS object-position) when a frame's shape
 * differs from the picture's: the tall #1 panel, a square tile, a phone screen.
 */

export interface Favourite {
  slug: string;
  title: string;
  focus?: string;
}

export interface Game extends Favourite {
  /** Where the square tile crops. */
  tile: string;
  /** A colour pulled from the art, for the selected tile's glow and the rank. */
  accent: string;
}

export const anime: readonly Favourite[] = [
  { slug: 'sword-art-online', title: 'Sword Art Online', focus: '50% 40%' },
  { slug: 'one-piece', title: 'One Piece' },
  { slug: 'berserk', title: 'Berserk', focus: '50% 55%' },
  { slug: 'gintama', title: 'Gintama', focus: '60% 50%' },
  { slug: 'death-note', title: 'Death Note' },
];

export const games: readonly Game[] = [
  { slug: 'god-of-war', title: 'God of War', focus: '52% 30%', tile: '47% 30%', accent: '#e0473c' },
  { slug: 'halo', title: 'Halo', focus: '52% 35%', tile: '51% 30%', accent: '#b6cf4a' },
  { slug: 'the-last-of-us', title: 'The Last of Us', focus: '62% 40%', tile: '66% 35%', accent: '#f0a54a' },
  { slug: 'need-for-speed-world', title: 'Need for Speed', focus: '42% 60%', tile: '42% 65%', accent: '#4fb3ff' },
  { slug: 'call-of-duty', title: 'Call of Duty', focus: '62% 40%', tile: '62% 35%', accent: '#8be23a' },
];
