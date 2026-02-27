# Demo Script — Smart Citizen MVP (Telegram Bot + Google Sheets)

This is a step-by-step demo plan to present the MVP clearly and reliably in 3–5 minutes.

---

## 0) Pre-demo checklist (5 minutes before)
- [ ] Telegram bot is running (local laptop or server)
- [ ] Google Sheet is open on operator laptop (tab: `Requests`)
- [ ] Apps Script trigger is enabled (status change → Telegram notification)
- [ ] Test message works: change any test row status and confirm notification arrives
- [ ] Sheet columns match `docs/SHEET_SCHEMA.md`

**Roles in demo (recommended):**
- **Presenter A** — Telegram (Citizen)
- **Presenter B** — Google Sheets (Operator)

---

## 1) Opening (15–20 sec)
Say:
- “Citizens report issues via Telegram or web.”
- “All requests go into Google Sheets where operators manage them.”
- “When an operator updates status, the citizen gets an instant Telegram notification.”

---

## 2) Citizen creates a request (60–90 sec)
**Presenter A (Telegram):**
1. Open bot → `/start`
2. Show main menu:
   - `Send new request`
   - `My requests`
   - `Profile` (optional)
3. Tap `Send new request`
4. Enter description example:
   - “Большая яма возле школы, опасно для машин”
5. Choose location:
   - Option 1: `Enter address manually`
     - “Петропавл, ул. Абая 10”
   - (Optional) show that `Share geolocation` also exists
6. Upload photo (or skip)
7. Bot shows confirmation card (summary)
8. Tap `Confirm`
9. Bot replies: “Request accepted” + `request_id`

**Expected outcome:**
- You have a `request_id` shown to the citizen.

---

## 3) Operator receives it in Sheets (20–40 sec)
**Presenter B (Google Sheets):**
1. Refresh / show the `Requests` sheet
2. Show the new row appeared:
   - `request_id`
   - `description`
   - `category/priority` (if AI enabled) or `Unsorted`
   - `status = New`
3. Mention:
   - “This is a single operator console; multiple staff can work here together.”

---

## 4) Operator updates status → citizen notified (60–90 sec)
**Presenter B:**
1. Change `status` from `New` → `In progress`
2. (Optional) Fill `public_comment`, e.g.:
   - “Передано дорожной службе, выезд сегодня”
3. Wait 1–2 seconds (trigger)

**Presenter A:**
4. Show Telegram notification:
   - `Request ID: ...`
   - `Status: In progress`
   - `Comment: ...`

Repeat once more (strong finish):
- `status` → `Done`
- `public_comment` → “Яма заделана, спасибо за обращение”
- Show Telegram notification again.

---

## 5) Citizen checks “My requests” (30–45 sec)
**Presenter A:**
1. Tap `My requests`
2. Show list with:
   - request IDs
   - statuses (now “Done”)
3. Open the request details (if implemented) to show comment.

---

## 6) (Optional) AI Classification moment (20–40 sec)
Only if implemented:
- Point at `category`, `priority`, `confidence`.
- Say:
  - “If confidence is low, the system flags it as `Unsorted` for manual review.”

---

## 7) Close (15–25 sec)
Say:
- “We closed the entire loop: citizen → dispatch → status updates → citizen feedback.”
- “Next steps: public statistics, heatmaps, and a proper admin panel.”

---

## Backup Plan (if something fails during demo)
If Apps Script notifications fail:
- Still show:
  - request creation
  - row in Sheets
  - status changes
  - citizen sees updated status in `My requests` (polling/manual refresh)

If AI fails:
- Keep `AI_ENABLED=false`
- Show manual category selection by operator in Sheets

---
