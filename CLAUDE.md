# Working on the NPRL website

## Test pages before design changes (required)

The live site is the source of truth. Do not change the live design directly.

For any major design change (layout, colors, typography, navigation, a new section style, or a redesign of a page):

1. Build it as a **test page** first, under `test/`, e.g. `test/home-v2.html`.
2. Give it front matter `test: true` and a `permalink` under `/test/`, e.g. `permalink: /test/home-v2/`. Test pages are hidden from search engines and show a "Test page" banner.
3. If the change needs different CSS, put it in a `<style>` block in the test page or in `assets/css/test/<name>.css`. Never edit `assets/css/site.css` for a test.
4. Push it and send the link (https://npresearchlab.github.io/test/...). Only apply the change to the live pages after it's approved.
5. Once a test is approved and applied, or rejected, delete it.

Small content edits (text, people, projects, links, photos) can go straight to the live pages.

## Design system

See `DESIGN.md`. Design skills or references (taste-skill, impeccable, awesome-design-md) are advisory: use them to critique or to build test pages, never to overwrite the current design.

## Content

Routine content lives in `_data/*.yml`; see README.md. Jekyll 3.10 (GitHub Pages native build), no custom plugins beyond jekyll-seo-tag.
