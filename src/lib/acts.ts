/**
 * The show's program: every trick on the site, where it lives, and which ones
 * this visitor has already seen. "Seen" lives in the visitor's own
 * localStorage, so the program can nudge them towards the acts they missed.
 */

export type ActId = 'cold-read' | 'hover-tell' | 'engineer' | 'vanish' | 'number' | 'eleven' | 'prediction' | 'secret';

export interface Act {
  id: ActId;
  numeral: string;
  name: string;
  where: string;
  /** Where to send someone who wants to see it. Encores use a hash the case page understands. */
  href?: string;
}

export const ACTS: readonly Act[] = [
  { id: 'cold-read', numeral: 'I', name: 'The cold read', where: 'Opening act, top of the home page', href: '/#top' },
  { id: 'hover-tell', numeral: 'II', name: 'The hover tell', where: 'While you look through the work', href: '/#work' },
  { id: 'engineer', numeral: 'III', name: "The engineer's trick", where: 'Right after the work', href: '/#engineer' },
  { id: 'vanish', numeral: 'IV', name: 'The vanishing card', where: 'Encore on a case file', href: '/work/ai-ad-pipeline/#encore-vanish' },
  { id: 'number', numeral: 'V', name: 'Think of a number', where: 'Encore on a case file', href: '/work/books-pipeline/#encore-number' },
  { id: 'eleven', numeral: 'VI', name: 'The 1089', where: 'Encore on a case file', href: '/work/booktok/#encore-eleven' },
  { id: 'prediction', numeral: 'VII', name: 'The sealed prediction', where: 'Finale, bottom of the home page', href: '/#finale' },
  { id: 'secret', numeral: 'VIII', name: 'The secret word', where: 'Anywhere. Type the magic word, or tap me five times.' },
];

export const ENCORES = ['vanish', 'number', 'eleven'] as const;
export type EncoreId = (typeof ENCORES)[number];

const KEY = 'acts-seen';

export function readSeen(storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): Set<ActId> {
  try {
    const raw = storage?.getItem(KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(ids) ? (ids.filter((id) => ACTS.some((a) => a.id === id)) as ActId[]) : []);
  } catch {
    return new Set();
  }
}

/** Mark an act as seen, persist it, and tell the rest of the page (the program badge listens). */
export function markSeen(id: ActId): void {
  const seen = readSeen();
  if (seen.has(id)) return;
  seen.add(id);
  try {
    safeStorage()?.setItem(KEY, JSON.stringify([...seen]));
  } catch {
    /* storage blocked: the program simply won't remember */
  }
  if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('act:seen', { detail: id }));
}

/**
 * Which encore a case page should perform: an explicit #encore-<id> wins, then
 * the page's own favourite if unseen, then any unseen one, then the favourite.
 */
export function pickEncore(hash: string, favourite: EncoreId, seen: ReadonlySet<ActId>): EncoreId {
  const asked = hash.replace(/^#encore-/, '');
  if ((ENCORES as readonly string[]).includes(asked) && hash.startsWith('#encore-')) return asked as EncoreId;
  if (!seen.has(favourite)) return favourite;
  return ENCORES.find((e) => !seen.has(e)) ?? favourite;
}

function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}
