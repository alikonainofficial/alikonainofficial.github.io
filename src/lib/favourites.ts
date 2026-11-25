/**
 * Ali's top fives, in his order. Images live in src/assets/favourites/<slug>.(jpg|png|webp);
 * a title without an image yet gets a lettered title card until one is added.
 *
 * `focus` is where the crop centres (CSS object-position) when a frame's shape
 * differs from the picture's, e.g. the tall #1 frame on a wide image.
 */

export interface Favourite {
  slug: string;
  title: string;
  focus?: string;
}

export const anime: readonly Favourite[] = [
  { slug: 'sword-art-online', title: 'Sword Art Online', focus: '50% 40%' },
  { slug: 'one-piece', title: 'One Piece' },
  { slug: 'berserk', title: 'Berserk' },
  { slug: 'gintama', title: 'Gintama', focus: '60% 50%' },
  { slug: 'death-note', title: 'Death Note' },
];

export const games: readonly Favourite[] = [
  { slug: 'god-of-war', title: 'God of War', focus: '45% 30%' },
  { slug: 'halo', title: 'Halo', focus: '50% 35%' },
  { slug: 'the-last-of-us', title: 'The Last of Us' },
  // The logo sits in the top corner, so crop from the bottom.
  { slug: 'need-for-speed-world', title: 'Need for Speed', focus: '50% 0%' },
  { slug: 'call-of-duty', title: 'Call of Duty', focus: '60% 35%' },
];
