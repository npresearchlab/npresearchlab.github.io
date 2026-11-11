/**
 * Sends the People page from the profile form's responses sheet ("NPRL Website Profile Form (Responses)").
 *
 * Set up once, signed in as nprl.emory@gmail.com:
 *   1. Open the responses sheet, then Extensions > Apps Script. Name the project "Website People sync".
 *   2. Delete what's there, paste this whole file in, and click Save.
 *   3. Project Settings (gear) > Script properties > Add property:
 *        GITHUB_TOKEN = the same token value as the other website syncs.
 *   4. Choose "setupPeopleSync" and click Run. Allow access when Google asks.
 *
 * How the sheet drives the page:
 *   - Status (column A): only rows marked "On website" are shown. New form responses arrive blank;
 *     check them, then type "On website". (If someone submits twice, the newest "On website" row wins.)
 *     People who leave the lab: clear their Status, and mark them Alum in the Lab Member Archive.
 *   - "Order on website": smaller numbers come first (gaps like 10, 20, 30 leave room to insert).
 *     A blank order puts the person at the end of their group.
 *   - "Are you part of the NPRL CORE?" Yes = top section, No = Undergraduate students.
 *   - "Website photo": the photo's file name on the website. Leave it blank for a new person and the
 *     script copies their uploaded headshot to the website and fills this in. To replace a photo, clear the
 *     cell (and upload a new headshot by editing their form response, or paste a Drive link in the Headshot cell).
 *
 * Edits go to the website a minute after they're made, it re-checks nightly, and the sheet gets a
 * "Website > Update People page now" menu.
 */
var PEOPLE_REPO = 'npresearchlab/npresearchlab.github.io';
var PEOPLE_BRANCH = 'main';
var PEOPLE_PATH = '_data/members.yml';
var PEOPLE_IMG_DIR = 'assets/img/people/';
var GROUP_CORE = 'Research staff, postdocs, and graduate students';
var GROUP_UG = 'Undergraduate students';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Website').addItem('Update People page now', 'syncPeopleNow').addToUi();
}

function setupPeopleSync() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('GITHUB_TOKEN')) throw new Error('Add GITHUB_TOKEN in Project Settings > Script properties first.');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  props.setProperty('SHEET_ID', ss.getId());
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'onPeopleSheetEdit' || f === 'syncPeopleNow') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onPeopleSheetEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('syncPeopleNow').timeBased().everyDays(1).atHour(4).create();
  Logger.log(syncPeopleNow());
}

function onPeopleSheetEdit() {
  Utilities.sleep(5000);
  syncPeopleNow();
}

function peopleSheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets().filter(function (s) { return s.getFormUrl(); })[0] || ss.getSheets()[0];
}

function syncPeopleNow() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) return 'Another update is running.';
  try {
    var sheet = peopleSheet_();
    var values = sheet.getDataRange().getValues();
    addMissingPhotos_(sheet, values);
    var members = buildMembers_(values);
    var content = '# Generated from the profile form responses sheet by the "Website People sync" script.\n' +
                  '# Edit the sheet, not this file: changes here are overwritten.\n' +
                  JSON.stringify(members, null, 2) + '\n';
    var sent = ghPutPeople_(PEOPLE_PATH, Utilities.base64Encode(content, Utilities.Charset.UTF_8),
                            'People: sync from the profile form responses', content);
    var msg = sent ? 'Sent ' + members.length + ' people to the website. Live in a few minutes.'
                   : 'People page is already up to date.';
    Logger.log(msg);
    try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Website'); } catch (e) {}
    return msg;
  } finally {
    lock.releaseLock();
  }
}

// ---------- Turning sheet rows into People page entries (no Google calls, so it can be tested) ----------

