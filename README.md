# Neural Plasticity Research Lab website

This is the lab website, live at **https://npresearchlab.github.io**.

GitHub Pages rebuilds the site automatically about a minute after any change is saved (committed) here. You can make every routine update in your browser on github.com, and you don't need to install anything.

## How to edit a file on GitHub

1. Open the file on github.com and click the pencil icon (**Edit this file**).
2. Make your change.
3. Click **Commit changes**, add a short note about what you changed, and confirm.
4. Wait about a minute, then refresh the live site.

If something breaks, open the **Actions** tab to see the error. You can always undo a change: open the file's **History**, find the change, and restore the previous version.

## Where things live

| To change… | Edit this file |
|---|---|
| Lab members (add, remove, update bios) | `_data/members.yml` |
| Dr. Borich's profile | `_data/pi.yml` |
| Alumni | The **NPRL Lab Member Archive** Google Sheet (synced to `_data/alumni.json` nightly; don't edit the JSON by hand) |
| Collaborators | `_data/collaborators.yml` |
| Research projects and recruiting status | `_data/projects.yml` |
| "What we study" themes on the home page | `_data/themes.yml` |
| Lab news (News page and home page) | The **NPRL News & Events** form and its responses sheet (Drive: 3 - News & Events). Approved rows sync to `_data/news_feed.json`; don't edit the JSON by hand |
| Selected publications | `_data/publications.yml` |
| Tools and methods | `_data/tools.yml` |
| Email, phone, address, social links, menu | `_config.yml` |
| Home page text | `index.html` |
| About, mission, DEI and mentorship text | `about.html` |
| Get involved page text | `get-involved.html` |
| Gallery photos | add images to `assets/img/gallery/` |

## Common tasks

### Add a new lab member
1. Upload their photo: go to `assets/img/people/`, click **Add file → Upload files**, and upload it. Use a square-ish photo about 600–800 px wide, named like `firstname-lastname.jpg`.
2. Open `_data/members.yml`, copy an existing person's block (from `- name:` to the end of their `bio`), paste it where you want them to appear, and edit it. Optional fields: `pronouns` (shown small after the name), `honors` (one award), `joint` (another lab), and `links` (Google Scholar, Website). `group` must be exactly `Research staff, postdocs, and graduate students` or `Undergraduate students`.

### Move someone to alumni
Delete their block from `_data/members.yml`. Then, in the NPRL Lab Member Archive sheet, set their Status to **Alum** (on either tab), and fill in "Where they went next" if known. The alumni list on the People page updates every night, or right away from the sheet's **Website > Sync alumni now** menu.

Groups come from the archive: core members with a student role (PhD, graduate, medical) are Graduate students and the rest are Postdocs and research staff; non-core members are sorted into DPT students, Undergraduate students, or High school students and volunteers by their Level/Major. Emails, mentors, projects, and notes are never sent to the website.

### Change a study's recruiting status
In `_data/projects.yml`, set `status:` to `recruiting`, `coming-soon` or `ongoing`. Studies marked `recruiting` appear on the home page automatically.

### Add gallery photos
Upload images to `assets/img/gallery/`. They appear on the Gallery page automatically, sorted by file name. Keep them under about 1 MB each; phone photos can be shrunk at squoosh.app first.

### Post lab news

Lab members fill out the **NPRL News & Events** form (the link is shared inside the lab only, never on the website). New responses land in **NPRL News & Events (Responses)** as **Pending**. To publish one, set its Status to **Approved**; it appears on the News page within a few minutes (the "NPRL news form" Apps Script sends it). **Hidden** takes it down. Tick **Pin to home page** to keep it in the home page's Lab news. Only rows with a Date are posted, lab-only events never are, and Lab life items stay on the News page. The script also runs nightly so upcoming events move into the feed after their date. Its code is in `tools/create-news-form.gs` and `tools/sync-news.gs`; it uses the same GitHub token as the alumni sync.

## A note on YAML files

The `.yml` files are sensitive to indentation, so keep the spacing the same as the entries around your change. If a line contains a colon followed by a space (`: `), put the whole value in double quotes.

## Previewing locally (optional)

If you have Ruby installed: `gem install jekyll -v 3.10.0 jekyll-seo-tag kramdown-parser-gfm webrick`, then `jekyll serve` in this folder and open http://localhost:4000.

## Planned: People page from the profile form

Not built yet. New profile form responses are added to `_data/members.yml` by hand for now.

The plan, for whoever picks this up: an Apps Script in the "NPRL Website Profile (Responses)" sheet (lab account) that, every night, writes everyone with Status = **On website** to the website, the same way `tools/sync-alumni.gs` does for alumni, reusing the same GitHub token. Before switching it on:

- Add an **Order** column to the responses sheet (staff and postdocs by seniority, then PhD students, then affiliated members), since the form doesn't capture order.
- Copy each person's current website text back into their response row, so edits made on the site (Oxford commas, shortened award lines, "Based in" for affiliated members) aren't overwritten. From then on, edits go in the sheet, not the website.
- Headshots: the script runs as the lab account, so it can read the uploaded photo from Drive and save it to `assets/img/people/`. Photos are cropped to squares by the page itself.
- Status **Alumni** hides someone from the People page (then mark them Alum in the Lab Member Archive); **Remove** hides them completely.
