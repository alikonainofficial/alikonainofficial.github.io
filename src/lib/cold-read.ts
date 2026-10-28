/**
 * The cold read.
 *
 * A stage mentalist "reads" a stranger from small, observable details. This
 * module does the same with details a browser already shares with every page it
 * opens: the clock's time zone and local time, the page that linked here, the
 * operating system, the language, the colour scheme, and the link's query string.
 * The page never says how it knows: a good mentalist doesn't explain.
 *
 * Everything is pure and runs on the client. Nothing is stored or sent anywhere,
 * apart from a visit counter that stays in the visitor's own localStorage.
 */

export type Role = 'fullstack' | 'ai' | 'fde';
export type OS = 'mac' | 'windows' | 'iphone' | 'ipad' | 'android' | 'linux' | 'chromeos';

export type Source =
  | { kind: 'none' }
  | { kind: 'self' }
  | { kind: 'linkedin' }
  | { kind: 'github' }
  | { kind: 'search' }
  | { kind: 'jobs'; host: string }
  | { kind: 'other'; host: string };

export interface Signals {
  /** Visitor's local hour, 0–23. */
  hour: number;
  /** 0 is Sunday, as in Date#getDay. */
  weekday: number;
  /** IANA time zone, e.g. "Europe/Amsterdam". Empty when unknown. */
  timeZone: string;
  /** document.referrer, or an empty string. */
  referrer: string;
  /** location.search of the current page. */
  search: string;
  /** From parseOS(); null when unknown. */
  os: OS | null;
  /** navigator.language, e.g. "en-GB". */
  language: string;
  /** True when the primary pointer is coarse (a phone or tablet). */
  touch: boolean;
  /** Visits from this browser, including this one. */
  visits: number;
  prefersDark: boolean;
}

export interface Reading {
  role: Role;
  company: string | null;
  tagline: string;
  /** The read itself: a couple of sentences of confident guessing. */
  guess: string;
  /** The line that follows the read. It never explains how. */
  aside: string;
}

const SITE_HOST = 'alikonainofficial.github.io';

const SEARCH_HOSTS = ['google.', 'bing.com', 'duckduckgo.com', 'search.yahoo.', 'ecosia.org', 'kagi.com', 'search.brave.com', 'yandex.'];

