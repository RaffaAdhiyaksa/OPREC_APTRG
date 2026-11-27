# APTRG LMS

Internal Learning Management System for APTRG Laboratory's Asisten Magang. See `PRD.md` for full requirements.

## Structure

```
.
├── PRD.md        # Product requirements
├── frontend/     # React 18 + TypeScript + Vite + Tailwind + Shadcn/ui
└── backend/      # Laravel 13 REST API + Sanctum (Bearer token)
```

## Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Backend

Requires PHP 8.3+, Composer, and MySQL 8.

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
# create the database first: CREATE DATABASE aptrg_lms CHARACTER SET utf8mb4;
php artisan migrate --seed
php artisan serve   # http://localhost:8000/api/v1
```
