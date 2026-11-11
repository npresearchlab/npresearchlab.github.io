/**
 * Sends the Research page's projects from the "NPRL Projects" sheet.
 * Recruiting projects also appear on the home page and on Get involved, and team names link projects to People cards.
 *
 * Set up once, signed in as nprl.emory@gmail.com:
 *   1. Open the NPRL Projects sheet, then Extensions > Apps Script. Name the project "Website Projects sync".
 *   2. Delete what's there, paste this whole file in, and click Save.
 *   3. Project Settings (gear) > Script properties > Add property:
 *        GITHUB_TOKEN = the same token value as the other website syncs.
 *   4. Choose "setupProjectsSync" and click Run. Allow access when Google asks.
 *
 * Columns the website uses (the rest are for the lab only):
 *   Show on website      "Yes" to show the project.
 *   Title on website     the public title (falls back to "Project name").
 *   Order on website     smaller numbers first (10, 20, 30 leaves room to insert).
 *   Recruiting status    Recruiting / Recruiting soon / Not recruiting.
 *   Project description  the paragraph on the Research page.
 *   Who can take part (plain language), Eligibility (one per line).
 *   Photo                a file name in assets/img/research/ (e.g. er.jpg), a full website path, or a Google Drive
 *                        link to a photo, which the script copies to the website and replaces with the file name.
 *   Team on website      full names exactly as on the People page, one per line.
 *
 * Edits go to the website a minute after they're made, it re-checks nightly, and the sheet gets a
 * "Website > Update Research page now" menu.
 */
var PROJ_REPO = 'npresearchlab/npresearchlab.github.io';
var PROJ_BRANCH = 'main';
var PROJ_PATH = '_data/projects.yml';
var PROJ_IMG_DIR = 'assets/img/research/';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Website').addItem('Update Research page now', 'syncProjectsNow').addToUi();
}

function setupProjectsSync() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('GITHUB_TOKEN')) throw new Error('Add GITHUB_TOKEN in Project Settings > Script properties first.');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  props.setProperty('SHEET_ID', ss.getId());
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'onProjectsSheetEdit' || f === 'syncProjectsNow') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onProjectsSheetEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('syncProjectsNow').timeBased().everyDays(1).atHour(4).create();
  Logger.log(syncProjectsNow());
}

function onProjectsSheetEdit() {
  Utilities.sleep(5000);
  syncProjectsNow();
}

function syncProjectsNow() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) return 'Another update is running.';
  try {
    var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
    var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Projects') || ss.getSheets()[0];
    var values = sheet.getDataRange().getValues();
    copyDrivePhotos_(sheet, values);
    var projects = buildProjects_(values);
    var content = '# Generated from the NPRL Projects sheet by the "Website Projects sync" script.\n' +
                  '# Edit the sheet, not this file: changes here are overwritten.\n' +
                  JSON.stringify(projects, null, 2) + '\n';
    var sent = ghPutProj_(PROJ_PATH, Utilities.base64Encode(content, Utilities.Charset.UTF_8),
                          'Research: sync from the NPRL Projects sheet', content);
    var msg = sent ? 'Sent ' + projects.length + ' projects to the website. Live in a few minutes.'
                   : 'Research page is already up to date.';
    Logger.log(msg);
    try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Website'); } catch (e) {}
    return msg;
  } finally {
    lock.releaseLock();
  }
}

// ---------- Sheet rows to Research page entries (no Google calls, so it can be tested) ----------

function projCols_(head) {
  head = head.map(function (h) { return String(h).toLowerCase().trim(); });
  function col(start) {
    for (var i = 0; i < head.length; i++) if (head[i].indexOf(start) === 0) return i;
    return -1;
  }
  return {
    name: col('project name'), desc: col('project description'), show: col('show on website'),
    status: col('recruiting status'), who: col('who can take part'), elig: col('eligibility'),
    photo: col('photo'), team: col('team on website'), title: col('title on website'), order: col('order on website')
  };
}

