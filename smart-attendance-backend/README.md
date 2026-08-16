# AttendX Backend

Node.js + Express + PostgreSQL API for the Smart B.Tech College Attendance frontend.

## Features

- Student/teacher JWT login
- 75% configurable attendance threshold
- Subject-wise attendance calculation
- Attendance history
- Teacher attendance sessions
- Temporary QR token
- Duplicate attendance protection
- Enrollment check
- Optional location data capture
- CORS for Vercel frontend
- Automatic database table creation and demo seed

## Demo accounts

Student:
`ramji@student.college.edu`
`password123`

Teacher:
`faculty@college.edu`
`password123`

Change/remove these demo accounts before real college deployment.

## Local setup

1. Install Node.js 20+
2. Create PostgreSQL database
3. Copy `.env.example` to `.env`
4. Fill in DATABASE_URL and JWT_SECRET
5. Run:

```bash
npm install
npm run dev
```

API:
`http://localhost:10000`

Health check:
`http://localhost:10000/api/health`

## Render deployment

Create a Render **Web Service**.

Build Command:
`npm install`

Start Command:
`npm start`

Environment variables:

```text
DATABASE_URL=<your PostgreSQL connection string>
JWT_SECRET=<long random secret>
FRONTEND_URL=https://your-frontend.vercel.app
ATTENDANCE_THRESHOLD=75
NODE_ENV=production
```

The server listens on `process.env.PORT` and `0.0.0.0`, which is required for Render.

## Database recommendation

For a free student/demo deployment, use a hosted PostgreSQL provider such as Supabase and place its connection string in `DATABASE_URL`. Do not commit `.env` or database passwords to GitHub.

## API endpoints

GET  `/api/health`

POST `/api/auth/login`

GET  `/api/student/me`

GET  `/api/student/attendance`

GET  `/api/student/history`

POST `/api/teacher/sessions`

GET `/api/teacher/sessions/:id`

POST `/api/attendance/mark`

## Important production work

Before using this for an actual college:
- replace demo login/seed
- add proper admin provisioning
- use HTTPS
- enforce geofence distance server-side
- add device/anti-spoofing checks
- validate teacher/class/subject ownership
- add rate limiting
- add audit logs
- add institution-specific attendance/condonation rules
- protect student data and comply with applicable privacy policies
