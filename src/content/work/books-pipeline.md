---
title: The 300,000-book pipeline
order: 2
company: Speechify
period: MVP build
role: Built the Python tooling
card: 300,000+ books, none opened by hand.
summary: A new book-listening app needed a real catalog on day one. I built the Python tooling that collected 300,000+ public-domain books and handled their metadata, audio, subtitles, topics and genres.
objective: Fill a new reading and listening app with a usable catalog, and give search something good to work with.
deployed: Python scrapers and batch tools for metadata, audiobook processing and subtitle generation, OpenAI-based topic tagging, and Supabase for storage.
outcome: 300,000+ public-domain books with the metadata the app needed, plus faster, more relevant keyword search and early recommendation experiments.
stack: [Python, OpenAI API, Supabase, PostgreSQL, CSV pipelines]
cover: ../../assets/work/booktok.png
coverAlt: A book library screen with shelves of classic titles such as Pride and Prejudice, Frankenstein and Moby Dick.
suit: shelf
links:
  - label: Book Topics Assigner on GitHub
    href: https://github.com/alikonainofficial/book-topics-assigner
  - label: Books Recommender on GitHub
    href: https://github.com/alikonainofficial/books-recommender
---

## The job

Every title needed the same handful of things before it was useful in the app: clean metadata, processed audio, subtitles, a topic and a genre. At 300,000 books, "by hand" stops being an option and starts being a joke.

## What I built

- **Scrapers** that collected public-domain books and their metadata.
- **Audiobook processing** and **subtitle generation** so titles could be listened to and followed along.
- **Topic and category assignment** from book descriptions using the OpenAI API, with resumable runs and retries so a long batch survives a bad minute. A version of this is public: [Book Topics Assigner](https://github.com/alikonainofficial/book-topics-assigner).
- **Genre conversion** and **Supabase file uploads** to land everything where the app could read it.
- **Recommendation experiments**, including a content-based engine that suggests books from a reader's history. The public version: [Books Recommender](https://github.com/alikonainofficial/books-recommender).

## What changed

The catalog existed, the metadata was consistent enough to search, and keyword search got faster and more relevant. None of those books had to be opened by a person to get there.
