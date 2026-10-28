/**
 * The house band and the sound effects, synthesised live with the Web Audio API.
 *
 * Nothing is downloaded: the lounge-jazz loop (walking bass, electric-piano
 * comping, brushes and a ride cymbal over a ii-V-I progression) and every click,
 * card flip and chime are generated in the browser. Sound stays off until the
 * visitor turns it on, and that choice is remembered on their device.
 */

export type Sfx = 'click' | 'tick' | 'flip' | 'chime' | 'reveal' | 'whoosh';

const PREF = 'sound';
const BPM = 92;
const BEAT = 60 / BPM;
const SWING = 0.64; // where the off-beat eighth lands inside each beat

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

/** Eight bars in C: Dm9 G13 Cmaj9 A7b9 | Dm9 G13 Em7-A7 Dm9-G13. Rootless voicings for the piano. */
const BARS: { root: number; voicing: number[]; next?: { root: number; voicing: number[] } }[] = [
  { root: 38, voicing: [53, 57, 60, 64] },
  { root: 43, voicing: [53, 59, 64, 69] },
  { root: 36, voicing: [52, 55, 59, 62] },
  { root: 45, voicing: [55, 61, 64, 70] },
  { root: 38, voicing: [53, 57, 60, 64] },
  { root: 43, voicing: [53, 59, 64, 69] },
  { root: 40, voicing: [55, 59, 62, 66], next: { root: 45, voicing: [55, 61, 64, 70] } },
  { root: 38, voicing: [53, 57, 60, 64], next: { root: 43, voicing: [53, 59, 64, 69] } },
];

/** C major scale tones in the right hand's range, for the occasional melodic fill. */
const MELODY = [72, 74, 76, 77, 79, 81, 83, 84];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let fxBus: GainNode | null = null;
let noise: AudioBuffer | null = null;
let timer: number | null = null;
let nextBeatTime = 0;
let beatIndex = 0;
let on = false;
let rng = 1;
let cancelResume: (() => void) | null = null;

function random(): number {
  // Small deterministic generator so the band never plays exactly the same loop twice in a row.
  rng = (rng * 16807) % 2147483647;
  return (rng - 1) / 2147483646;
}

export function soundPreferred(): boolean {
  try {
    return localStorage.getItem(PREF) === 'on';
  } catch {
    return false;
  }
}

export function isSoundOn(): boolean {
  return on;
}

function ensureContext(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(comp).connect(ctx.destination);

  // A short, dark room reverb built from decaying noise.
  const verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 1.6);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const data = ir.getChannelData(ch);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  verb.buffer = ir;
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  verb.connect(wet).connect(master);

  musicBus = ctx.createGain();
  musicBus.gain.value = 0;
  musicBus.connect(master);
  musicBus.connect(verb);

  fxBus = ctx.createGain();
  fxBus.gain.value = 0.8;
  fxBus.connect(master);

  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const n = noise.getChannelData(0);
  for (let i = 0; i < n.length; i += 1) n[i] = Math.random() * 2 - 1;

  rng = Math.floor(Math.random() * 1e6) + 1;
  return ctx;
}

/* ---------------- instruments ---------------- */

function bass(note: number, t: number) {
  if (!ctx || !musicBus) return;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = midi(note);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 520;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.55, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + BEAT * 0.95);
  osc.connect(lp).connect(g).connect(musicBus);
  osc.start(t);
  osc.stop(t + BEAT);
}

function keys(notes: number[], t: number, length: number, velocity = 0.07) {
  if (!ctx || !musicBus) return;
  for (const n of notes) {
    const f = midi(n);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(velocity, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length);
    // Electric-piano flavour: a sine with a soft bell partial on top.
    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.value = f;
    const bell = ctx.createOscillator();
    bell.type = 'sine';
    bell.frequency.value = f * 2.01;
    const bellGain = ctx.createGain();
    bellGain.gain.setValueAtTime(0.35, t);
    bellGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    body.connect(g);
    bell.connect(bellGain).connect(g);
    g.connect(musicBus);
    body.start(t);
    bell.start(t);
    body.stop(t + length + 0.05);
    bell.stop(t + length + 0.05);
  }
}

