# EverAfter Wedding Planner — Setup Guide

This guide covers everything you need to do **after development** to get
the new EverAfter Assistant chatbot and the Google Sheets form backend
working on your live site.

---

## 1. What changed

### Summary
- Added a client-side, non-AI **"EverAfter Assistant"** chatbot, available
  on all 7 pages, styled to match the existing gold/cream wedding theme.
- Connected the existing **Contact** and **Appointment** forms to
  **Google Sheets** (via a Google Apps Script Web App) so submissions are
  saved automatically and you get an email notification.
- No existing functionality (navbar, dark mode, page loader, scroll
  animations, counters, gallery, package cards, `#scroll-top`) was
  changed or removed.

### Files modified
| File | What changed |
|---|---|
| `main.js` | Imports the chatbot and site config; adds `window.everafterSubmitForm()`, the shared function both forms use to send data to Google Sheets. |
| `style.css` | Added chatbot widget styles; added `.form-error` styling; shifted `#scroll-top` right so it never overlaps the chat bubble. |
| `contact.html` | Added an error message box; submit handler now sends valid submissions to Google Sheets and shows a loading/success/error state. Existing validation and design untouched. |
| `appointment.html` | Same as above, plus keeps the existing wedding-date and guest-count validation intact. |

### Files created
| File | Purpose |
|---|---|
| `chatbot.js` | The entire chatbot: predefined Q&A data (`chatbotResponses`), UI injection, quick replies, keyword matching, accessibility. Edit this file to change what the bot says. |
| `config.js` | The **one** place you paste your Google Apps Script Web App URL. |
| `google-apps-script/Code.gs` | The complete Apps Script code you'll paste into the Apps Script editor (see Step 3 below). This file lives outside the Vite build — it's not deployed with `npm run build`, it's pasted directly into Google. |
| `SETUP.md` | This guide. |

`package.json` and `vite.config.js` were **not** touched.

---

## 2. Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it whatever you like, e.g. "EverAfter Enquiries".
2. You do **not** need to manually create tabs or headers — the script
   in Step 3 creates the **Contact Enquiries** and **Appointment Requests**
   tabs (with header rows) automatically the first time each form is
   submitted.

---

## 3. Add the Apps Script

1. In your new Sheet, click **Extensions → Apps Script**.
2. Delete any starter code in the editor.
3. Open `google-apps-script/Code.gs` from this project and paste its
   entire contents into the Apps Script editor.
4. Near the top of the file, find this line:
   ```js
   const NOTIFICATION_EMAIL = 'YOUR_EMAIL@example.com';
   ```
   Replace it with the email address that should receive new-enquiry
   and new-appointment notifications.
5. Click the **Save** icon (or `Ctrl/Cmd + S`).

---

## 4. Deploy it as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**.
5. Google will ask you to authorize the script — approve the permissions
   (this is you authorizing your own script to edit your own sheet and
   send email on your behalf).
6. Copy the **Web app URL** shown after deployment. It looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

> **Important:** this is the Apps Script **Web App URL**, not the normal
> Google Sheet URL in your browser's address bar. A regular Sheet URL
> can't be written to directly from website JavaScript — the Web App is
> what makes that possible, securely, without exposing any credentials.

If you ever edit `Code.gs` again, you'll need to **Deploy → Manage
deployments → Edit (pencil icon) → New version → Deploy** for the changes
to take effect on the live URL.

---

## 5. Paste the URL into the website

Open `config.js` in the project root and replace the placeholder:

```js
export const GOOGLE_SCRIPT_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
```

with your real Web App URL:

```js
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```

This is the **only** file/line you need to touch to connect both forms.

---

## 6. Run it locally

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`) and test:

- **Chatbot:** click the 💬 bubble bottom-right on any page, try the
  quick-reply buttons, and try typing a question like "how much does
  wedding planning cost?".
- **Contact form** (`contact.html`): submit a valid message.
- **Appointment form** (`appointment.html`): submit a valid request.
- Check your Google Sheet — a new row should appear in **Contact
  Enquiries** or **Appointment Requests** within a couple of seconds.
- Check the notification inbox for the email.

---

## 7. Build for production

```bash
npm run build
```

This produces the `dist/` folder exactly as before — the chatbot and
form logic are bundled in automatically since they're imported from
`main.js`, which every page already loads. Deploy `dist/` the same way
you already do (e.g. `npm run deploy` for GitHub Pages, per the existing
`package.json` script).

---

## 8. Testing checklist

**Chatbot**
- [ ] Opens / closes via the bubble and the ✕ button
- [ ] `Esc` closes it, focus returns to the bubble
- [ ] Quick-reply buttons produce an answer
- [ ] Typed questions match keywords correctly
- [ ] Unmatched questions show the fallback message
- [ ] Links in answers go to the right page
- [ ] Looks correct in both light and dark mode
- [ ] Doesn't visually collide with `#scroll-top`

**Contact form**
- [ ] Client-side validation still blocks invalid submissions
- [ ] Valid submission appears in the "Contact Enquiries" tab
- [ ] Notification email arrives
- [ ] Success message shows, form resets
- [ ] If the Apps Script URL is unreachable, an error shows and the
      form does **not** reset

**Appointment form**
- [ ] Wedding-date and guest-count validation still work
- [ ] Valid submission appears in the "Appointment Requests" tab
- [ ] Notification email arrives
- [ ] Success message shows, form resets
- [ ] Failed submission keeps the entered data and shows an error

---

## 9. Limitations & notes

- The chatbot is **fully static** — it only recognizes the predefined
  keywords in `chatbot.js`. It never calls any AI service and never
  claims to be AI.
- The Apps Script Web App has no authentication beyond "Anyone can call
  this URL" — this is normal for this kind of simple setup, but it does
  mean anyone who has the URL could POST data to your sheet. The script
  validates required fields and email format, but there's no rate
  limiting. For a college/personal project this is an acceptable
  trade-off; for higher-traffic production use you'd typically add
  reCAPTCHA or a similar layer.
- Requests are sent with a `Content-Type: text/plain` header on purpose
  (see the comment in `main.js`) — this avoids a CORS preflight request
  that Apps Script Web Apps don't handle well. The body is still valid
  JSON and is parsed as JSON on the Apps Script side.
- Email notifications are sent via `MailApp`, which uses your Google
  account's daily email quota (plenty for a project like this, but
  worth knowing).
