/**
 * The cold read.
 *
 * A stage mentalist "reads" a stranger from small, observable details, then
 * admits there was no magic involved. This module does the same with details a
 * browser already exposes to every page it opens: local time, the page that
 * linked here, the kind of screen, and the query string of the link itself.
 *
 * Everything is pure and runs on the client. Nothing is stored or sent anywhere,
 * apart from a visit counter that stays in the visitor's own localStorage.
 */

export type Role = 'fullstack' | 'ai' | 'fde';

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
  /** Visitor's local minute, 0–59. */
  minute: number;
  /** 0 is Sunday, as in Date#getDay. */
  weekday: number;
  /** document.referrer, or an empty string. */
  referrer: string;
  /** location.search of the current page. */
  search: string;
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
  /** The read itself: one or two sentences of confident guessing. */
  guess: string;
  /** The admission that follows every good trick. */
  reveal: string;
  /** Plain-language list of the details the read was built from. */
  tells: string[];
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

export const TAGLINES: Record<Role, string> = {
  fullstack: 'Senior full-stack engineer. I ship AI that holds up in production, and I automate the tedious parts at scale.',
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

function sourceClause(source: Source, company: string | null): string {
  if (company) return `You're at ${company}, and you opened the link I sent with my application`;
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
      return "You've already been poking around the site";
    case 'none':
      return 'You opened this from somewhere that leaves no trail, so my bet is a PDF or an email';
  }
}

function timeClause(hour: number, weekday: number): string {
  let when: string;
  if (hour < 5) when = "it's past midnight where you are";
  else if (hour < 8) when = "it's early morning where you are";
  else if (hour < 12) when = "it's morning where you are";
  else if (hour < 14) when = "it's around lunch where you are";
  else if (hour < 18) when = "it's mid-afternoon where you are";
  else if (hour < 22) when = "it's evening where you are";
  else when = "it's getting late where you are";
  const weekend = weekday === 0 || weekday === 6;
  return weekend ? `${when}, on a weekend no less` : when;
}

/** "a", "a and b", "a, b, and c" */
export function joinClauses(items: string[]): string {
  if (items.length <= 1) return items.join('');
  if (items.length === 2) return `${items[0]}, and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function extraSentence(role: Role, visits: number, prefersDark: boolean): string | null {
  if (role === 'ai') return "And you're hiring for AI work, which is most of what I've been building lately.";
  if (role === 'fde') return 'And you need someone who can sit with the people using the software and ship what they actually need.';
  if (visits > 1) return "And you've been here before. Welcome back.";
  if (prefersDark) return 'You also prefer dark mode. We have that in common.';
  return null;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function coldRead(signals: Signals): Reading {
  const params = new URLSearchParams(signals.search);
  const role = parseRole(params.get('for'));
  const company = cleanCompany(params.get('co'));
  const source = classifyReferrer(signals.referrer);
  const fromLink = company !== null || params.has('for');

  const clauses = [sourceClause(source, company), timeClause(signals.hour, signals.weekday)];
  if (signals.touch) clauses.push("you're reading this on your phone");

  const extra = extraSentence(role, signals.visits, signals.prefersDark);
  const guess = `Let me guess. ${joinClauses(clauses)}.${extra ? ` ${extra}` : ''}`;

  const reveal = fromLink
    ? "Relax, I'm not psychic. The link I sent you told me half of that, and your browser told me the rest. Noticing details is most of my job."
    : "Relax, I'm not psychic. Your browser told me. Noticing the small details is most of my job.";

  const day = DAYS[signals.weekday] ?? 'today';
  const tells = [
    `Your local time: ${pad(signals.hour)}:${pad(signals.minute)} on a ${day}.`,
    source.kind === 'none'
      ? 'No referring page, which usually means a PDF, an email or a bookmark.'
      : source.kind === 'self'
        ? 'You arrived from another page on this site.'
        : `The page that sent you: ${referrerHost(signals.referrer)}.`,
    signals.touch ? 'Your screen is a touch screen.' : 'You are using a mouse or trackpad.',
  ];
  if (fromLink) {
    const parts = [params.has('for') ? `for=${params.get('for')}` : null, company ? `co=${company}` : null].filter(Boolean);
    tells.push(`The link itself carries ${parts.join(' and ')}.`);
  }
  if (signals.visits > 1) tells.push(`This browser has visited ${signals.visits} times. That count stays on your device.`);
  if (signals.prefersDark) tells.push('Your system is set to dark mode.');

  return { role, company, tagline: TAGLINES[role], guess, reveal, tells };
}

function referrerHost(referrer: string): string {
  try {
    return new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/** What visitors without JavaScript (and search engines) see. */
export const FALLBACK_READING: Pick<Reading, 'guess' | 'reveal'> = {
  guess: "Let me guess. You're hiring, you're busy, and this isn't the first portfolio you've opened today.",
  reveal: "Relax, I'm not psychic. That one is true of almost everyone reading this. Turn on JavaScript and I'll do better.",
};