const JOB_HOSTS = [
  'greenhouse.io',
  'lever.co',
  'ashbyhq.com',
  'workable.com',
  'wellfound.com',
  'indeed.',
  'glassdoor.',
  'myworkdayjobs.com',
  'smartrecruiters.com',
  'teamtailor.com',
  'recruitee.com',
  'personio.',
  'bamboohr.com',
  'workatastartup.com',
  'ycombinator.com',
  'welcometothejungle.com',
  'otta.com',
  'jobvite.com',
  'icims.com',
  'breezy.hr',
  'rozee.pk',
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const DEVICE: Record<OS, string> = {
  mac: 'a Mac',
  windows: 'a Windows machine',
  iphone: 'an iPhone',
  ipad: 'an iPad',
  android: 'an Android phone',
  linux: 'a Linux machine',
  chromeos: 'a Chromebook',
};

export const TAGLINES: Record<Role, string> = {
  fullstack: 'Senior full-stack engineer in Lahore. I ship AI that holds up in production and automate the tedious parts at scale.',
  ai: 'Senior full-stack engineer building AI products: the generation pipelines, the quality checks, and the app around them.',
  fde: 'Senior full-stack engineer who works next to the people using the software and turns messy workflows into tools that run.',
};

export function parseRole(value: string | null | undefined): Role {
  const v = (value ?? '').trim().toLowerCase();
  if (['ai', 'applied-ai', 'ai-product', 'ml'].includes(v)) return 'ai';
  if (['fde', 'forward-deployed', 'solutions', 'customer'].includes(v)) return 'fde';
  return 'fullstack';
}

/** Keep a company name readable and harmless: letters, digits and a little punctuation, 40 characters at most. */
export function cleanCompany(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(/[^\p{L}\p{N} .&'’-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** "Europe/Amsterdam" becomes "Amsterdam"; zones that aren't places (UTC, Etc/GMT+5) give null. */
export function cityFromTimeZone(tz: string): string | null {
  if (!tz || !tz.includes('/') || tz.startsWith('Etc/')) return null;
  const last = tz.split('/').pop() ?? '';
  const city = last.replace(/_/g, ' ').trim();
  return city.length > 0 ? city : null;
}

/** Best-effort OS from the user agent (and the newer platform hint when the browser offers it). */
export function parseOS(userAgent: string, platformHint = ''): OS | null {
  const ua = userAgent.toLowerCase();
  const hint = platformHint.toLowerCase();
  if (ua.includes('iphone')) return 'iphone';
  if (ua.includes('ipad')) return 'ipad';
  if (ua.includes('android')) return 'android';
  if (ua.includes('cros') || hint === 'chrome os' || hint === 'chromeos') return 'chromeos';
  if (hint === 'macos' || ua.includes('mac os x') || ua.includes('macintosh')) return 'mac';
  if (hint === 'windows' || ua.includes('windows')) return 'windows';
  if (hint === 'linux' || ua.includes('linux')) return 'linux';
  return null;
}

/** "en-NL" becomes "English (Netherlands)", where the browser can name it. */
export function languageName(tag: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(tag) ?? tag;
  } catch {
    return tag;
  }
}

export function classifyReferrer(referrer: string): Source {
  if (!referrer) return { kind: 'none' };
  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return { kind: 'none' };
  }
  if (host === SITE_HOST) return { kind: 'self' };
  if (host.endsWith('linkedin.com') || host === 'lnkd.in') return { kind: 'linkedin' };
  if (host === 'github.com' || host.endsWith('.github.com')) return { kind: 'github' };
  if (SEARCH_HOSTS.some((h) => host.includes(h))) return { kind: 'search' };
  if (JOB_HOSTS.some((h) => host.includes(h))) return { kind: 'jobs', host };
  return { kind: 'other', host };
}

function sourceClause(source: Source): string {
  switch (source.kind) {
    case 'linkedin':
      return 'You came here from LinkedIn';
    case 'github':
      return "You came from my GitHub, so you've already seen the code";
    case 'search':
      return 'You found me through a search';
    case 'jobs':
      return 'You clicked through from a job application';
    case 'other':
      return `You came over from ${source.host}`;
    case 'self':
      return "You've already been looking around";
    case 'none':
      return 'Nobody linked you here, so my bet is a PDF or an email';
  }
}

function timeOfDay(hour: number): string {
  if (hour === 0) return 'just after midnight';
  if (hour < 5) return 'the middle of the night';
  if (hour < 8) return 'early morning';
  if (hour < 12) return 'mid-morning';
  if (hour < 14) return 'around lunchtime';
  if (hour < 18) return 'the afternoon';
  if (hour < 22) return 'evening';
  return 'late evening';
}

/** "a", "a and b", "a, b, and c" */
export function joinClauses(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]}, and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function coldRead(signals: Signals): Reading {
  const params = new URLSearchParams(signals.search);
  const role = parseRole(params.get('for'));
  const company = cleanCompany(params.get('co'));
  const source = classifyReferrer(signals.referrer);
  const city = cityFromTimeZone(signals.timeZone);
  const weekend = signals.weekday === 0 || signals.weekday === 6;
  const day = DAYS[signals.weekday] ?? 'today';

  const sentences: string[] = [];

  // Where and when.
  const when = `it's ${timeOfDay(signals.hour)}${weekend ? ` on a ${day}` : ''}`;
  const place = city ? `You're in ${city}, or somewhere on ${city} time, and ${when}` : `${cap(when)} where you are`;

  if (company) {
    sentences.push(`You're at ${company}, and you opened the link I sent with my application`);
    sentences.push(place);
  } else {
    sentences.push(place);
  }

  // How they got here and what they're holding.
  const device = signals.os ? DEVICE[signals.os] : signals.touch ? 'your phone' : null;
  const holding = device ? `you're on ${device}${signals.prefersDark ? ' with dark mode on' : ''}` : null;
  if (!company) sentences.push(holding ? joinClauses([sourceClause(source), holding]) : sourceClause(source));
  else if (holding) sentences.push(cap(holding));

  // One extra detail, if there's a good one.
  const lang = signals.language.toLowerCase();
  let extra: string | null = null;
  if (role === 'ai') extra = "And you're hiring for AI work, which is most of what I've been building lately.";
  else if (role === 'fde') extra = 'And you need someone who can sit with the people using the software and ship what they actually need.';
  else if (signals.visits > 1) extra = "And you've been here before. Welcome back.";
  else if (lang && !lang.startsWith('en')) extra = `And you usually read in ${languageName(signals.language.split('-')[0] ?? signals.language)}, so thank you for reading this in English.`;

  const guess = `Let me guess. ${sentences.map((s) => `${s}.`).join(' ')}${extra ? ` ${extra}` : ''}`;

  return { role, company, tagline: TAGLINES[role], guess, aside: ASIDE };
}

const ASIDE = "Don't look so surprised. That was only the warm-up.";

/** What visitors without JavaScript (and search engines) see. */
export const FALLBACK_READING: Pick<Reading, 'guess' | 'aside'> = {
  guess: "Let me guess. You're hiring, you're busy, and this isn't the first portfolio you've opened today.",
  aside: "Close? Turn on JavaScript and I'll tell you a great deal more.",
};
