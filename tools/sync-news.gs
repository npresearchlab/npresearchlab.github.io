/**
 * Sends approved rows from "NPRL News & Events (Responses)" to the website.
 *
 * Add this file to the "NPRL news form" Apps Script project (the one that created the form):
 *   1. In the project, click + next to Files > Script, name it "sync-news", paste this whole file in, Save.
 *   2. Project Settings (gear) > Script properties > Add property:
 *        GITHUB_TOKEN = the same token value as the alumni sync ("NPRL archive sync").
 *      SHEET_ID is already there from createNewsForm.
 *   3. Choose "setupNewsSync" at the top and click Run. Allow access when Google asks.
 *
 * From then on:
 *   - Changing a row's Status (or Pin) in the sheet posts the change within a minute or two.
 *   - It also runs every night, so upcoming events move into the feed once their date passes.
 *   - Run "syncNewsNow" any time to post right away.
 *
 * Only rows with Status = Approved and a Date are posted. Lab-only events are never posted.
 * Photos are copied to the website once (resized by Google to about 1000px wide).
 * When the GitHub token expires (Nov 2027), renew it as described in the README Google Doc and
 * update GITHUB_TOKEN here as well as in the alumni sync.
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

function setupNewsSync() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('GITHUB_TOKEN')) throw new Error('Add GITHUB_TOKEN in Project Settings > Script properties first.');
  var ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
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
    return msg;
  } finally {
    lock.releaseLock();
  }
}

// ---------- Building the list ----------

function buildNews_() {
  var props = PropertiesService.getScriptProperties();
  var sheet = SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getSheets()
    .filter(function (s) { return s.getFormUrl(); })[0];
  var values = sheet.getDataRange().getValues();
  var head = values.shift().map(function (h) { return String(h).toLowerCase(); });
  function col(start) {
    for (var i = 0; i < head.length; i++) if (head[i].indexOf(start) === 0 && head[i] !== 'timestamp') return i;
    return -1;
  }
  var C = {
    status: col('status'), pin: col('pin'), headline: col('headline'), date: col('date'),
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
    if (!d) return;
    var date = d instanceof Date ? Utilities.formatDate(d, NEWS_TZ, 'yyyy-MM-dd') : String(d).slice(0, 10);
    var typeText = s(row, 'type').toLowerCase();
    var type = 'milestone';
    Object.keys(NEWS_TYPES).forEach(function (k) { if (typeText.indexOf(k) === 0) type = NEWS_TYPES[k]; });
    if (type === 'event' && s(row, 'audience').toLowerCase().indexOf('lab only') === 0) return;

    var title = s(row, 'headline');
    var item = {
      id: slug_(title) + '-' + date.slice(0, 7),
      type: type,
      date: date,
      year: date.slice(0, 4),
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
  items.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
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
