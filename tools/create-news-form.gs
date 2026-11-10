/**
 * Creates the NPRL News & Events form and its responses sheet in the "3 - News & Events" Drive folder.
 *
 * How to use (signed in as nprl.emory@gmail.com, so the lab account owns everything):
 *   1. Go to https://script.google.com and click "New project". Name it "NPRL news form".
 *   2. Delete what's there, paste this whole file in, and click Save.
 *   3. Choose "createNewsForm" at the top and click Run. Allow access when Google asks.
 *   4. Open the Execution log for the links to the form and the responses sheet.
 *   5. In the form editor, replace the yellow "ADD A FILE UPLOAD QUESTION HERE" note with a
 *      File upload question (Apps Script can't create upload questions).
 *
 * What it sets up:
 *   - The form, with follow-up questions that depend on the type of news.
 *   - A responses sheet with two extra columns at the left: Status (Pending, Approved, Hidden)
 *     and Pin (keeps an item on the home page). New responses start as Pending.
 *   - The "Lab members involved" checkboxes are filled from the website
 *     (https://npresearchlab.github.io/form-options.json) and refreshed every night, so the list
 *     follows the People page. Run "syncNewsFormMembers" to refresh right away.
 *
 * Nothing here posts to the website. The website sync (Approved items only) is a separate step.
 */
var FOLDER_ID = '1nBadfpTSR7Zt1RI0oqcON0zppNgdurtC'; // NPRL Drive > ... > 3 - News & Events
var OPTIONS_URL = 'https://npresearchlab.github.io/form-options.json';
var MEMBERS_TITLE = 'Lab members involved';

