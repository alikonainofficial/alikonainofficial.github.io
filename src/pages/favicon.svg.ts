import type { APIRoute } from 'astro';
import { ali, spriteSvg } from '../lib/sprite';

/** The favicon is Ali's head, cropped straight from the same sprite data as the page. */
export const GET: APIRoute = () =>
  new Response(spriteSvg(ali, '1 0 18 18'), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
