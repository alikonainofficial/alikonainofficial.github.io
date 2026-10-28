/**
 * Links that leave the portfolio open in a new tab, so the show (and the band)
 * keeps going in the original one. Links within the site stay in the same tab.
 */

import { defineHastPlugin } from 'satteri';

/** Read out after the link text, for people who can't see that a new tab opened. */
export const NEW_TAB_NOTE = ' (opens in a new tab)';

/** Anything with its own scheme and host. Site-relative paths, anchors and mailto: links are not. */
export function opensNewTab(href: unknown): boolean {
  return typeof href === 'string' && /^https?:\/\//i.test(href.trim());
}

/** Markdown plugin for Sätteri, Astro's Markdown processor: the same rule for links in the case files. */
export const newTabLinks = defineHastPlugin({
  name: 'new-tab-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      if (!opensNewTab(node.properties?.href)) return;
      ctx.setProperty(node, 'target', '_blank');
      ctx.setProperty(node, 'rel', ['noopener']);
      ctx.appendChild(node, {
        type: 'element',
        tagName: 'span',
        properties: { className: ['visually-hidden'] },
        children: [{ type: 'text', value: NEW_TAB_NOTE }],
      });
    },
  },
});
