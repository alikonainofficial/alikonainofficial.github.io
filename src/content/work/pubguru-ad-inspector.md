---
title: PubGuru Ad Inspector
order: 4
company: MonetizeMore
period: 2023 to 2024
role: Software engineer on the team
card: Debug an ad setup from the browser.
summary: A Chrome extension that lets website publishers see why an ad isn't behaving. I worked on its redesign, built the ad overlay for debugging, and fixed the recurring setup bugs publishers kept reporting.
objective: Let publishers diagnose ad placement and setup problems themselves, without a support ticket.
deployed: A Figma-based redesign built in React and JavaScript, an ad overlay that shows how each ad rendered, and a rating and feedback system for publishers.
outcome: Fewer reported setup errors, a more reliable tool, and a direct line for publishers to report what still hurt.
stack: [React, JavaScript, Chrome extension, Figma, Docker]
cover: ../../assets/work/pubguru-ad-inspector.png
coverAlt: The PubGuru Ad Inspector panel over a publisher's site, showing ad units, bidders and optimisation warnings.
suit: lens
links:
  - label: View in the Chrome Web Store
    href: https://chromewebstore.google.com/detail/pubguru-ad-inspector/nnoilpdinmjmdfpkdkbbkajejflbkoma
---

## The problem

MonetizeMore runs a B2B SaaS platform that helps publishers monitor how ads perform on their sites. When an ad tag misbehaves, publishers need to see why on the page itself, not in a support thread.

## What I worked on

- **The redesign**: turned a Figma-based UI into React and JavaScript features across the inspector.
- **An ad overlay** that exposes how each ad rendered, for internal debugging and performance analysis.
- **Recurring setup bugs** in publisher ad configurations, which cut down reported setup errors.
- **A rating and feedback system** so publishers and clients could report product issues.
- **Docker replicas of production** for debugging and local testing, which made CI more dependable.
