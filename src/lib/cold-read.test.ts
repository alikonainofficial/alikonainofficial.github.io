import { describe, expect, it } from 'vitest';
import {
  countryName,
  classifyReferrer,
  cleanCompany,
  coldRead,
  joinClauses,
  parseOS,
  parseRole,
  placeFromTimeZone,
  type Signals,
} from './cold-read';

const base: Signals = {
  hour: 19,
  weekday: 2,
  timeZone: 'Europe/Amsterdam',
  referrer: '',
  search: '',
  os: null,
  language: 'en-US',
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
    expect(classifyReferrer('https://news.example.net/item')).toEqual({ kind: 'other', host: 'news.example.net' });
    expect(classifyReferrer('not a url').kind).toBe('none');
    expect(classifyReferrer('').kind).toBe('none');
  });
});

describe('small readers', () => {
  it('maps link tags to roles', () => {
    expect(parseRole('ai')).toBe('ai');
    expect(parseRole('FDE')).toBe('fde');
    expect(parseRole('anything')).toBe('fullstack');
    expect(parseRole(null)).toBe('fullstack');
  });

  it('strips markup from company names and caps the length', () => {
    expect(cleanCompany('<script>alert(1)</script>trivago')).toBe('scriptalert1scripttrivago');
    expect(cleanCompany('  Odoo  ')).toBe('Odoo');
    expect(cleanCompany('x'.repeat(80))).toHaveLength(40);
    expect(cleanCompany('<>')).toBeNull();
  });

  it('turns time zones into countries', () => {
    expect(placeFromTimeZone('Europe/Amsterdam')).toBe('the Netherlands');
    expect(placeFromTimeZone('Asia/Karachi')).toBe('Pakistan');
    expect(placeFromTimeZone('America/Argentina/Buenos_Aires')).toBe('Argentina');
    expect(placeFromTimeZone('UTC')).toBeNull();
    expect(placeFromTimeZone('Etc/GMT+5')).toBeNull();
    expect(placeFromTimeZone('Not/A_Zone')).toBeNull();
  });

  it('knows the old names some browsers still report', () => {
    expect(placeFromTimeZone('Asia/Calcutta')).toBe('India');
    expect(placeFromTimeZone('Europe/Kiev')).toBe('Ukraine');
    expect(placeFromTimeZone('US/Eastern')).toBe('the United States');
  });

  it('names the state only where one zone covers exactly one', () => {
    expect(placeFromTimeZone('America/Phoenix')).toBe('Arizona');
    expect(placeFromTimeZone('Australia/Brisbane')).toBe('Queensland');
    expect(placeFromTimeZone('America/New_York')).toBe('the United States');
    expect(placeFromTimeZone('Australia/Sydney')).toBe('Australia');
  });

  it('names countries the way a sentence wants them', () => {
    expect(countryName('GB')).toBe('the United Kingdom');
    expect(countryName('KY')).toBe('the Cayman Islands');
    expect(countryName('TT')).toBe('Trinidad and Tobago');
    expect(countryName('HK')).toBe('Hong Kong');
    expect(countryName('DE')).toBe('Germany');
  });

  it('reads the operating system from the user agent', () => {
    expect(parseOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit')).toBe('mac');
    expect(parseOS('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('iphone');
    expect(parseOS('Mozilla/5.0 (Linux; Android 15; Pixel 9)')).toBe('android');
    expect(parseOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows');
    expect(parseOS('', 'Linux')).toBe('linux');
    expect(parseOS('something else')).toBeNull();
  });

  it('joins clauses like a sentence', () => {
    expect(joinClauses(['a'])).toBe('a');
    expect(joinClauses(['a', 'b'])).toBe('a, and b');
    expect(joinClauses(['a', 'b', 'c'])).toBe('a, b, and c');
  });
});

describe('coldRead', () => {
  it('reads an evening LinkedIn visit on a Mac in dark mode', () => {
    const r = coldRead({ ...base, referrer: 'https://www.linkedin.com/feed/', os: 'mac', prefersDark: true });
    expect(r.guess).toBe(
      "Let me guess. You're somewhere in the Netherlands, and it's evening. You came here from LinkedIn, and you're on a Mac with dark mode on.",
    );
    expect(r.aside).toBe("Don't look so surprised. That was only the warm-up.");
  });

  it('notices weekends and falls back when the time zone is not a place', () => {
    const r = coldRead({ ...base, hour: 9, weekday: 6, timeZone: 'UTC' });
    expect(r.guess).toContain("It's mid-morning on a Saturday where you are.");
  });

  it('greets a company from a tailored link', () => {
    const r = coldRead({ ...base, search: '?for=ai&co=trivago', os: 'windows' });
    expect(r.role).toBe('ai');
    expect(r.company).toBe('trivago');
    expect(r.guess).toContain("You're at trivago, and you opened the link I sent with my application.");
    expect(r.guess).toContain("You're on a Windows machine.");
    expect(r.guess).toContain("you're hiring for AI work");
  });

  it('notices a first language other than English', () => {
    const r = coldRead({ ...base, language: 'de-DE' });
    expect(r.guess).toContain('you usually read in German');
  });

  it('welcomes repeat visitors', () => {
    const r = coldRead({ ...base, visits: 3 });
    expect(r.guess).toContain('Welcome back');
  });

  it('only claims what the signals support', () => {
    const r = coldRead(base);
    expect(r.guess).not.toMatch(/phone|Mac|Windows|LinkedIn|dark mode/);
    expect(r.guess).toContain('my bet is a PDF or an email');
  });

  it('never gives the method away', () => {
    for (const r of [coldRead(base), coldRead({ ...base, search: '?co=Acme', language: 'de-DE' }), coldRead({ ...base, referrer: 'https://www.linkedin.com/' })]) {
      expect(`${r.guess} ${r.aside}`).not.toMatch(/browser|psychic|told me/i);
    }
  });
});