function buildProjects_(values) {
  var C = projCols_(values[0]);
  function s(row, k) { return C[k] < 0 ? '' : String(row[C[k]] == null ? '' : row[C[k]]).trim(); }
  function lines(t) { return t.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(String); }
  var list = [];
  values.slice(1).forEach(function (row, i) {
    if (s(row, 'show').toLowerCase() !== 'yes') return;
    var st = s(row, 'status').toLowerCase();
    var p = { title: s(row, 'title') || s(row, 'name') };
    var team = lines(s(row, 'team'));
    if (team.length) p.team = team;
    p.status = st.indexOf('soon') !== -1 ? 'coming-soon' : (st.indexOf('recruiting') === 0 ? 'recruiting' : 'ongoing');
    var ph = s(row, 'photo');
    if (ph) p.photo = ph.charAt(0) === '/' ? ph : '/' + PROJ_IMG_DIR + ph;
    p.summary = s(row, 'desc').replace(/\s+/g, ' ');
    if (s(row, 'who')) p.who = s(row, 'who');
    var el = lines(s(row, 'elig'));
    if (el.length) p.eligibility = el;
    var o = parseFloat(s(row, 'order'));
    list.push({ p: p, order: isNaN(o) ? 1e9 : o, i: i });
  });
  list.sort(function (a, b) { return (a.order - b.order) || (a.i - b.i); });
  return list.map(function (x) { return x.p; });
}

// ---------- Photos given as Drive links ----------

function copyDrivePhotos_(sheet, values) {
  var C = projCols_(values[0]);
  if (C.photo < 0) return;
  for (var r = 1; r < values.length; r++) {
    var v = String(values[r][C.photo] || '');
    if (!/drive\.google\.com|docs\.google\.com/.test(v)) continue;
    var m = v.match(/[-\w]{25,}/);
    if (!m) continue;
    var title = String(values[r][C.title] || values[r][C.name] || 'project');
    var file = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) + '.jpg';
    var blob = null;
    try {
      var res = UrlFetchApp.fetch('https://drive.google.com/thumbnail?sz=w1600&id=' + m[0],
        { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
      if (res.getResponseCode() === 200 && /^image\//.test(res.getHeaders()['Content-Type'] || '')) blob = res.getBlob();
    } catch (e) {}
    if (!blob) { try { blob = DriveApp.getFileById(m[0]).getBlob(); } catch (e) { continue; } }
    if (blob.getBytes().length > 4 * 1024 * 1024) { Logger.log('Photo too large, skipped: ' + v); continue; }
    ghPutProj_(PROJ_IMG_DIR + file, Utilities.base64Encode(blob.getBytes()), 'Research: add project photo');
    sheet.getRange(r + 1, C.photo + 1).setValue(file);
    values[r][C.photo] = file;
  }
}

// ---------- GitHub ----------

function ghPutProj_(path, base64, message, compareText) {
  var headers = { Authorization: 'Bearer ' + PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
                  Accept: 'application/vnd.github+json' };
  var url = 'https://api.github.com/repos/' + PROJ_REPO + '/contents/' + path;
  var sha = null;
  var get = UrlFetchApp.fetch(url + '?ref=' + PROJ_BRANCH, { headers: headers, muteHttpExceptions: true });
  if (get.getResponseCode() === 200) {
    var cur = JSON.parse(get.getContentText());
    sha = cur.sha;
    if (compareText !== undefined && cur.content) {
      var existing = Utilities.newBlob(Utilities.base64Decode(cur.content.replace(/\n/g, ''))).getDataAsString('UTF-8');
      if (existing === compareText) return false;
    }
  }
  var body = { message: message, content: base64, branch: PROJ_BRANCH };
  if (sha) body.sha = sha;
  var put = UrlFetchApp.fetch(url, { method: 'put', headers: headers, contentType: 'application/json',
                                     payload: JSON.stringify(body), muteHttpExceptions: true });
  if (put.getResponseCode() >= 300) throw new Error('GitHub said ' + put.getResponseCode() + ': ' + put.getContentText());
  return true;
}
