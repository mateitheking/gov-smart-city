# Environment Setup

This project uses environment variables to configure the Telegram bot, Google Sheets integration, Apps Script endpoints, and optional AI classification.

> **Security rule:** never commit secrets.  
> Use `.env` locally and keep it in `.gitignore`. Commit only `.env.example`.

---

## 1) Required tools/accounts
- Telegram account (to create a bot via **@BotFather**)
- Google account (to create/edit **Google Sheets** and **Google Apps Script**)
- (Optional) OpenAI API key (for AI classification)

---

## 2) Files
- `.env.example` — template (committed)
- `.env` — local secrets (NOT committed)

## 3) Variables
3.1 Telegram Bot (required)

TELEGRAM_BOT_TOKEN
Where to get: @BotFather → /newbot → token
Example: 123456:ABC-DEF...

TELEGRAM_BOT_USERNAME (recommended)
Bot username without @
Example: SmartCitizenBot

3.2 Google Sheets (required)

GOOGLE_SHEET_ID
The ID from the Google Sheets URL:
https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit...

REQUESTS_SHEET_NAME
Worksheet tab name used for requests.
Default: Requests

3.3 Apps Script Web App (recommended for MVP)

Purpose: stable and simple backend glue:

bot/web → Apps Script Web App → writes to Sheets

Sheet edits → Apps Script trigger → Telegram notifications

APPS_SCRIPT_WEBAPP_URL
Deployed Apps Script Web App URL (ends with /exec).

APPS_SCRIPT_SHARED_SECRET
Shared secret to protect the endpoint from random spam.
The bot sends it with every request; Apps Script rejects requests without it.

If you are not using a Web App endpoint yet, you can leave these empty temporarily,
but the recommended MVP uses this approach.

3.4 AI Classification (optional)

OPENAI_API_KEY
API key for AI classification (if enabled).

OPENAI_MODEL
Model name used by the classifier.
Default: gpt-4o-mini

AI_ENABLED
Turn AI on/off.
Values: true or false
Default: false

AI_CONFIDENCE_THRESHOLD
If confidence is below this value → set category = Unsorted.
Default: 0.6

3.5 Web / App URLs (optional)

APP_BASE_URL
Local base URL for development.
Default: http://localhost:3000

PUBLIC_BASE_URL
Public URL used in demo or deployment (if any).
Example: https://your-domain.com

3.6 Runtime (recommended)

NODE_ENV
Default: development

TZ
Timezone for consistent timestamps.
Recommended: Asia/Almaty

## 4) Minimal “works for demo” config


TELEGRAM_BOT_TOKEN

GOOGLE_SHEET_ID

REQUESTS_SHEET_NAME

APPS_SCRIPT_WEBAPP_URL

APPS_SCRIPT_SHARED_SECRET

AI can be disabled (AI_ENABLED=false) and added later.

5) Troubleshooting

doesn’t start: check TELEGRAM_BOT_TOKEN and internet access.

Requests not appearing in Sheets: verify GOOGLE_SHEET_ID, REQUESTS_SHEET_NAME, and Apps Script deployment permissions.

Notifications not sent: ensure the Apps Script installable trigger is created and status edits are in the correct column.

Wrong time in timestamps: set TZ=Asia/Almaty and confirm Apps Script project timezone matches.


### Create `.env`
Copy and fill in:
```bash
cp .env.example .env
