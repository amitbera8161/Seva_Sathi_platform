# SevaSathi

Monorepo containing the backend API and the frontend app, connected and ready to run together.

## Structure
```
sevasathi/
├── backend/     Express API (port 3000)
└── frontend/    React + Vite app (port 5173)
```

## Setup (first time only)
```bash
npm run install:all
```

## Run both apps together
```bash
npm run dev
```
This starts the backend on http://localhost:3000 and the frontend on http://localhost:5173 at the same time,
with logs prefixed [backend] / [frontend] in one terminal.

Run them separately instead if you prefer:
```bash
npm run dev:backend
npm run dev:frontend
```

## Notes
- The frontend already points at the backend via `frontend/.env` (`VITE_API_BASE_URL`).
- Backend secrets/config live in `backend/.env` — check it's filled in (Mongo URI, JWT secret, etc.) before running.
- Phone-only signup can't receive its OTP yet (email delivery only, no SMS integration) — sign up with an email for now.
