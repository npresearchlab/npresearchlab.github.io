/**
 * NPRL Lab Member Archive -> website alumni list
 *
 * Reads the "Core members" and "Non-core members" tabs and writes the
 * website's alumni list (_data/alumni.json in the npresearchlab.github.io repo).
 * Only names, roles, groups, and "where they went next" are sent.
 * Emails, mentors, projects, and notes never leave this sheet.
 *
 * Who counts as an alum: anyone whose Status is "Alum", on either tab.
 * (If a Non-core row has no Status yet, they count as an alum unless their
 * "Semesters in lab" includes the current semester.)
 *
 * Setup (once, from the lab account):
 *   1. In this sheet: Extensions > Apps Script, paste this file, save.
 *   2. Project Settings (gear) > Script properties > Add property:
 *        GITHUB_TOKEN = a GitHub fine-grained token with "Contents: Read and write"
 *        on npresearchlab/npresearchlab.github.io only.
 *   3. Run setupNightlyAlumniSync once and approve the permissions.
 * After that it syncs every night, and there is a Website > Sync alumni now menu.
 */

const REPO = 'npresearchlab/npresearchlab.github.io';
const FILE_PATH = '_data/alumni.json';
const BRANCH = 'main';

const GROUP_ORDER = [
  'Postdocs and research staff',
  'Graduate students',
  'DPT students',
  'Undergraduate students',
  'High school students and volunteers'
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Website')
    .addItem('Sync alumni now', 'syncAlumniNow')
    .addToUi();
}

function syncAlumniNow() {
  const result = syncAlumniToWebsite();
  SpreadsheetApp.getUi().alert(result);
}

function setupNightlyAlumniSync() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncAlumniToWebsite')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('syncAlumniToWebsite').timeBased().everyDays(1).atHour(3).create();
  Logger.log(syncAlumniToWebsite());
}

/* ---------- reading the sheet ---------- */

function clean_(v) {
  const s = String(v == null ? '' : v).trim();
  return /^(n\/a|na|none|unknown|-)$/i.test(s) ? '' : s;
}

function col_(header, words) {
  const h = header.map(x => String(x).toLowerCase());
  for (const w of words) {
    const i = h.findIndex(x => x.indexOf(w) !== -1);
    if (i !== -1) return i;
  }
  throw new Error('Could not find a column for: ' + words.join(' / '));
}

function currentSemester_(d) {
  const m = d.getMonth() + 1;
  const term = m <= 5 ? 'Spring' : (m <= 7 ? 'Summer' : 'Fall');
  return term + ' ' + d.getFullYear();
}

function buildAlumni_() {
  const ss = SpreadsheetApp.getActive();
  const out = [];

  // Core members
  const core = ss.getSheetByName('Core members').getDataRange().getDisplayValues();
  const ch = core[0];
  const cName = col_(ch, ['name']);
  const cRole = col_(ch, ['role']);
  const cStatus = col_(ch, ['status']);
  const cNext = col_(ch, ['where they']);
  core.slice(1).forEach(r => {
    const name = clean_(r[cName]);
    if (!name || clean_(r[cStatus]).toLowerCase() !== 'alum') return;
    const role = clean_(r[cRole]);
    const grad = /(phd|graduate|medical|master|ms student|student)/i.test(role) && !/fellow/i.test(role);
    out.push({
      name: name,
      type: grad ? 'Graduate students' : 'Postdocs and research staff',
      role: role,
      next: clean_(r[cNext])
    });
  });

  // Non-core members
  const now = currentSemester_(new Date()).toLowerCase();
  const non = ss.getSheetByName('Non-core members').getDataRange().getDisplayValues();
  const nh = non[0];
  const nName = col_(nh, ['name']);
  const nSchool = col_(nh, ['school']);
  const nLevel = col_(nh, ['level']);
  const nSem = col_(nh, ['semester']);
  const nNext = col_(nh, ['where they']);
  const nStatus = nh.map(x => String(x).toLowerCase().trim()).indexOf('status');
  non.slice(1).forEach(r => {
    const name = clean_(r[nName]);
    if (!name) return;
    const status = nStatus === -1 ? '' : clean_(r[nStatus]).toLowerCase();
    if (status === 'current') return;
    if (status !== 'alum') {
      const sems = String(r[nSem]).toLowerCase().split(',').map(s => s.trim());
      if (sems.indexOf(now) !== -1) return; // no Status yet, but in the lab this semester
    }
    const level = clean_(r[nLevel]);
    const school = clean_(r[nSchool]);
    let type, role;
    if (/^dpt/i.test(level)) {
      type = 'DPT students';
      role = level;
    } else if (/high school|volunteer/i.test(level)) {
      type = 'High school students and volunteers';
      role = level;
    } else {
      type = 'Undergraduate students';
      role = level
        .replace(/\s*\((unsure|unknown)\)\s*/i, '')
        .replace(/^Undergraduate(?! student)/i, 'Undergraduate student');
    }
    if (school) role = role ? role + ', ' + school : school;
    out.push({ name: name, type: type, role: role, next: clean_(r[nNext]) });
  });

  out.sort((a, b) =>
    GROUP_ORDER.indexOf(a.type) - GROUP_ORDER.indexOf(b.type) ||
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  return out;
}

/* ---------- writing to GitHub ---------- */

function syncAlumniToWebsite() {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  if (!token) throw new Error('Add GITHUB_TOKEN in Project Settings > Script properties first.');

  const content = JSON.stringify(buildAlumni_(), null, 2) + '\n';
  const url = 'https://api.github.com/repos/' + REPO + '/contents/' + FILE_PATH;
  const headers = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json' };

  let sha = null;
  const get = UrlFetchApp.fetch(url + '?ref=' + BRANCH, { headers: headers, muteHttpExceptions: true });
  if (get.getResponseCode() === 200) {
    const cur = JSON.parse(get.getContentText());
    sha = cur.sha;
    const existing = Utilities.newBlob(Utilities.base64Decode(cur.content.replace(/\n/g, ''))).getDataAsString('UTF-8');
    if (existing === content) return 'Alumni list is already up to date. Nothing changed.';
  }

  const body = {
    message: 'Alumni: sync from the NPRL Lab Member Archive',
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: BRANCH
  };
  if (sha) body.sha = sha;
  const put = UrlFetchApp.fetch(url, {
    method: 'put', headers: headers, contentType: 'application/json',
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  if (put.getResponseCode() >= 300) {
    throw new Error('GitHub said ' + put.getResponseCode() + ': ' + put.getContentText());
  }
  return 'Alumni list sent to the website. It will be live in a minute or two.';
}
