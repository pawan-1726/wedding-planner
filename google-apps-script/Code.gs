/**
 * EverAfter Wedding Planner — Google Apps Script Web App
 * ============================================================
 * Receives POST requests from the website's Contact and
 * Appointment forms, appends each submission as a row in the
 * bound Google Sheet, and emails a notification to the site
 * owner.
 *
 * SETUP
 * -----
 * 1. Create a Google Sheet (any name).
 * 2. Extensions -> Apps Script.
 * 3. Delete any starter code and paste this entire file in.
 * 4. Set NOTIFICATION_EMAIL below to the owner's email address.
 * 5. Deploy -> New deployment -> type "Web app".
 *      Execute as:      Me
 *      Who has access:  Anyone
 * 6. Copy the Web App URL and paste it into config.js on the
 *    website (GOOGLE_SCRIPT_URL).
 *
 * This script automatically creates the "Contact Enquiries" and
 * "Appointment Requests" sheets/tabs and their header rows the
 * first time it runs, so no manual sheet setup is required.
 */

// ---- CONFIGURATION -------------------------------------------------
// Where submission notification emails are sent. Change this to the
// wedding planner's real inbox.
const NOTIFICATION_EMAIL = 'YOUR_EMAIL@example.com';

const CONTACT_SHEET_NAME = 'Contact Enquiries';
const APPOINTMENT_SHEET_NAME = 'Appointment Requests';

const CONTACT_HEADERS = ['Timestamp', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Source'];
const APPOINTMENT_HEADERS = [
  'Timestamp', 'First Name', 'Last Name', 'Email', 'Phone', 'Wedding Date',
  'Guest Count', 'Package', 'Consultation Mode', 'Message', 'Consent', 'Source'
];
// ---------------------------------------------------------------------

/**
 * Entry point for all POST requests from the website.
 * @param {GoogleAppsScript.Events.DoPost} e
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ result: 'error', message: 'No data received.' });
    }

    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ result: 'error', message: 'Invalid JSON payload.' });
    }

    if (!data || typeof data !== 'object') {
      return jsonResponse({ result: 'error', message: 'Invalid payload.' });
    }

    const type = String(data.type || '').toLowerCase();

    if (type === 'contact') {
      return handleContact(data);
    }
    if (type === 'appointment') {
      return handleAppointment(data);
    }

    return jsonResponse({ result: 'error', message: 'Unknown submission type.' });
  } catch (err) {
    return jsonResponse({ result: 'error', message: 'Server error: ' + err.message });
  }
}

/**
 * Handles a Contact form submission: validates, appends a row,
 * and emails the owner.
 * @param {Object} data Parsed request payload.
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function handleContact(data) {
  const name = sanitize(data.name);
  const email = sanitize(data.email);
  const phone = sanitize(data.phone);
  const subject = sanitize(data.subject);
  const message = sanitize(data.message);
  const source = sanitize(data.source) || 'contact.html';

  if (!name || !email || !subject || !message) {
    return jsonResponse({ result: 'error', message: 'Missing required contact fields.' });
  }
  if (!isValidEmail(email)) {
    return jsonResponse({ result: 'error', message: 'Invalid email address.' });
  }

  const sheet = getOrCreateSheet(CONTACT_SHEET_NAME, CONTACT_HEADERS);
  const timestamp = new Date();
  sheet.appendRow([timestamp, name, email, phone, subject, message, source]);

  sendNotificationEmail(
    'New Contact Enquiry — EverAfter',
    'NEW CONTACT ENQUIRY\n\n' +
      'Name: ' + name + '\n' +
      'Email: ' + email + '\n' +
      'Phone: ' + (phone || '-') + '\n' +
      'Subject: ' + subject + '\n' +
      'Message: ' + message + '\n\n' +
      'Received: ' + timestamp.toString()
  );

  return jsonResponse({ result: 'success' });
}

/**
 * Handles an Appointment form submission: validates, appends a
 * row, and emails the owner.
 * @param {Object} data Parsed request payload.
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function handleAppointment(data) {
  const firstName = sanitize(data.firstName);
  const lastName = sanitize(data.lastName);
  const email = sanitize(data.email);
  const phone = sanitize(data.phone);
  const weddingDate = sanitize(data.weddingDate);
  const guestCount = sanitize(data.guestCount);
  const pkg = sanitize(data.package);
  const consultMode = sanitize(data.consultMode);
  const message = sanitize(data.message);
  const consent = data.consent === true || String(data.consent).toLowerCase() === 'true';
  const source = sanitize(data.source) || 'appointment.html';

  if (!firstName || !lastName || !email || !phone || !guestCount || !pkg || !consultMode || !consent) {
    return jsonResponse({ result: 'error', message: 'Missing required appointment fields.' });
  }
  if (!isValidEmail(email)) {
    return jsonResponse({ result: 'error', message: 'Invalid email address.' });
  }

  const sheet = getOrCreateSheet(APPOINTMENT_SHEET_NAME, APPOINTMENT_HEADERS);
  const timestamp = new Date();
  sheet.appendRow([
    timestamp, firstName, lastName, email, phone, weddingDate,
    guestCount, pkg, consultMode, message, consent ? 'Yes' : 'No', source
  ]);

  sendNotificationEmail(
    'New Appointment Request — EverAfter',
    'NEW APPOINTMENT REQUEST\n\n' +
      'Name: ' + firstName + ' ' + lastName + '\n' +
      'Email: ' + email + '\n' +
      'Phone: ' + phone + '\n' +
      'Wedding Date: ' + (weddingDate || 'Not specified') + '\n' +
      'Guest Count: ' + guestCount + '\n' +
      'Package: ' + pkg + '\n' +
      'Consultation Mode: ' + consultMode + '\n' +
      'Message: ' + (message || '-') + '\n\n' +
      'Received: ' + timestamp.toString()
  );

  return jsonResponse({ result: 'success' });
}

/**
 * Returns the named sheet, creating it (and writing its header
 * row) if it doesn't already exist.
 * @param {string} name Sheet/tab name.
 * @param {string[]} headers Header row to write on creation.
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Sends the notification email to NOTIFICATION_EMAIL. Failures
 * are logged but never thrown, so a submission still succeeds
 * (and is saved to the sheet) even if email delivery fails.
 * @param {string} subject
 * @param {string} body
 */
function sendNotificationEmail(subject, body) {
  try {
    if (!NOTIFICATION_EMAIL || NOTIFICATION_EMAIL.indexOf('YOUR_EMAIL') === 0) return;
    MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
  } catch (err) {
    console.error('Failed to send notification email: ' + err.message);
  }
}

/**
 * Trims a value to a plain string, returning '' for null/undefined.
 * @param {*} value
 * @return {string}
 */
function sanitize(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Very light email format check — not exhaustive, just catches
 * obviously malformed input.
 * @param {string} email
 * @return {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Builds a JSON text response.
 * @param {Object} obj
 * @return {GoogleAppsScript.Content.TextOutput}
 */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Simple GET handler so visiting the Web App URL in a browser
 * shows a friendly message instead of an error.
 */
function doGet() {
  return ContentService
    .createTextOutput('EverAfter form endpoint is running. Send a POST request with form data.')
    .setMimeType(ContentService.MimeType.TEXT);
}