function buildMembers_(values) {
  var head = values[0].map(function (h) { return String(h).toLowerCase().trim(); });
  function col(start) {
    for (var i = 0; i < head.length; i++) if (head[i].indexOf(start) === 0) return i;
    return -1;
  }
  var C = {
    status: col('status'), time: col('timestamp'), name: col('name as it should'), pronouns: col('pronouns'),
    role: col("position's title"), dept: col('department'), inst: col('institution'), core: col('are you part of the nprl core'),
    bio: col('bio (third person'), joint: col('are you also part of another lab'), email: col('institutional email'),
    honors: col('one award'), scholar: col('google scholar'), site: col('personal website link (optional)'),
    shortBio: col('short bio'), mentor: col('who is your primary mentor'), siteUg: col('personal website link, or linkedin'),
    order: col('order on website'), photo: col('website photo')
  };
  function s(row, k) { return C[k] < 0 ? '' : String(row[C[k]] == null ? '' : row[C[k]]).trim(); }
  function url(u) { return !u ? '' : (/^(https?:|mailto:)/i.test(u) ? u : 'https://' + u); }

  var byName = {};
  values.slice(1).forEach(function (row, i) {
    if (s(row, 'status').toLowerCase() !== 'on website' || !s(row, 'name')) return;
    var key = s(row, 'name').toLowerCase();
    var t = row[C.time] instanceof Date ? row[C.time].getTime() : (Date.parse(row[C.time]) || 0);
    if (!byName[key] || t >= byName[key].t) byName[key] = { row: row, t: t, i: i };
  });

  var list = Object.keys(byName).map(function (k) {
    var row = byName[k].row;
    var core = s(row, 'core').toLowerCase().indexOf('yes') === 0;
    var m = { name: s(row, 'name') };
    if (s(row, 'pronouns')) m.pronouns = s(row, 'pronouns').toLowerCase();
    m.role = s(row, 'role');
    m.group = core ? GROUP_CORE : GROUP_UG;
    m.affiliation = [s(row, 'dept'), s(row, 'inst')].filter(String).join(', ');
    if (core && s(row, 'joint')) m.joint = s(row, 'joint');
    if (s(row, 'honors')) m.honors = s(row, 'honors');
    if (!core && s(row, 'mentor')) m.mentor = s(row, 'mentor');
    m.photo = '/' + PEOPLE_IMG_DIR + (s(row, 'photo') || 'placeholder.jpg');
    var links = [];
    if (s(row, 'email')) links.push({ label: 'Email', url: 'mailto:' + s(row, 'email') });
    if (s(row, 'scholar')) links.push({ label: 'Google Scholar', url: url(s(row, 'scholar')) });
    var web = s(row, 'site') || s(row, 'siteUg');
    if (web) links.push({ label: /linkedin\.com/i.test(web) ? 'LinkedIn' : 'Website', url: url(web) });
    if (links.length) m.links = links;
    m.bio = (core ? s(row, 'bio') : s(row, 'shortBio')) || s(row, 'bio') || s(row, 'shortBio');
    m.bio = m.bio.replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    var o = parseFloat(s(row, 'order'));
    return { m: m, core: core, order: isNaN(o) ? 1e9 : o, i: byName[k].i };
  });
  list.sort(function (a, b) {
    return (a.core === b.core ? 0 : a.core ? -1 : 1) || (a.order - b.order) || (a.i - b.i);
  });
  return list.map(function (x) { return x.m; });
}

// ---------- Photos ----------

function addMissingPhotos_(sheet, values) {
  var head = values[0].map(function (h) { return String(h).toLowerCase(); });
  var cStatus = head.indexOf('status'), cPhoto = head.indexOf('website photo');
  var cName = -1, cShot = -1;
  head.forEach(function (h, i) { if (h.indexOf('name as it should') === 0) cName = i; if (h.indexOf('headshot') === 0) cShot = i; });
  if (cPhoto < 0 || cShot < 0) return;
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    if (String(row[cStatus]).toLowerCase().trim() !== 'on website' || String(row[cPhoto]).trim()) continue;
    var m = String(row[cShot]).match(/[-\w]{25,}/);
    if (!m) continue;
    var file = slugPeople_(row[cName]) + '.jpg';
    if (uploadHeadshot_(m[0], PEOPLE_IMG_DIR + file)) {
      sheet.getRange(r + 1, cPhoto + 1).setValue(file);
      row[cPhoto] = file;
    }
  }
}

function slugPeople_(t) {
  return String(t).split(',')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\b[a-z]\.\s*/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'person';
}

function uploadHeadshot_(fileId, path) {
  var blob = null;
  try {
    var r = UrlFetchApp.fetch('https://drive.google.com/thumbnail?sz=w900&id=' + fileId,
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (r.getResponseCode() === 200 && /^image\//.test(r.getHeaders()['Content-Type'] || '')) blob = r.getBlob();
  } catch (e) {}
  if (!blob) {
    try { blob = DriveApp.getFileById(fileId).getBlob(); } catch (e) { Logger.log('Could not open headshot ' + fileId); return false; }
    if (blob.getBytes().length > 4 * 1024 * 1024) { Logger.log('Headshot too large, skipped: ' + fileId); return false; }
  }
  ghPutPeople_(path, Utilities.base64Encode(blob.getBytes()), 'People: add headshot');
  return true;
}

// ---------- GitHub ----------

function ghPutPeople_(path, base64, message, compareText) {
  var headers = { Authorization: 'Bearer ' + PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
                  Accept: 'application/vnd.github+json' };
  var url = 'https://api.github.com/repos/' + PEOPLE_REPO + '/contents/' + path;
  var sha = null;
  var get = UrlFetchApp.fetch(url + '?ref=' + PEOPLE_BRANCH, { headers: headers, muteHttpExceptions: true });
  if (get.getResponseCode() === 200) {
    var cur = JSON.parse(get.getContentText());
    sha = cur.sha;
    if (compareText !== undefined && cur.content) {
      var existing = Utilities.newBlob(Utilities.base64Decode(cur.content.replace(/\n/g, ''))).getDataAsString('UTF-8');
      if (existing === compareText) return false;
    }
  }
  var body = { message: message, content: base64, branch: PEOPLE_BRANCH };
  if (sha) body.sha = sha;
  var put = UrlFetchApp.fetch(url, { method: 'put', headers: headers, contentType: 'application/json',
                                     payload: JSON.stringify(body), muteHttpExceptions: true });
  if (put.getResponseCode() >= 300) throw new Error('GitHub said ' + put.getResponseCode() + ': ' + put.getContentText());
  return true;
}
