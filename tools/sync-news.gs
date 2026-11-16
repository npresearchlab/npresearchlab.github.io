/**
 * Sends approved rows from "NPRL News & Events (Responses)" to the website.
 *
 * Lives inside the responses sheet (Extensions > Apps Script), project "Website news sync". Set up once,
 * signed in as nprl.emory@gmail.com:
 *   1. Open NPRL News & Events (Responses), then Extensions > Apps Script. Name the project "Website news sync".
 *   2. Delete what's there, paste this whole file in, and click Save.
 *   3. Project Settings (gear) > Script properties > Add property:
 *        GITHUB_TOKEN = the same token value as the other website syncs.
 *   4. Choose "setupNewsSync" and click Run. Allow access when Google asks.
 *
 * From then on:
 *   - Changing a row's Status (or Pin) posts the change within a minute or two.
 *   - It also runs every night, so upcoming events move into the feed once their date passes.
 *   - The sheet has a "Website > Update News page now" menu.
 *
 * Only rows with Status = Approved are posted. A row without a Date shows without one, at the top of its year;
 * an event needs a Date. Lab-only events are never posted.
 * Photos are copied to the website once (resized by Google to about 1000px wide).
 * The separate "NPRL news form" script (create-news-form.gs) keeps the form's member checkboxes current.
 */
var NEWS_REPO = 'npresearchlab/npresearchlab.github.io';
var NEWS_BRANCH = 'main';
var NEWS_DATA_PATH = '_data/news_feed.json';
var NEWS_IMG_DIR = 'assets/img/news/';
var NEWS_TZ = 'America/New_York';

var NEWS_TYPES = {
  'award': 'award', 'paper': 'paper', 'talk': 'talk', 'milestone': 'milestone',
  'outreach': 'outreach', 'upcoming event': 'event', 'event': 'event', 'lab life': 'life'
};

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Website').addItem('Update News page now', 'syncNewsNow').addToUi();
}

function setupNewsSync() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('GITHUB_TOKEN')) throw new Error('Add GITHUB_TOKEN in Project Settings > Script properties first.');
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  props.setProperty('SHEET_ID', ss.getId());
  ScriptApp.getProjectTriggers().forEach(function (t) {
    var f = t.getHandlerFunction();
    if (f === 'syncNewsNow' || f === 'onNewsSheetEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncNewsNow').timeBased().everyDays(1).atHour(4).create();
  ScriptApp.newTrigger('onNewsSheetEdit').forSpreadsheet(ss).onEdit().create();
  Logger.log(syncNewsNow());
}

/** Runs when someone edits the sheet; only Status and Pin changes trigger a post. */
function onNewsSheetEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  var head = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var c1 = e.range.getColumn(), c2 = e.range.getLastColumn();
  for (var c = c1; c <= c2; c++) {
    var h = String(head[c - 1]).toLowerCase();
    if (h === 'status' || h.indexOf('pin') === 0) { Utilities.sleep(3000); syncNewsNow(); return; }
  }
}

function syncNewsNow() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(60000)) return 'Another sync is running.';
  try {
    var items = buildNews_();
    var content = JSON.stringify(items, null, 2) + '\n';
    var res = ghPut_(NEWS_DATA_PATH, Utilities.base64Encode(content, Utilities.Charset.UTF_8),
                     'News: sync from the News & Events form', content);
    var msg = res === 'same' ? 'News is already up to date. Nothing changed.' :
      'Sent ' + items.length + ' news item(s) to the website. Live in a few minutes.';
    Logger.log(msg);
    try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'Website'); } catch (e) {}
    return msg;
  } finally {
    lock.releaseLock();
  }
}

// ---------- Building the list ----------

