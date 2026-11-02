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
- Rounded corners 14px on photos and cards; pill-shaped buttons.
- Inner pages open with a navy title band (`_includes/title-band.html`): h1 and lede on the left, the whole logo on the right edge of the content. The logo drifts slowly and its colored dots form and release links (`assets/js/title-drift.js`); still for reduced motion, paused off screen. On phones the logo sits small above the title.

## Components
- Buttons: primary (ink fill) and secondary (ink outline).
- Status badges: Recruiting (red), Recruiting soon (violet).
- People cards: square photo, name, role, affiliation, optional joint-lab line, awards marked with magenta linked dots (not pills), expandable bio.
- Expandable details (`<details>`) for bios and eligibility.
