---
title: AI ad pipeline
order: 1
company: Speechify
period: Ongoing
role: Led it from the first experiments to production
card: From one brief to campaign-ready ads.
summary: Speechify's marketing team was making AI ads by hand, at roughly four hours each. I led the move from manual prompting to an internal app with 21 ad-format pipelines that can produce up to 15 ads in ten minutes.
objective: Get campaign-ready video and image ads out of a brief without someone hand-assembling every clip.
deployed: LLMs plus image, video, voice and music generation APIs, orchestrated by a FastAPI backend with 20 parallel workers and a Next.js frontend.
outcome: About 10,000 ads generated so far, with peak days near 1,000, and the marketing team running it themselves.
stack: [Next.js, TypeScript, FastAPI, Python, LLM and media-generation APIs, Gemini, Google Sheets and Drive, Railway, Vercel]
cover: ../../assets/work/ad-pipeline-dashboard.jpg
coverAlt: The VideoCloner dashboard, listing ad formats such as UGC ads, animated stories and cinematic ads, each with an estimated cost range.
encore: vanish
label: the AI ad pipeline
gallery:
  - src: ../../assets/work/ad-pipeline-dashboard-wide.jpg
    alt: The full sidebar of VideoCloner, grouping pipelines into create from video, create from brief, and utilities.
    caption: Every format is its own pipeline, grouped by what you start from.
  - src: ../../assets/work/ad-pipeline-assistant.jpg
    alt: The Cheeto assistant panel inside VideoCloner, offering to help pick a pipeline or find recent jobs.
    caption: An assistant that helps the team pick the right pipeline and find their jobs.
---

## How it grew

It started as me prompting models by hand, swapping characters into ads that had already worked, and stitching clips into variations. Once a format proved itself, I rebuilt it in **n8n**, with creative files in Google Drive and metadata in Google Sheets, so the team could test ideas fast.

n8n stopped being enough when we needed Python post-processing. Generated clips labelled 1080p didn't always come out at exactly 1920×1080, and our setup wouldn't run the scripts that fixed them. After talking it through with the team, we agreed to move to a proper internal app: first **Python and Streamlit**, then a **Next.js frontend and FastAPI backend** built for the long run.

I moved pipelines over one at a time. The old app kept running the whole way, with links pointing to each pipeline's new home, so marketing never lost a working day.

## What it does now

- **21 ad formats**: cloning ads that already work, static images, ideation from Reddit and Google Trends, UGC, cinematic, interview and podcast styles, AI avatars, character swaps and dubbing.
- **Costs before clicks**: each pipeline estimates the spend for the requested number of ads from the models' published pricing, before anything runs.
- **Throughput**: 20 parallel workers generate across pipelines. Normal days run 10 to 250 ads; peak days have reached about 1,000.

## Keeping quality honest

Generative video loves extra hands and props held at impossible angles. After each generation, a **Gemini** check looks for those glitches and returns a simple valid or flagged result, and a person decides whether to regenerate, skip or flag. Feedback is tracked per ad format and folded back into the prompts, so the same mistake is less likely to come back.

## The numbers, honestly

Roughly 10,000 ads generated, and an estimated 7,000 to 8,000 of them published on Meta. These are working estimates rather than an audited report, and ad performance itself was measured by the marketing team in their own analytics tool.
