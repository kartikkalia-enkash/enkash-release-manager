# EnKash Release Mail Assistant (Chrome Extension)

Chrome extension to generate Gmail deployment approval drafts with a consistent HTML template, prefilled defaults, and per-application version tracking.

## What it does

- Opens Gmail compose and fills:
  - To / Cc
  - Subject
  - Fully formatted HTML body (release table)
- Prefills repetitive fields from saved defaults.
- Keeps version mapping by application (`versionByApp`) in synced extension storage.
- Supports semantic version bump in popup (`patch`, `minor`, `major`).
- Leaves **Merge Requests** and ticket-style details editable each run.

## Install locally

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder (`enkash-release-manager`)
5. Pin extension to toolbar

## Usage

1. Open Gmail (`https://mail.google.com`) and stay on that tab.
2. Click extension icon.
3. Fill or adjust fields.
4. Click **Create Gmail draft**.
5. Review draft and send.

## Version sync strategy

### Current implementation

- Uses `chrome.storage.sync`.
- Good for per-user convenience (syncs across the same user's Chrome profile).
- Not a perfect global lock for all teammates.

### If you need strict team-wide version consistency

Use a shared backend and read/write versions there before draft creation.
Recommended options:

- Internal release-service API (best for audit + control)
- Google Sheet + Apps Script API (quick start)
- Firebase / Supabase table with simple auth rules

In that setup, extension should:
1. Fetch latest version by app from backend.
2. Apply bump rule.
3. Reserve/update version server-side (transaction/lock).
4. Create draft using returned final version.

## Files

- `manifest.json` - MV3 extension manifest.
- `popup.html`, `popup.css`, `popup.js` - main UI + actions.
- `content-script.js` - injects data into Gmail compose window.
- `template.js` - template defaults, date/version helpers, HTML builder.
- `background.js` - seeds defaults on install.
- `options.html` - advanced JSON settings editor.
