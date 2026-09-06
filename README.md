# Bishi Manager

A simple local web app to manage a monthly **Bishi** (Bhishi) group — track members, spin a wheel to pick the monthly winner, and keep payout history. Everything is stored in your browser using **IndexedDB** (no backend, no login).

## Features

- Add previous month winner records for an already-started Bishi
- Current month advances automatically from the latest recorded winner

- Create a Bishi with name, monthly amount, start month, and member count
- Add member names
- Spinning wheel to randomly pick an eligible winner
- Confirm or cancel the result before saving
- **Spin PIN** — 4–6 digit PIN required to spin the wheel (set at creation)
- Winners are removed from future draws (one win per cycle)
- Monthly winner history table
- Dashboard with key stats
- Data persists across page refresh and browser restart

## How to Run Locally

You need a simple local web server (IndexedDB works best over HTTP, not `file://`).

### Option 1: Python (recommended)

```bash
# Python 3
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) in your browser.

### Option 2: Node.js (npx)

```bash
npx serve .
```

### Option 3: VS Code / Cursor Live Server

Install the **Live Server** extension, right-click `index.html`, and choose **Open with Live Server**.

## Project Structure

```
bishi-app/
├── index.html       # Main page
├── css/
│   └── style.css    # Styles
├── js/
│   ├── db.js        # IndexedDB storage
│   ├── wheel.js     # Spinning wheel canvas
│   └── app.js       # App logic
└── README.md
```

## Adding Previous Records

If your Bishi started before you installed this app, use **+ Add Previous Result** on the dashboard. Enter the actual month, select the member who already received that month's payout, and enter the amount. The member is moved to **Already Received** and will not appear in future draws. After recording June, July, August, and September, the dashboard will automatically show October as the next month.

## Usage Flow

1. **Create Bishi** — Enter name, monthly contribution (₹), start month, and number of members.
2. **Add Members** — Enter each member's name until all slots are filled.
3. **Dashboard** — View stats, eligible/received members, and winner history.
4. **Run Bishi** — Click **🎯 RUN BISHI** to spin the wheel.
5. **Confirm Winner** — After the wheel stops, click **Confirm Winner** to save, or **Cancel** to discard.
6. **Repeat** — Confirmed winners move to "Already Received" and won't appear on the wheel again.

## Tech Stack

- HTML, CSS, Vanilla JavaScript
- IndexedDB for local persistence
- Canvas API for the spinning wheel

No frameworks, no backend, no external dependencies.
