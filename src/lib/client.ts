/** Small browser helpers shared by the tricks. Client-only. */

import { sfx, type Sfx } from './audio';

let toastTimer: number | undefined;

/** Announce something briefly, visually and to screen readers. */
export function toast(text: string, sound: Sfx | null = 'chime'): void {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = text;
  document.body.append(el);
  if (sound) sfx(sound);
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.remove(), 5200);
}

export function session<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveSession(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked */
  }
}

/** When this visit started, kept for the whole browsing session. */
export function arrivedAt(): number {
  const existing = session<number | null>('arrived', null);
  if (existing) return existing;
  const now = Date.now();
  saveSession('arrived', now);
  return now;
}

/**
 * Time how long each [data-dwell] element stays mostly on screen, summed per
 * label across the session. The sealed prediction reads this at the finale.
 */
let observer: IntersectionObserver | null = null;
const visibleSince = new Map<Element, number>();

function flush(el: Element) {
  const since = visibleSince.get(el);
  const label = (el as HTMLElement).dataset.dwell;
  if (since === undefined || !label) return;
  const tally = session<Record<string, number>>('dwell', {});
  tally[label] = (tally[label] ?? 0) + (performance.now() - since);
  saveSession('dwell', tally);
  visibleSince.set(el, performance.now());
}

/** "On screen" means half of it is showing, or it fills half the screen (for sections taller than the window). */
function onScreen(e: IntersectionObserverEntry): boolean {
  return e.isIntersecting && (e.intersectionRatio >= 0.5 || e.intersectionRect.height >= window.innerHeight * 0.5);
}

let pausedForHiddenTab = false;

export function trackDwell(): void {
  observer?.disconnect();
  for (const el of visibleSince.keys()) flush(el);
  visibleSince.clear();
  if (!('IntersectionObserver' in window)) return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const tracked = visibleSince.has(e.target);
        if (onScreen(e) && !tracked) visibleSince.set(e.target, performance.now());
        else if (!onScreen(e) && tracked) {
          flush(e.target);
          visibleSince.delete(e.target);
        }
      }
    },
    { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] },
  );
  document.querySelectorAll('[data-dwell]').forEach((el) => observer!.observe(el));

  // A tab in the background isn't being read: stop the clock until it comes back.
  if (!pausedForHiddenTab) {
    pausedForHiddenTab = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        for (const el of visibleSince.keys()) flush(el);
        observer?.disconnect();
        visibleSince.clear();
      } else trackDwell();
    });
  }
}

/** Time banked so far for one label. */
export function dwellFor(label: string): number {
  return bankDwell()[label] ?? 0;
}

/** Bank the time on screen so far, without stopping the clock. */
export function bankDwell(): Record<string, number> {
  for (const el of visibleSince.keys()) flush(el);
  return session<Record<string, number>>('dwell', {});
}
