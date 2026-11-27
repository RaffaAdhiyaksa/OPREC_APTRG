# APTRG LMS

Internal Learning Management System for APTRG Laboratory's Asisten Magang. See `PRD.md` for full requirements.

## Structure

```
.
├── PRD.md        # Product requirements
├── frontend/     # React 18 + TypeScript + Vite + Tailwind + Shadcn/ui
└── backend/      # Laravel 11 REST API + Sanctum (coming in Stage 2)
```

## Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
