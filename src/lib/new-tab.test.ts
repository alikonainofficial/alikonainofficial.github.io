import { describe, expect, it } from 'vitest';
import { NEW_TAB_NOTE, newTabLinks, opensNewTab } from './new-tab';

describe('which links open a new tab', () => {
  it('sends links to other sites to a new tab', () => {
    expect(opensNewTab('https://github.com/alikonainofficial')).toBe(true);
    expect(opensNewTab('http://example.com')).toBe(true);
    expect(opensNewTab('https://alikonainofficial.github.io/Car_Racing/')).toBe(true);
  });

  it('keeps in-site links, anchors and email in the same tab', () => {
    expect(opensNewTab('/work/booktok/')).toBe(false);
    expect(opensNewTab('#engineer')).toBe(false);
    expect(opensNewTab('mailto:someone@example.com')).toBe(false);
    expect(opensNewTab(undefined)).toBe(false);
  });
});

describe('the Markdown plugin', () => {
  // A stand-in for the processor: just enough of its context to record what the plugin asks for.
  const run = (href: string) => {
    const props: Record<string, unknown> = {};
    const children: unknown[] = [];
    const ctx = {
      setProperty: (_node: unknown, key: string, value: unknown) => (props[key] = value),
      appendChild: (_node: unknown, child: unknown) => children.push(child),
    };
    const visitor = Array.isArray(newTabLinks.element) ? newTabLinks.element[0] : newTabLinks.element;
    visitor!.visit({ type: 'element', tagName: 'a', properties: { href }, children: [] }, ctx as never);
    return { props, children };
  };

  it('marks outbound case-file links', () => {
    const { props, children } = run('https://github.com/alikonainofficial/book-topics-assigner');
    expect(props).toEqual({ target: '_blank', rel: ['noopener'] });
    expect(JSON.stringify(children)).toContain(NEW_TAB_NOTE);
  });

  it('leaves in-site links alone', () => {
    expect(run('/resume/')).toEqual({ props: {}, children: [] });
  });
});