function createNewsForm() {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var form = FormApp.create('NPRL News & Events');
  form.setDescription(
    'Share lab news for the website: awards, papers, talks, milestones, outreach, upcoming events, ' +
    'and personal news ("Lab life"). Every item is checked before it goes on the website. ' +
    'Takes about 2 minutes. This form is for lab members only; please don\'t share the link.');
  form.setCollectEmail(true);
  form.setProgressBar(true);
  form.setConfirmationMessage('Thanks! Your news will appear on the website once it has been approved.');

  // ---- Section 1: everyone ----
  form.addTextItem().setTitle('Your name').setRequired(true);
  form.addTextItem().setTitle('Headline').setRequired(true)
    .setHelpText('Short, in plain words, with the person\'s full name. ' +
                 'e.g. "Iran Gutierrez named a Centennial Scholar" or "Five new members join the lab".');
  form.addDateItem().setTitle('Date').setRequired(true)
    .setHelpText('When it happened. For an upcoming event, the event date. If you only know the month, pick the 1st.');
  form.addParagraphTextItem().setTitle('One or two sentences of detail').setRequired(true)
    .setHelpText('Written for the public, in the third person (up to 300 characters). For Lab life, this is your caption.')
    .setValidation(FormApp.createParagraphTextValidation().requireTextLengthLessThanOrEqualTo(300).build());
  form.addCheckboxItem().setTitle(MEMBERS_TITLE).setChoiceValues(['(loading)'])
    .setHelpText('Their names will link to their People cards.');
  form.addTextItem().setTitle('Link (optional)')
    .setHelpText('A paper, news story, poster, or event page.');
  form.addSectionHeaderItem().setTitle('ADD A FILE UPLOAD QUESTION HERE: "Photo (optional; required for Lab life)"')
    .setHelpText('One image, any shape; it gets cropped. (Replace this note with a File upload question, then delete the note.)');
  var type = form.addMultipleChoiceItem().setTitle('What kind of news is this?').setRequired(true);

  // ---- Follow-up sections, one per type ----
  var award = form.addPageBreakItem().setTitle('Award or honor');
  form.addTextItem().setTitle('Who gave the award?').setHelpText('e.g. American Heart Association').setRequired(true);

  var paper = form.addPageBreakItem().setTitle('Paper');
  form.addTextItem().setTitle('Journal').setRequired(true);
  form.addParagraphTextItem().setTitle('In plain words: what did you find, and why does it matter?').setRequired(true)
    .setHelpText('One or two sentences for someone outside the field. This is what lets a paper be the Featured paper.')
    .setValidation(FormApp.createParagraphTextValidation().requireTextLengthLessThanOrEqualTo(400).build());
  form.addTextItem().setTitle('Authors').setHelpText('As cited, e.g. Bassil Y, Borich MR');

  var talk = form.addPageBreakItem().setTitle('Talk or poster');
  form.addTextItem().setTitle('Conference or meeting').setHelpText('e.g. Society for Neuroscience').setRequired(true);
  form.addTextItem().setTitle('City');
  var kind = form.addMultipleChoiceItem().setTitle('Talk or poster?').setRequired(true);
  kind.setChoiceValues(['Talk', 'Poster', 'Symposium or panel']);

  var event = form.addPageBreakItem().setTitle('Upcoming event');
  form.addTextItem().setTitle('Time').setHelpText('e.g. 2–4 pm');
  form.addTextItem().setTitle('Place').setRequired(true);
  var pub = form.addMultipleChoiceItem().setTitle('Who is it for?').setRequired(true)
    .setHelpText('Lab-only events are never posted.');
  pub.setChoiceValues(['Open to the public', 'Lab only']);
  form.addTextItem().setTitle('Sign-up or event link (optional)');

  var life = form.addPageBreakItem().setTitle('Lab life')
    .setHelpText('Personal news: a race, a new pet, a wedding, a new baby, a recital, anything you\'re proud of.');
  form.addCheckboxItem().setTitle('Permission').setRequired(true)
    .setChoiceValues(['This is my own news, and everyone in the photo is OK with it being posted.']);

  // ---- Branching ----
  var S = FormApp.PageNavigationType.SUBMIT;
  type.setChoices([
    type.createChoice('Award or honor', award),
    type.createChoice('Paper', paper),
    type.createChoice('Talk or poster', talk),
    type.createChoice('Milestone (defense, graduation, new job, new member)', S),
    type.createChoice('Outreach', S),
    type.createChoice('Upcoming event', event),
    type.createChoice('Lab life (personal news)', life)
  ]);
  // A page break's "go to" applies to the section just BEFORE it: each follow-up section ends the form.
  paper.setGoToPage(S);  // after Award
  talk.setGoToPage(S);   // after Paper
  event.setGoToPage(S);  // after Talk or poster
  life.setGoToPage(S);   // after Upcoming event

  // ---- Responses sheet with Status and Pin columns ----
  var ss = SpreadsheetApp.create('NPRL News & Events (Responses)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();
  var sheet = ss.getSheets().filter(function (s) { return s.getFormUrl(); })[0] || ss.getSheets()[0];
  sheet.insertColumnsBefore(1, 2);
  sheet.getRange(1, 1, 1, 2).setValues([['Status', 'Pin to home page']]).setFontWeight('bold');
  sheet.getRange('A2:A').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Approved', 'Hidden'], true).build());
  sheet.getRange('B2:B').insertCheckboxes();
  sheet.setFrozenRows(1);
  ss.getSheets().forEach(function (s) { if (s.getSheetId() !== sheet.getSheetId() && s.getLastRow() === 0) ss.deleteSheet(s); });

  // ---- Move both into the News & Events folder ----
  DriveApp.getFileById(form.getId()).moveTo(folder);
  DriveApp.getFileById(ss.getId()).moveTo(folder);

  // ---- Remember IDs, fill the member list, and schedule the triggers ----
  var props = PropertiesService.getScriptProperties();
  props.setProperty('FORM_ID', form.getId());
  props.setProperty('SHEET_ID', ss.getId());
  syncNewsFormMembers();
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncNewsFormMembers').timeBased().everyDays(1).atHour(3).create();
  ScriptApp.newTrigger('markNewResponsePending').forSpreadsheet(ss).onFormSubmit().create();

  Logger.log('Edit the form:      ' + form.getEditUrl());
  Logger.log('Share with the lab: ' + form.getPublishedUrl());
  Logger.log('Responses sheet:    ' + ss.getUrl());
}

/** New responses start as Pending; someone staying in the lab changes them to Approved. */
function markNewResponsePending(e) {
  var row = e.range.getRow();
  var cell = e.range.getSheet().getRange(row, 1);
  if (!cell.getValue()) cell.setValue('Pending');
}

/** Refreshes "Lab members involved" from the website's People page. Runs nightly. */
function syncNewsFormMembers() {
  var id = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (!id) throw new Error('Run createNewsForm first.');
  var form = FormApp.openById(id);
  var data = JSON.parse(UrlFetchApp.fetch(OPTIONS_URL).getContentText());
  if (!data.members || !data.members.length) return;
  var n = 0;
  form.getItems(FormApp.ItemType.CHECKBOX).forEach(function (item) {
    if (item.getTitle() === MEMBERS_TITLE) { item.asCheckboxItem().setChoiceValues(data.members); n++; }
  });
  Logger.log('Updated ' + n + ' question(s) with ' + data.members.length + ' lab members.');
}
