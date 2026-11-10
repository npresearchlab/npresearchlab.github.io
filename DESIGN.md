# NPRL website design system

The current, approved design. Changes to anything here go through a test page first (see CLAUDE.md).

## Identity
- Built around the lab's "Making a connection" logo: a dot-matrix brain, gray on the left, colored on the right, with linked dots.
- The home hero's dot brain (`assets/js/connections.js`) is the logo traced dot for dot, with blob-like links. It plays once on load and then holds still. Inner page headers use the drifting version. Both respect reduced motion.
- Audience includes older adults and stroke survivors, so legibility and large type come first.

## Color (from the logo)
| Token | Hex | Use |
|---|---|---|
| ink | #14203a | Text, primary buttons, footer background |
| ink-2 | #445066 | Secondary text |
| paper | #ffffff | Page background |
| mist | #eff3f7 | Alternating section background |
| line | #d6dde6 | Dividers |
| red | #e9193a (text #c4122f) | "Recruiting" status |
| magenta | #ca006c | Logo / dot field only |
| violet | #7d4199 | "Recruiting soon" status |
| blue | #0079c2 (text #006aab) | Links, focus ring |
| cyan | #00a4e4 | Logo / dot field only |
| grays | #58585a, #818285, #a7a9ac | Dot field only |

## Type
- One family: **Atkinson Hyperlegible Next** (Google Fonts), chosen for low-vision readability.
- Body 19px (1.1875rem), line height 1.6, lines under ~70 characters.
- Headings bold (700–760), tight letter spacing; h1 up to 4.4rem on the home page.
- Sentence case everywhere. No all-caps labels.

## Layout
- Max width 72rem, left-aligned content.
- Sections alternate white and mist.
- Square corners on photos, cards, panels, and headshots (including the small round-looking ones); pill-shaped buttons and status pills stay round, so round shapes stay tied to the logo dots.
- Inner pages open with a navy title band (`_includes/title-band.html`): h1 and lede on the left, the whole logo on the right edge of the content. The logo drifts slowly and its colored dots form and release links (`assets/js/title-drift.js`); still for reduced motion, paused off screen. On phones the logo sits small above the title.

- Home "What we study" is a numbered index list (`_data/themes.yml`, `assets/js/index-list.js`): big titles with thin rules, each number in a logo color; hovering a row opens its sentence and swaps the square photo on the right. On phones, every row shows its sentence and a small thumbnail.

## Saved for later
- **Dot line** (`_includes/dot-line.svg`): a text-width row of logo dots, gray to color with a few links. Tried above "What we study" on the home page and set aside for another page. Use with `{% include dot-line.svg %}` inside a wrapper sized to the text column, about 24px tall.

## Components
- Buttons: primary (ink fill) and secondary (ink outline).
- Status badges: Recruiting (red), Recruiting soon (violet).
- People cards: square photo, name, role, affiliation, optional joint-lab line, awards marked with magenta linked dots (not pills), expandable bio.
- Core members' bios open one at a time in a wide navy panel under their row, pointing back to their card, with their projects linked. On desktop the bio text wraps under the photo, name, and role and runs the full panel width; bios can have paragraphs. The "Joint with" or "Based in" line is italic. Undergraduate cards are compact, show a mentor line, and open their bio in a thin outlined bubble.
- Each project on Research lists "Who's working on this" (from `team` in projects.yml), linking to People cards.
- Expandable details (`<details>`) for eligibility.

## News page (/news/)
One feed, newest first, grouped by year (the year stays put beside its items on desktop). Filter pills by type, each with a logo-color dot; each item has a linked-dot type marker in the same color (`_data/news_types.yml`). Lab life (personal news) items are photo-first with a gray marker, and stay off the home page. An Upcoming card overlaps the bottom of the navy title band when there are public upcoming events. A navy Featured paper card (magenta top bar) and Recent papers sit in a sticky right rail. Items come from the News & Events form (see README).

## Home page order (Nov 2026)

Hero (white) → About the lab (gray) → What we study, compact numbered list (white) → Studies looking for volunteers (gray with a 5px red rule on top, matching the Recruiting dots) → Lab news (white; pinned then newest 3 from `_data/news_feed.json`, falling back to `_data/news.yml`) → Join the lab band + funders row (gray) → Visit the lab (white) → footer (navy). A Featured paper card sits beside the news (the first entry in `_data/publications.yml`, with an optional `plain:` summary).
