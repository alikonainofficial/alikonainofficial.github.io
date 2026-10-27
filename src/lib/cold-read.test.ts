import { describe, expect, it } from 'vitest';
import { classifyReferrer, cleanCompany, coldRead, joinClauses, parseRole, type Signals } from './cold-read';

const base: Signals = {
  hour: 23,
  minute: 14,
  weekday: 2,
  referrer: '',
  search: '',
  touch: false,
  visits: 1,
  prefersDark: false,
};

describe('classifyReferrer', () => {
  it('recognises the usual suspects', () => {
    expect(classifyReferrer('https://www.linkedin.com/in/someone').kind).toBe('linkedin');
    expect(classifyReferrer('https://lnkd.in/abc').kind).toBe('linkedin');
    expect(classifyReferrer('https://github.com/alikonainofficial').kind).toBe('github');
    expect(classifyReferrer('https://www.google.com/').kind).toBe('search');
    expect(classifyReferrer('https://jobs.ashbyhq.com/acme/123').kind).toBe('jobs');
    expect(classifyReferrer('https://alikonainofficial.github.io/resume/').kind).toBe('self');
  });

  it('falls back to the host for anything else, and to none for junk', () => {
    expect(classifyReferrer('https://news.ycombinator.net/item')).toEqual({ kind: 'other', host: 'news.ycombinator.net' });
    expect(classifyReferrer('not a url').kind).toBe('none');
    expect(classifyReferrer('').kind).toBe('none');
  });
});

describe('parseRole and cleanCompany', () => {
  it('maps link tags to roles', () => {
    expect(parseRole('ai')).toBe('ai');
    expect(parseRole('FDE')).toBe('fde');
    expect(parseRole('anything')).toBe('fullstack');
    expect(parseRole(null)).toBe('fullstack');
  });

  it('strips markup and caps the length', () => {
    expect(cleanCompany('<script>alert(1)</script>trivago')).toBe('scriptalert1scripttrivago');
    expect(cleanCompany('  Odoo  ')).toBe('Odoo');
    expect(cleanCompany('x'.repeat(80))).toHaveLength(40);
    expect(cleanCompany('<>')).toBeNull();
  });
});

describe('joinClauses', () => {
  it('reads like a sentence', () => {
    expect(joinClauses(['a'])).toBe('a');
    expect(joinClauses(['a', 'b'])).toBe('a, and b');
    expect(joinClauses(['a', 'b', 'c'])).toBe('a, b, and c');
  });
});

describe('coldRead', () => {
  it('reads a late-night LinkedIn visit on a phone', () => {
    const r = coldRead({ ...base, referrer: 'https://www.linkedin.com/feed/', touch: true });
    expect(r.guess).toBe(
      "Let me guess. You came here from LinkedIn, it's getting late where you are, and you're reading this on your phone.",
    );
    expect(r.reveal).toContain('Your browser told me');
    expect(r.tells[0]).toBe('Your local time: 23:14 on a Tuesday.');
  });

  it('notices weekends and mornings', () => {
    const r = coldRead({ ...base, hour: 9, weekday: 6 });
    expect(r.guess).toContain("it's morning where you are, on a weekend no less");
  });

  it('greets a company from a tailored link and owns up to the trick', () => {
    const r = coldRead({ ...base, search: '?for=ai&co=trivago' });
    expect(r.role).toBe('ai');
    expect(r.company).toBe('trivago');
    expect(r.guess).toContain("You're at trivago, and you opened the link I sent with my application");
    expect(r.guess).toContain("you're hiring for AI work");
    expect(r.reveal).toContain('The link I sent you told me half of that');
    expect(r.tells).toContain('The link itself carries for=ai and co=trivago.');
  });

  it('welcomes repeat visitors when no role is set', () => {
    const r = coldRead({ ...base, visits: 3 });
    expect(r.guess).toContain('Welcome back');
    expect(r.tells.some((t) => t.includes('3 times'))).toBe(true);
  });

  it('only claims things the signals support', () => {
    const r = coldRead(base);
    expect(r.guess).not.toContain('phone');
    expect(r.guess).not.toContain('LinkedIn');
    expect(r.guess).toContain('my bet is a PDF or an email');
  });
});
