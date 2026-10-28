import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Case files: one Markdown file per project, written in the dossier format. */
const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      company: z.string(),
      period: z.string(),
      role: z.string(),
      /** One line for the playing card. */
      card: z.string(),
      /** Two or three sentences for the card's detail panel. */
      summary: z.string(),
      objective: z.string(),
      deployed: z.string(),
      outcome: z.string(),
      stack: z.array(z.string()),
      cover: image(),
      coverAlt: z.string(),
      gallery: z.array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() })).default([]),
      links: z.array(z.object({ label: z.string(), href: z.url() })).default([]),
      /** The encore this case file performs first. */
      encore: z.enum(['vanish', 'number', 'eleven']),
      /** How the tricks refer to this project mid-sentence, e.g. "the AI ad pipeline". */
      label: z.string(),
    }),
});

export const collections = { work };
