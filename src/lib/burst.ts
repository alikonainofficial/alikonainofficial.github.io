/**
 * A burst of pixel playing cards, for the two biggest moments of the show:
 * opening the sealed prediction and the curtain call. Drawn on a throwaway
 * canvas that removes itself, and skipped entirely under reduced motion.
 */

interface Card {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  phase: number;
  edge: string;
  pip: string;
}

const LIFETIME = 1700;
const FADE = 450;
const GRAVITY = 1500; // px per second squared

/** Positions and velocities for n cards leaving a point, spread upward in a fan. Pure, so it can be tested. */
export function launch(n: number, origin: { x: number; y: number }, random: () => number = Math.random): Omit<Card, 'edge' | 'pip'>[] {
  return Array.from({ length: n }, () => {
    const angle = -Math.PI / 2 + (random() - 0.5) * 1.9;
    const speed = 520 + random() * 520;
    return {
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: 6 + random() * 10,
      phase: random() * Math.PI * 2,
    };
  });
}

export function cardBurst(origin: { x: number; y: number }, count = 42): void {
  if (typeof window === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const css = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  const edges = [read('--brass', '#e2bb6e'), read('--marquee', '#ff7a59'), '#5fe0d4', '#f08cc8'];
  const face = read('--card', '#f3efe6');
  const pips = [read('--card-red', '#b0423a'), read('--card-ink', '#1d1d1f')];

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', zIndex: '80', pointerEvents: 'none' });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(innerWidth * dpr);
  canvas.height = Math.round(innerHeight * dpr);
  document.body.append(canvas);
  const g = canvas.getContext('2d');
  if (!g) {
    canvas.remove();
    return;
  }
  g.imageSmoothingEnabled = false;

  const cards: Card[] = launch(count, origin).map((c, i) => ({ ...c, edge: edges[i % edges.length]!, pip: pips[i % 2]! }));
  const start = performance.now();
  let last = start;
  // One "pixel" of the card art, in CSS pixels.
  const px = 3;

  const frame = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const age = now - start;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, innerWidth, innerHeight);
    g.globalAlpha = age > LIFETIME - FADE ? Math.max(0, (LIFETIME - age) / FADE) : 1;

    for (const c of cards) {
      c.vy += GRAVITY * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      // Cards turn over as they fly: draw them narrower as they flip, snapped to whole pixels.
      const turn = Math.abs(Math.cos(c.phase + (age / 1000) * c.spin));
      const w = Math.max(1, Math.round(4 * turn)) * px;
      const h = 6 * px;
      const x = Math.round(c.x - w / 2);
      const y = Math.round(c.y - h / 2);
      g.fillStyle = c.edge;
      g.fillRect(x, y, w, h);
      if (w > 2 * px) {
        g.fillStyle = face;
        g.fillRect(x + px, y + px, w - 2 * px, h - 2 * px);
        g.fillStyle = c.pip;
        g.fillRect(x + Math.floor(w / 2 / px) * px - px / 2, y + 2 * px, px, 2 * px);
      }
    }

    if (age < LIFETIME) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}
