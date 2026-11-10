/**
 * Sends Dr. Borich's profile from the "NPRL website: PI profile (Dr. Borich)" sheet to the People page.
 *
 * Set up once, signed in as nprl.emory@gmail.com:
 *   1. Open the PI profile sheet, then Extensions > Apps Script. Name the project "Website PI profile sync".
 *   2. Delete what's there, paste this whole file in, and click Save.
 *   3. Project Settings (gear) > Script properties > Add property:
 *        GITHUB_TOKEN = the same token value as the alumni and news syncs.
 *   4. Choose "setupPiSync" and click Run. Allow access when Google asks.
 *
 * From then on, edits to the sheet go to the website a minute after they're made, it re-checks nightly,
 * and the sheet gets a "Website > Update my profile now" menu. The photo is not in the sheet; it stays
 * in _data/pi.yml on the website.
 *
 * Tabs: Profile (Field / Value rows: Name, Pronouns, Role, Summary), Links (Label / URL),
 * Education, Memberships, Honors (one per row). Row 1 of each tab is a note, row 2 the header.
 */
var PI_REPO = 'npresearchlab/npresearchlab.github.io';
var PI_BRANCH = 'main';
var PI_PATH = '_data/pi_profile.json';

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Website').addItem('Update my profile now', 'syncPiNow').addToUi();
}

function setupPiSync() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('GITHUB_TOKEN')) throw new Error('Add GITHUB_TOKEN in Project Settings > Script properties first.');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  props.setProperty('SHEET_ID', ss.getId());
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('onPiSheetEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('syncPiNow').timeBased().everyDays(1).atHour(4).create();
  Logger.log(syncPiNow());
}

function onPiSheetEdit() {
  Utilities.sleep(5000); // let a burst of edits finish
  syncPiNow();
}

function syncPiNow() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) return 'Another update is running.';
  try {
    var content = JSON.stringify(buildPi_(), null, 2) + '\n';
    var msg = putPi_(content) ? 'Profile sent to the website. Live in a few minutes.' : 'Profile is already up to date.';
    Logger.log(msg);
    try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Website'); } catch (e) {}
    return msg;
  } finally {
    lock.releaseLock();
  }
}

function buildPi_() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  var ss = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  function rows(name) {
    var sh = ss.getSheetByName(name);
    if (!sh || sh.getLastRow() < 3) return [];
    return sh.getRange(3, 1, sh.getLastRow() - 2, Math.max(sh.getLastColumn(), 1)).getValues()
      .filter(function (r) { return String(r[0]).trim() !== ''; });
  }
  var pi = {};
  rows('Profile').forEach(function (r) {
    var key = String(r[0]).trim().toLowerCase();
    var val = String(r[1] || '').trim().replace(/\s+/g, ' ');
    if (val && ['name', 'pronouns', 'role', 'summary'].indexOf(key) !== -1) pi[key] = val;
  });
  if (!pi.name) throw new Error('The Profile tab needs a Name.');
  pi.links = rows('Links').filter(function (r) { return String(r[1]).trim(); })
    .map(function (r) { return { label: String(r[0]).trim(), url: String(r[1]).trim() }; });
  pi.education = rows('Education').map(function (r) { return String(r[0]).trim(); });
  pi.memberships = rows('Memberships').map(function (r) { return String(r[0]).trim(); });
  pi.honors = rows('Honors').map(function (r) { return String(r[0]).trim(); });
  return pi;
}

/** Writes the file to GitHub; returns false if it was already the same. */
function putPi_(content) {
  var headers = { Authorization: 'Bearer ' + PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
                  Accept: 'application/vnd.github+json' };
  var url = 'https://api.github.com/repos/' + PI_REPO + '/contents/' + PI_PATH;
  var sha = null;
  var get = UrlFetchApp.fetch(url + '?ref=' + PI_BRANCH, { headers: headers, muteHttpExceptions: true });
  if (get.getResponseCode() === 200) {
    var cur = JSON.parse(get.getContentText());
    sha = cur.sha;
    var existing = Utilities.newBlob(Utilities.base64Decode(cur.content.replace(/\n/g, ''))).getDataAsString('UTF-8');
    if (existing === content) return false;
  }
  var body = { message: 'People: Dr. Borich\'s profile from the PI profile sheet',
               content: Utilities.base64Encode(content, Utilities.Charset.UTF_8), branch: PI_BRANCH };
  if (sha) body.sha = sha;
  var put = UrlFetchApp.fetch(url, { method: 'put', headers: headers, contentType: 'application/json',
                                     payload: JSON.stringify(body), muteHttpExceptions: true });
  if (put.getResponseCode() >= 300) throw new Error('GitHub said ' + put.getResponseCode() + ': ' + put.getContentText());
  return true;
}