function noiseHit(t: number, opts: { type: BiquadFilterType; freq: number; q?: number; gain: number; attack: number; decay: number; bus?: GainNode | null }) {
  if (!ctx || !noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = opts.type;
  f.frequency.value = opts.freq;
  f.Q.value = opts.q ?? 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(opts.gain, t + opts.attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.attack + opts.decay);
  src.connect(f).connect(g).connect(opts.bus ?? musicBus!);
  src.start(t, Math.random() * 0.5);
  src.stop(t + opts.attack + opts.decay + 0.05);
}

/* ---------------- the band ---------------- */

function playBeat(t: number, index: number) {
  const barNo = Math.floor(index / 4) % BARS.length;
  const beat = index % 4;
  const bar = BARS[barNo]!;
  const chord = beat >= 2 && bar.next ? bar.next : bar;
  const next = BARS[(barNo + 1) % BARS.length]!;
  const offbeat = t + BEAT * SWING;

  // Walking bass: root, third or fifth, fifth, then a chromatic approach to the next root.
  const thirds = [3, 4];
  const walk = [chord.root, chord.root + thirds[Math.floor(random() * 2)]!, chord.root + 7, next.root + (random() < 0.5 ? -1 : 1)];
  bass(walk[beat]!, t);

  // Brushes on every beat, a firmer slap on 2 and 4.
  noiseHit(t, { type: 'bandpass', freq: 2400, gain: beat % 2 ? 0.05 : 0.025, attack: 0.03, decay: 0.12 });

  // Ride cymbal: ding, ding-a ding.
  noiseHit(t, { type: 'highpass', freq: 7000, gain: 0.03, attack: 0.002, decay: 0.28 });
  if (beat % 2 === 1) noiseHit(offbeat, { type: 'highpass', freq: 7000, gain: 0.018, attack: 0.002, decay: 0.18 });

  // Charleston comping: on 1 and on the off-beat of 2, with the odd variation.
  if (beat === 0 && random() < 0.85) keys(chord.voicing, t, BEAT * 1.2);
  if (beat === 1 && random() < 0.75) keys(chord.voicing, offbeat, BEAT * 0.8, 0.06);
  if (beat === 3 && random() < 0.3) keys(chord.voicing, offbeat, BEAT * 0.6, 0.05);

  // Now and then, a short right-hand phrase.
  if (beat === 2 && random() < 0.35) {
    const start = Math.floor(random() * (MELODY.length - 3));
    for (let i = 0; i < 3; i += 1) keys([MELODY[start + (random() < 0.5 ? i : 2 - i)]!], t + i * BEAT * (i === 1 ? SWING : 0.5), BEAT * 0.45, 0.05);
  }
}

function schedule() {
  if (!ctx) return;
  while (nextBeatTime < ctx.currentTime + 0.25) {
    playBeat(nextBeatTime, beatIndex);
    nextBeatTime += BEAT;
    beatIndex += 1;
  }
}

/* ---------------- public controls ---------------- */

export async function setSound(enabled: boolean): Promise<void> {
  cancelResume?.();
  cancelResume = null;
  on = enabled;
  try {
    localStorage.setItem(PREF, enabled ? 'on' : 'off');
  } catch {
    /* fine: it just won't be remembered */
  }
  document.dispatchEvent(new CustomEvent('sound:change', { detail: enabled }));

  if (!enabled) {
    if (ctx && musicBus) musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
    // Once the last note has faded, let the audio hardware rest.
    window.setTimeout(() => {
      if (!on && ctx?.state === 'running') void ctx.suspend();
    }, 2000);
    return;
  }

  const c = ensureContext();
  if (!c || !musicBus) return;
  if (c.state === 'suspended') await c.resume();
  musicBus.gain.cancelScheduledValues(c.currentTime);
  musicBus.gain.setTargetAtTime(0.32, c.currentTime, 0.6);
  if (timer === null) {
    nextBeatTime = c.currentTime + 0.1;
    beatIndex = 0;
    timer = window.setInterval(schedule, 40);
  }
}

export function sfx(name: Sfx): void {
  if (!on || !ctx || !fxBus) return;
  const t = ctx.currentTime + 0.005;
  const tone = (freq: number, at: number, length: number, gain: number, type: OscillatorType = 'sine', endFreq?: number) => {
    const o = ctx!.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, at + length);
    const g = ctx!.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + length);
    o.connect(g).connect(fxBus!);
    o.start(at);
    o.stop(at + length + 0.02);
  };

  switch (name) {
    case 'click':
      tone(740, t, 0.08, 0.12, 'sine', 420);
      break;
    case 'tick':
      noiseHit(t, { type: 'highpass', freq: 3200, gain: 0.05, attack: 0.001, decay: 0.02, bus: fxBus });
      break;
    case 'flip':
      noiseHit(t, { type: 'bandpass', freq: 1800, q: 1.2, gain: 0.22, attack: 0.01, decay: 0.09, bus: fxBus });
      break;
    case 'whoosh':
      noiseHit(t, { type: 'lowpass', freq: 1400, gain: 0.18, attack: 0.18, decay: 0.3, bus: fxBus });
      break;
    case 'chime':
      tone(1318.5, t, 1.2, 0.08);
      tone(1975.5, t + 0.04, 1.0, 0.05);
      tone(659.3, t, 1.3, 0.04);
      break;
    case 'reveal':
      [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(f, t + i * 0.07, 0.5, 0.08, 'triangle'));
      break;
  }
}

/**
 * Called once per full page load. If the visitor turned sound on last time,
 * the band starts again on their first click or key press (browsers require one).
 */
export function resumeIfPreferred(): void {
  if (!soundPreferred() || on) return;
  const start = (e: Event) => {
    // The sound button handles its own clicks; starting here too would switch it straight back off.
    if (e.target instanceof Element && e.target.closest('[data-sound-toggle]')) return;
    void setSound(true);
  };
  window.addEventListener('pointerdown', start);
  window.addEventListener('keydown', start);
  cancelResume = () => {
    window.removeEventListener('pointerdown', start);
    window.removeEventListener('keydown', start);
  };
}
