# alikonainofficial.github.io

Ali Konain's portfolio: a 16-bit magic show that reads you before it introduces itself.

Live at **https://alikonainofficial.github.io**. In a hurry? The plain one-page résumé is at [/resume/](https://alikonainofficial.github.io/resume/).

## The trick

The page opens with a stage mentalist's cold read. It "guesses" where you came from, what time it is for you and what you're reading on, then admits how it knew. Everything comes from details any browser already shares with any page: local time, `document.referrer`, the pointer type and the link's query string. Nothing leaves the browser. The only thing stored is a visit counter in your own `localStorage`.

Tailored links make the read sharper:

| Link | Effect |
| --- | --- |
| `/?for=ai` | AI-product tagline and a line about AI work |
| `/?for=fde` | Forward-deployed tagline and a line about working with users |
| `/?co=Acme` | Greets someone at Acme who opened the link from an application |

Combine them: `https://alikonainofficial.github.io/?for=ai&co=Acme`.

## Stack

- [Astro](https://astro.build) 7, fully static, TypeScript in strict mode
- Case studies as Markdown in a typed content collection (`src/content/work`)
- Pixel art as data: the avatar is a character grid in `src/lib/sprite.ts`, rendered to SVG at build time. The favicon is cropped from the same grid.
- The cold read is a pure function in `src/lib/cold-read.ts`, unit-tested with Vitest
- Fonts: Jacquard 24 and Pixelify Sans, self-hosted via Fontsource
- No cookies, no analytics, no third-party requests

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm test         # cold-read unit tests
npm run build    # type check, then build to dist/
```

## Deploy

`.github/workflows/deploy.yml` tests and builds every push and pull request, and deploys `master` to GitHub Pages. In the repository settings, Pages must use **GitHub Actions** as its source.

## Structure

```
src/
  components/   Stage, ColdRead, CardDeck, Playbill, Arcade, header and footer
  content/work/ one Markdown case file per project
  lib/          profile data, sprite renderer, cold-read logic and tests
  pages/        home, résumé, case files, 404, favicon
```

The browser games in the Arcade live in their own repositories and keep their existing URLs.
