# Architecture — Gov Smart City (Smart Citizen MVP)

This document describes the MVP architecture for a **Smart Citizen reporting system** built as a **Telegram Bot + Web form**, backed by **Google Sheets**, with **Apps Script notifications** and optional **AI classification**.

---

## 1) Components

### 1.1 Citizen Interfaces
- **Telegram Bot**
  - Main channel for submitting and tracking requests.
  - Captures description, location (geo or manual address), optional photo.
- **Web Form (optional)**
  - Same fields as Telegram.
  - Sends requests to the same backend endpoint.

### 1.2 Storage / Operator Console
- **Google Sheets**
  - Single source of truth for all requests.
  - Operators (Akimat/dispatch) edit status, assignment, and comments directly.
  - Multiple operators can work simultaneously.

### 1.3 Automation / Backend Glue
- **Google Apps Script**
  - Provides an HTTP endpoint (Web App) for creating new rows in Sheets.
  - Sends Telegram notifications to citizens when request status changes (trigger).

### 1.4 Optional Intelligence Layer
- **AI Classification**
  - Categorizes requests and sets priority from free-text description.
  - Adds `confidence` score and `tags`.
  - Low-confidence requests are flagged as `Unsorted`.

---

## 2) Data Model (Google Sheets)

The main worksheet tab is `Requests`.

**Required fields for MVP:**
- `request_id`
- `created_at`
- `chat_id`
- `description`
- `status`

**Recommended fields:**
- `category`, `priority`, `confidence`
- `lat`, `lng`, `address_text`
- `photo_file_id`
- `assigned_to`
- `public_comment`
- `status_updated_at`

> The bot uses `chat_id` to show "My requests" and to send notifications.

---

## 3) Core Flows

### 3.1 Flow A — Citizen creates a request (Telegram)
1. User taps **Send new request**
2. Bot asks for **description**
3. Bot asks for **location** (two options):
   - Share **geolocation**
   - Enter **address manually**
4. Bot asks for **photo** (optional) or Skip
5. Bot shows **confirmation card**
6. User confirms
7. Bot sends request payload to **Apps Script Web App**
8. Apps Script writes a new row to **Google Sheets**
9. Bot replies: **“Request accepted”** + `request_id`

3.2 Flow B — Operator updates status (Google Sheets)

Operator opens Requests sheet

Operator updates:

status (New / In progress / Need info / Done / Rejected)

public_comment (optional but recommended)

Apps Script onEdit trigger detects status change

Script sends Telegram message to the citizen using stored chat_id

Notification (example):

Status updated: In progress

Request ID: SC-1042

Comment: Road team assigned

3.3 Flow C — Citizen views own requests

User taps My requests

Bot queries Google Sheets (via Apps Script endpoint) by chat_id

Bot returns a list:

request_id, status, category, short description, last update time

User selects an item to see details (optional)

4) AI Classification (Optional for MVP)
4.1 Purpose

Automatically fill:

category (Roads / Lighting / Trash / …)

priority (Low / Medium / High)

confidence (0–1)

tags (keywords)

4.2 Safety

If confidence < threshold → set category = Unsorted

Operator can override any AI output in Sheets.

4.3 Integration options

Option 1 (simple): bot calls AI before sending to Sheets

Option 2 (cleaner): Apps Script calls AI after row creation (but needs API key handling)

For hackathon MVP, Option 1 is usually faster to implement.

5) Transparency / Public View (Optional)

If you need public transparency:

Create a separate sheet/tab/view without personal data.

Remove or do not publish:

chat_id, phone, user_name, exact house number, raw photos

Recommended public fields:

created_at, category, status, approximate area, aggregated counts

6) Security & Reliability
6.1 Secrets

Never commit tokens.

Use .env locally and .env.example in repo.

Apps Script endpoint should validate:

APPS_SCRIPT_SHARED_SECRET (simple shared secret)

6.2 Anti-spam (MVP)

Rate limit: e.g. <= 3 requests / 10 minutes / chat_id

Reject empty descriptions or missing location

Optionally filter profanity

6.3 Failure handling

If Sheets write fails → bot returns a clear error and suggests retry.

If notification fails → keep system consistent (status change stays).

7) Minimal Deployment Plan (Hackathon-Friendly)

Telegram Bot:

Run locally on laptop during demo, or deploy to a small VPS.

Apps Script:

Deployed as Web App (stable and simple).

Google Sheets:

Shared with operator accounts.

8) Demo Checklist

 Bot creates request → row appears in Sheets

 Operator changes status → citizen receives notification

 Citizen sees updated status in “My requests”

 (Optional) AI fills category/priority with confidence

 (Optional) Anti-spam blocks rapid spam submissions

**Payload (example):**
```json
{
  "chat_id": 123456789,
  "description": "Big pothole near school",
  "lat": 54.87,
  "lng": 69.15,
  "address_text": "Petropavl, Abay st 10",
  "photo_file_id": "AgACAgIAAxkBAA...",
  "user_name": "Ami"
}