function buildNews_() {
  var props = PropertiesService.getScriptProperties();
  var ss = props.getProperty('SHEET_ID') ? SpreadsheetApp.openById(props.getProperty('SHEET_ID')) : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()
    .filter(function (s) { return s.getFormUrl(); })[0];
  var values = sheet.getDataRange().getValues();
  var head = values.shift().map(function (h) { return String(h).toLowerCase(); });
  function col(start) {
    for (var i = 0; i < head.length; i++) if (head[i].indexOf(start) === 0 && (start === 'timestamp' || head[i] !== 'timestamp')) return i;
    return -1;
  }
  var C = {
    status: col('status'), pin: col('pin'), headline: col('headline'), date: col('date'), timestamp: col('timestamp'),
    text: col('one or two sentences'), people: col('lab members'), link: col('link'),
    type: col('what kind'), giver: col('who gave'), journal: col('journal'), plain: col('in plain words'),
    authors: col('authors'), meeting: col('conference'), city: col('city'), kind: col('talk or poster?'),
    time: col('time'), place: col('place'), audience: col('who is it for'), signup: col('sign-up'),
    photo: col('photo')
  };
  function v(row, key) { return C[key] < 0 ? '' : row[C[key]]; }
  function s(row, key) { return String(v(row, key) || '').trim(); }

  var today = Utilities.formatDate(new Date(), NEWS_TZ, 'yyyy-MM-dd');
  var members = [];
  try {
    members = JSON.parse(UrlFetchApp.fetch('https://npresearchlab.github.io/form-options.json').getContentText()).members || [];
  } catch (err) { Logger.log('Could not load the member list; names will not be linked.'); }
  var items = [];
  values.forEach(function (row) {
    if (s(row, 'status').toLowerCase() !== 'approved') return;
    var d = v(row, 'date');
    var date = !d ? '' : (d instanceof Date ? Utilities.formatDate(d, NEWS_TZ, 'yyyy-MM-dd') : String(d).slice(0, 10));
    var typeText = s(row, 'type').toLowerCase();
    var type = 'milestone';
    Object.keys(NEWS_TYPES).forEach(function (k) { if (typeText.indexOf(k) === 0) type = NEWS_TYPES[k]; });
    if (type === 'event' && s(row, 'audience').toLowerCase().indexOf('lab only') === 0) return;
    if (type === 'event' && !date) return; // an event needs its date

    var title = s(row, 'headline');
    // No date: shown without one, filed under the year it was submitted (or this year), at the top of that year.
    var ts = v(row, 'timestamp');
    var year = date ? date.slice(0, 4) : Utilities.formatDate(ts instanceof Date ? ts : new Date(), NEWS_TZ, 'yyyy');
    var item = {
      id: slug_(title) + (date ? '-' + date.slice(0, 7) : ''),
      type: type,
      date: date,
      year: year,
      title: title,
      text: s(row, 'text'),
      people: peopleIn_(s(row, 'people'), members),
      pin: v(row, 'pin') === true
    };
    var link = type === 'event' ? (s(row, 'signup') || s(row, 'link')) : s(row, 'link');
    if (link) {
      item.link = /^https?:\/\//.test(link) ? link : 'https://' + link;
      item.link_label = { paper: 'Read the paper', event: 'Sign up', talk: 'See more' }[type] || 'Read more';
    }
    if (type === 'paper') {
      var venue = [s(row, 'authors'), s(row, 'journal')].filter(String).join('. ');
      if (venue) item.venue = venue + ', ' + item.year + '.';
      if (s(row, 'plain')) item.plain = s(row, 'plain');
    }
    if (type === 'talk') {
      var where = [s(row, 'meeting'), s(row, 'city')].filter(String).join(', ');
      if (where) item.venue = (s(row, 'kind') || 'Presented') + ' at ' + where;
    }
    if (type === 'award' && s(row, 'giver')) item.venue = 'From ' + s(row, 'giver');
    if (type === 'event') {
      item.upcoming = date >= today;
      item.when = Utilities.formatDate(d instanceof Date ? d : new Date(date + 'T12:00:00'), NEWS_TZ, 'EEEE, MMMM d') +
                  (s(row, 'time') ? ' · ' + s(row, 'time') : '');
      item.where = s(row, 'place');
    }
    var photoId = driveId_(s(row, 'photo'));
    if (photoId) {
      var path = NEWS_IMG_DIR + item.id + '.jpg';
      if (uploadPhoto_(photoId, path)) item.photo = '/' + path;
    }
    items.push(item);
  });
  function key(x) { return x.year + '-' + (x.date ? x.date.slice(5) : '99-99'); }
  items.sort(function (a, b) { return key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0; });
  return items;
}

/** Names are joined with commas by the form, and some names contain commas ("..., PhD"), so match known names. */
function peopleIn_(text, members) {
  if (!text) return [];
  return members.filter(function (m) { return text.indexOf(m) !== -1; })
    .sort(function (a, b) { return text.indexOf(a) - text.indexOf(b); });
}

function slug_(t) {
  return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'item';
}

function driveId_(url) {
  var m = String(url || '').match(/[-\w]{25,}/);
  return m ? m[0] : null;
}

// ---------- GitHub ----------

function ghHeaders_() {
  return { Authorization: 'Bearer ' + PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
           Accept: 'application/vnd.github+json' };
}

/** Creates or updates a file. With compareText, skips the commit when nothing changed. Returns 'same' or 'sent'. */
function ghPut_(path, base64, message, compareText) {
  var url = 'https://api.github.com/repos/' + NEWS_REPO + '/contents/' + path;
  var sha = null;
  var get = UrlFetchApp.fetch(url + '?ref=' + NEWS_BRANCH, { headers: ghHeaders_(), muteHttpExceptions: true });
  if (get.getResponseCode() === 200) {
    var cur = JSON.parse(get.getContentText());
    sha = cur.sha;
    if (compareText !== undefined && cur.content) {
      var existing = Utilities.newBlob(Utilities.base64Decode(cur.content.replace(/\n/g, ''))).getDataAsString('UTF-8');
      if (existing === compareText) return 'same';
    }
  }
  var body = { message: message, content: base64, branch: NEWS_BRANCH };
  if (sha) body.sha = sha;
  var put = UrlFetchApp.fetch(url, { method: 'put', headers: ghHeaders_(), contentType: 'application/json',
                                     payload: JSON.stringify(body), muteHttpExceptions: true });
  if (put.getResponseCode() >= 300) throw new Error('GitHub said ' + put.getResponseCode() + ': ' + put.getContentText());
  return 'sent';
}

/** Copies a Drive photo to the website once. Returns true if the photo is (now) on the site. */
function uploadPhoto_(fileId, path) {
  var url = 'https://api.github.com/repos/' + NEWS_REPO + '/contents/' + path + '?ref=' + NEWS_BRANCH;
  if (UrlFetchApp.fetch(url, { method: 'get', headers: ghHeaders_(), muteHttpExceptions: true }).getResponseCode() === 200) return true;
  var blob = null;
  try {
    var r = UrlFetchApp.fetch('https://drive.google.com/thumbnail?sz=w1000&id=' + fileId,
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (r.getResponseCode() === 200 && /^image\//.test(r.getHeaders()['Content-Type'] || '')) blob = r.getBlob();
  } catch (err) { /* fall back to the original file */ }
  if (!blob) {
    try { blob = DriveApp.getFileById(fileId).getBlob(); } catch (err) { Logger.log('Could not open photo ' + fileId); return false; }
    if (blob.getBytes().length > 4 * 1024 * 1024) { Logger.log('Photo too large, skipped: ' + fileId); return false; }
  }
  ghPut_(path, Utilities.base64Encode(blob.getBytes()), 'News: add photo');
  return true;
}
