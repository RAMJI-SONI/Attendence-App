# AttendX — Smart College Attendance Frontend

Responsive React + Vite frontend for a B.Tech college attendance system.

## Attendance model

The UI uses:

**Attendance % = Classes Attended / Classes Conducted × 100**

The configured eligibility threshold is **75%**.

The frontend also calculates:
- how many future classes must be attended to reach 75% when below it
- how many future classes can be missed while staying at/above 75% when already eligible

> The 75% rule is configurable. Actual university/college examination eligibility, condonation, practical attendance, medical leave, and other rules should be confirmed from the institution's current regulations.

## Run

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal.

## Deploy to Vercel

Build command:
`npm run build`

Output directory:
`dist`

Framework:
`Vite`

This version is frontend-only and uses sample data. Replace sample data with API calls when the Node.js/PostgreSQL backend is ready.
