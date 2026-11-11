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
| Lab members (add, remove, update bios, order, photos) | The **NPRL Website Profile Form (Responses)** Google Sheet (Drive: 1 - People Updates), synced to `_data/members.yml`. Don't edit the file by hand |
| Dr. Borich's profile | The **NPRL website: PI profile (Dr. Borich)** Google Sheet (Drive: 1 - People Updates), synced to `_data/pi_profile.json`. His photo stays in `_data/pi.yml` |
| Alumni | The **NPRL Lab Member Archive** Google Sheet (synced to `_data/alumni.json` nightly; don't edit the JSON by hand) |
| Collaborators | `_data/collaborators.yml` |
| Research projects and recruiting status | The **NPRL Projects** Google Sheet, synced to `_data/projects.yml`. Don't edit the file by hand |
| "What we study" themes on the home page | `_data/themes.yml` |
| Lab news (News page and home page) | The **NPRL News & Events** form and its responses sheet (Drive: 3 - News & Events). Approved rows sync to `_data/news_feed.json`; don't edit the JSON by hand |
| Selected publications | `_data/publications.yml` |
| Tools and methods | `_data/tools.yml` |
| Email, phone, address, social links, menu | `_config.yml` |
| Home page text | `index.html` |
| About, mission, DEI and mentorship text | `about.html` |
| Get involved page text | `get-involved.html` |
| Gallery photos | add images to `assets/img/gallery/` |

## What updates itself

Five Google Sheets feed the website. Each has an Apps Script that sends changes a minute or two after an edit, re-checks nightly, and adds a **Website** menu to the sheet with a "do it now" item. The site itself takes a few more minutes to rebuild. All five use the same GitHub token (see "Renewing the GitHub token" in the README Google Doc); when it's renewed, update `GITHUB_TOKEN` in every script.

| Sheet | Shows up on | Script (copy in `tools/`) |
|---|---|---|
| NPRL Website Profile Form (Responses) | People page cards | Website People sync (`sync-people.gs`) |
| NPRL website: PI profile (Dr. Borich) | Top of the People page | Website PI profile sync (`sync-pi.gs`) |
| NPRL Lab Member Archive | Alumni on the People page | Website alumni sync (`sync-alumni.gs`) |
| NPRL Projects | Research page, recruiting studies on Home and Get involved, project links on People cards | Website Projects sync (`sync-projects.gs`) |
| NPRL News & Events (Responses) | News page and the home page's Lab news | NPRL news form (`create-news-form.gs`, `sync-news.gs`) |

## How photos get to the website

- **Lab member headshots:** people upload a headshot on the profile form. When a row is set to **On website** and its **Website photo** cell is blank, the People sync copies the headshot to `assets/img/people/` (resized by Google to about 900 px) and writes the file name into **Website photo**. To replace a photo, upload the new one (the person edits their form response, or paste a Drive link to the new photo into their Headshot cell), then clear **Website photo**. The page crops every photo to a square, centered a little above the middle, so any shape works. To use a hand-cropped photo instead, upload it to `assets/img/people/` on GitHub and type its file name into **Website photo**.
- **Dr. Borich's photo:** not in his sheet. Replace `assets/img/people/michael-borich.jpg` on GitHub (Add file → Upload files, same name).
- **Project photos:** in the Projects sheet's **Photo** column, type the file name of an image already in `assets/img/research/` (e.g. `er.jpg`), or paste a Google Drive link to a photo; the Projects sync copies it to the website and replaces the link with the file name.
- **News photos:** uploaded on the News & Events form; the news sync copies each one once, when its row is Approved.
- **Gallery photos:** upload directly to `assets/img/gallery/` on GitHub (see below).
- **Alumni:** no photos.

## Common tasks

### Add a new lab member
Send them the profile form. When their response arrives, check it (Oxford commas, no class years, short award line), then set **Status** to **On website** and give them an **Order on website** number (smaller numbers come first; staff and postdocs by seniority, then PhD students, then affiliated members; undergraduates after). Their headshot is copied automatically. People who haven't filled out the form can be added as a row by hand.

### Edit someone's profile
Edit their row in the responses sheet. If someone submits the form again, the newest row marked **On website** wins, so clear the old row's Status.

### Move someone to alumni
Clear their Status in the profile responses sheet (so they leave the People page). Then, in the NPRL Lab Member Archive sheet, set their Status to **Alum** (on either tab), and fill in "Where they went next" if known. The alumni list on the People page updates every night, or right away from the sheet's **Website > Sync alumni now** menu.

Groups come from the archive: core members with a student role (PhD, graduate, medical) are Graduate students and the rest are Postdocs and research staff; non-core members are sorted into DPT students, Undergraduate students, or High school students and volunteers by their Level/Major. Emails, mentors, projects, and notes are never sent to the website.

### Change a study's recruiting status
In the NPRL Projects sheet, set **Recruiting status** to Recruiting, Recruiting soon, or Not recruiting. Recruiting studies appear on the home page and Get involved automatically. **Show on website** = Yes/No controls whether a project appears at all, **Title on website** is the public title, and **Order on website** sets the order.

### Add gallery photos
Upload images to `assets/img/gallery/`. They appear on the Gallery page automatically, sorted by file name. Keep them under about 1 MB each; phone photos can be shrunk at squoosh.app first.

### Post lab news

Lab members fill out the **NPRL News & Events** form (the link is shared inside the lab only, never on the website). New responses land in **NPRL News & Events (Responses)** as **Pending**. To publish one, set its Status to **Approved**; it appears on the News page within a few minutes (the "NPRL news form" Apps Script sends it). **Hidden** takes it down. Tick **Pin to home page** to keep it in the home page's Lab news. Only rows with a Date are posted, lab-only events never are, and Lab life items stay on the News page. The script also runs nightly so upcoming events move into the feed after their date. Its code is in `tools/create-news-form.gs` and `tools/sync-news.gs`; it uses the same GitHub token as the alumni sync.

## A note on YAML files

The `.yml` files are sensitive to indentation, so keep the spacing the same as the entries around your change. If a line contains a colon followed by a space (`: `), put the whole value in double quotes.

## Previewing locally (optional)

If you have Ruby installed: `gem install jekyll -v 3.10.0 jekyll-seo-tag kramdown-parser-gfm webrick`, then `jekyll serve` in this folder and open http://localhost:4000.
