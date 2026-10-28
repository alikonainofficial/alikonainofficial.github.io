# alikonainofficial.github.io

Ali Konain's portfolio: a late-night jazz club where a mentalist reads you before he introduces himself.

Live at **https://alikonainofficial.github.io**. In a hurry? The plain one-page résumé is at [/resume/](https://alikonainofficial.github.io/resume/).

## Tonight's program

Eight tricks are spread across the site, so no single page does all of them. A program card in the corner ticks off each one as the visitor sees it, and links to the ones they've missed.

| Act | Trick | Where |
| --- | --- | --- |
| I | The cold read | Top of the home page |
| II | The hover tell | The work cards, paid off on the case page you open |
| III | The engineer's trick (binary cards) | Home, after the work |
| IV | The vanishing card | Encore on a case page |
| V | Think of a number | Encore on a case page |
| VI | The 1089 | Encore on a case page |
| VII | The sealed prediction | Home, the finale |
| VIII | The secret word | Anywhere: type "abracadabra" or tap the avatar five times |

Each case page performs its own favourite encore first, then rotates to the ones the visitor hasn't seen. `#encore-vanish`, `#encore-number` and `#encore-eleven` on any case page ask for a specific one.

The site never explains a trick, on stage or after it. Nothing a visitor does is sent anywhere: there are no cookies, no analytics and no server.

Tailored links make the cold read sharper:

| Link | Effect |
| --- | --- |
| `/?for=ai` | AI-product tagline and a line about AI work |
| `/?for=fde` | Forward-deployed tagline and a line about working with users |
| `/?co=Acme` | Greets someone at Acme who opened the link from an application |

Combine them: `https://alikonainofficial.github.io/?for=ai&co=Acme`.

## Sound

Every visit starts in silence, because browsers don't allow sound before the visitor clicks something. Instead of pretending otherwise, the site asks:

- The host asks from a speech bubble beside his face: "You look like a jazz person. Shall I have the band play?", with **Play the jazz** and **Not now**, and a reassurance that it's soft and can be paused. Faces draw the eye, and a polite question gets more yeses than a button in a corner. A yes gets "I knew you'd say yes."
- The header's **Play the jazz** button carries the universal play symbol and is the only filled pill in the header, breathing a slow brass glow. "Skip the show" is an outline, so the two don't compete.
- While the band plays, the button shows moving equalizer bars and offers **Pause the jazz**. After a "Not now" or a pause, it settles into a quiet outline for the rest of the visit.
- With reduced motion, the glow becomes a steady ring and the bars stand still. The plain résumé gets just the button.

The music is a small generative lounge-jazz band written with the Web Audio API in `src/lib/audio.ts`: walking bass, brushes, a ride cymbal and electric-piano chords over a ii–V–I, swung at 92 BPM. Buttons get short synthesized sound effects. There are no audio files, and the band keeps playing between pages because the site uses Astro's client router.

## Links

Links that leave the site (LinkedIn, GitHub, the arcade games, project pages) open in a new tab, and say so to screen readers. Components use `NewTabLink`; links written in the case-file Markdown get the same treatment from a small Sätteri plugin in `src/lib/new-tab.ts`. Links within the site stay in the same tab, so the music and the program carry on.

## Stack

- [Astro](https://astro.build) 7, fully static, TypeScript in strict mode, `ClientRouter` for page transitions
- Case studies as Markdown in a typed content collection (`src/content/work`)
- Pixel art as data: the avatar (and its secret top hat) are character grids in `src/lib/sprite.ts`, rendered to SVG at build time
- Trick logic as pure, unit-tested functions: `src/lib/cold-read.ts`, `src/lib/tricks.ts`, `src/lib/acts.ts`
- Fonts: Fraunces and Figtree, self-hosted via Fontsource
- No cookies, no analytics, no third-party requests

## Run it

```bash
npm install
npm run dev      # http://localhost:4321
npm test         # unit tests for the tricks
npm run build    # type check, then build to dist/
```

## Deploy

`.github/workflows/deploy.yml` tests and builds every push and pull request, and deploys `master` to GitHub Pages. In the repository settings, Pages must use **GitHub Actions** as its source.

## Structure

```
src/
  components/   Stage, ColdRead, Work, EngineerTrick, Story, Arcade, Finale, Encore,
                ProgramWidget, SoundToggle, SiteScripts, header and footer
  content/work/ one Markdown case file per project
  lib/          profile data, sprites, audio, trick logic and tests
  pages/        home, résumé, case files, 404, favicon
```

The browser games in the Arcade live in their own repositories and keep their existing URLs.
