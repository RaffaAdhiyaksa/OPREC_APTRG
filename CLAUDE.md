# CLAUDE.md — APTRG LMS

Permanent guide for every coding session in this repository. Read it before you change code.

## 1. Sources of truth

- `PRD.md` is the only spec: scope, RBAC, schema (§4), edge cases (§5), API contract (§6–7), UI/UX (§8–9), open questions (§11).
- If code, this file, and `PRD.md` disagree, `PRD.md` wins. Report the conflict to the user; do not resolve it silently.
- Open questions in PRD §11 are not decided. Ask before building anything that depends on one.
- Any change to the database schema needs user confirmation first. Keep PRD §4 and section 4a below identical.

## 2. Product scope

- Internal LMS for APTRG Laboratory's Asisten Magang. No public registration. Admin creates all accounts.
- Phase 1 (MVP, current): auth and users, divisions, link-based materials, assignments with hybrid submission, grading (`draft`/`published`), division announcements.
- Phase 2 (later): competition team management for Asisten Aktif. Only the DB foundation exists now (`competition` divisions, `competition_members` table). Do not build Phase 2 features unless asked.
- The old Open Recruitment / Open Mind modules are gone. Never reintroduce them, Supabase, or i18n.

## 3. Monorepo layout

```
/
├── PRD.md, CLAUDE.md, README.md
├── frontend/                 React 18 + TypeScript + Vite + Tailwind v4 + Shadcn/ui
│   └── src/
│       ├── components/ui/    Shadcn/ui primitives — keep; edit only when necessary
│       ├── components/layout/ Sidebar, Navbar, NotificationBell
│       ├── pages/{auth,dashboard,materials,assignments,announcements,admin}/
│       ├── services/         Axios client (api.ts) + one module per resource
│       ├── hooks/            AuthContext, TanStack Query hooks
│       ├── types/            TypeScript interfaces mirroring API Resources
│       ├── assets/           aptrg_logo.png
│       └── styles/           theme.css (design tokens), tailwind.css, fonts.css
└── backend/                  Laravel 13 REST API + Sanctum + MySQL
    ├── app/Http/Controllers/Api/V1/
    ├── app/Http/Requests/    FormRequest per write endpoint
    ├── app/Http/Resources/   API Resource per model
    ├── app/Http/Middleware/  EnsureRole, EnsureCoordinator, ...
    ├── app/Policies/         one Policy per model — RBAC lives here
    ├── app/Models/
    ├── database/{migrations,seeders,factories}/
    └── routes/api.php        everything under prefix /api/v1
```

Run commands from the matching folder: `cd frontend && npm run dev|build|typecheck`, `cd backend && php artisan ...`.

## 4. Roles

- `users.role`: `admin` | `asisten_aktif` | `asisten_magang`.
- `users.is_coordinator` (bool): only meaningful for `asisten_aktif`. Must be `false` for other roles.
- `users.research_division_id`: required for `asisten_aktif` and `asisten_magang`; `null` for `admin`.
- The `User` model enforces both on `saving`: non-`asisten_aktif` gets `is_coordinator = false`; `admin` gets `research_division_id = null`.
- Enums live in `app/Enums` (`Role`, `DivisionType`, `MaterialSourceType`, `AssignmentStatus`, `GradeStatus`) and are used in model casts. Compare against enum cases, not raw strings.

## 4a. Database schema (MySQL 8) — identical to PRD §4

Semua tabel punya `id` dan `timestamps`. Semua FK memakai `foreignId()->constrained()`; aturan `ON DELETE` default `RESTRICT` kecuali disebut lain.

1. **`divisions`**: `slug` (unique), `name`, `type` enum(`research`,`competition`), `team_name` (nullable), `is_optional` (bool, default `false`), `is_active` (bool, default `true`), `sort_order`.
2. **`users`**: `name`, `email` (unique), `nim` (nullable, unique), `phone` (nullable), `password`, `role` enum(`admin`,`asisten_aktif`,`asisten_magang`), `research_division_id` (FK `divisions`, nullable, restrictOnDelete), `is_coordinator` (bool, default `false`), `is_active` (bool, default `true`), `must_change_password` (bool, default `true`), `avatar_path` (nullable), `last_login_at` (nullable), `remember_token`, `softDeletes`. Index (`role`, `research_division_id`).
3. **`competition_members`** (Fase 2): `user_id` (FK, cascade), `division_id` (FK, cascade), `position` (nullable). Unique (`user_id`, `division_id`).
4. **`materials`**: `division_id` (FK), `created_by` (FK `users`), `title`, `description` (text, nullable), `source_type` enum(`youtube`,`drive`,`other`), `url` (varchar 2048), `sort_order`, `is_published` (bool, default `true`).
5. **`assignments`**: `division_id` (FK), `created_by` (FK `users`), `title`, `description` (longText), `due_at` (datetime), `allow_late` (bool, default `false`), `max_file_size_mb` (unsigned tinyint, default `10`), `allowed_extensions` (json, nullable), `max_score` (unsigned smallint, default `100`), `status` enum(`draft`,`published`) default `draft`, `published_at` (nullable), `softDeletes`. Index (`division_id`, `status`, `due_at`).
6. **`submissions`**: `assignment_id` (FK, cascade), `user_id` (FK), `file_path` (nullable), `file_name` (nullable), `file_size` (unsigned bigint, nullable), `mime_type` (nullable), `drive_link` (varchar 2048, nullable), `note` (text, nullable), `is_late` (bool, default `false`), `submitted_at`. Unique (`assignment_id`, `user_id`). CHECK: `file_path IS NOT NULL OR drive_link IS NOT NULL`.
7. **`grades`**: `assignment_id` (FK, cascade), `user_id` (FK), `submission_id` (FK, nullable, nullOnDelete), `graded_by` (FK `users`), `score` (decimal 5,2), `feedback` (text, nullable), `status` enum(`draft`,`published`) default `draft`, `published_at` (nullable). Unique (`assignment_id`, `user_id`). Nilai terikat ke (tugas, magang), sehingga magang yang tidak mengumpulkan tetap bisa dinilai.
8. **`announcements`**: `author_id` (FK `users`), `title`, `body` (text), `research_division_id` (FK, nullable; `null` = semua divisi), `target_role` enum(`admin`,`asisten_aktif`,`asisten_magang`) nullable (`null` = semua role).
9. **`announcement_reads`**: `announcement_id` (FK, cascade), `user_id` (FK, cascade), `read_at`. Unique (`announcement_id`, `user_id`).

Ditambah tabel bawaan Laravel/Sanctum: `password_reset_tokens`, `sessions`, `cache`, `jobs`, `personal_access_tokens`, `notifications` (database channel: `id` uuid, `type`, `notifiable` morph, `data` json, `read_at`).

Relasi: `divisions` 1-N `users` (riset), N-N `users` lewat `competition_members` (lomba); `divisions` 1-N `materials`, `assignments`, `announcements`; `assignments` 1-N `submissions` dan `grades`; `announcements` N-N `users` lewat `announcement_reads`.

## 5. RBAC rules (strict — enforce on the backend)

The frontend only hides UI. The backend Policy/middleware is the real guard. Every rule below needs a feature test.

1. **Research division isolation.** A non-admin user can read or change only records in their own research division: `materials.division_id` / `assignments.division_id` equal to `user.research_division_id`; submissions and grades through their assignment; announcements by `research_division_id` (or global `null`). Apply the filter in the query (scope), and authorize with a Policy. A resource in another division returns `404`, not `403`, so existence does not leak.
2. **Admin** may access every division. Admin does not submit assignments.
3. **Materials and assignments:** CRUD by `admin` and `asisten_aktif` (coordinator or not) in their division. `asisten_magang` is read-only.
4. **Submissions:** only `asisten_magang` submits. At least one of `file` or `drive_link` is required. File size max is the assignment's `max_file_size_mb`. Allowed types: `pdf, zip, rar, doc, docx, ppt, pptx, png, jpg, jpeg`. Store files on the private disk, never a public URL. Resubmit before the grade is published replaces the old file (delete it from storage). Set `is_late = true` when `submitted_at > due_at`. The DB CHECK constraint also rejects a row with neither `file_path` nor `drive_link`.
5. **Grades — `draft` vs `published`:**
   - A new grade is always `draft`.
   - Any endpoint or payload an `asisten_magang` can reach must never contain a `draft` grade: not its score, feedback, or existence. Filter in the query, not in the Resource or UI. The intern only sees "Menunggu Penilaian".
   - `admin` and `asisten_aktif` (same division) can grade and publish, single or bulk per assignment. Publishing sets `published_at` and notifies the intern.
6. **Announcements:**
   - Create only if `role === 'admin'` OR (`role === 'asisten_aktif'` AND `is_coordinator === true`). Everyone else gets `403`.
   - A coordinator's announcement always targets `research_division_id` = the coordinator's division and `target_role = asisten_magang`. The server forces both; ignore any target sent by the client.
   - Admin may target one division or broadcast globally (`research_division_id = null`), optionally narrowed by `target_role` (`null` = all roles).
   - Visibility uses `Announcement::visibleTo($user)`: admin sees all; others see rows where (`research_division_id` = their division OR `null`) AND (`target_role` = their role OR `null`). Read status lives in `announcement_reads`.
7. **Notifications:** in-app only, Laravel `notifications` table (database channel). Types: `announcement`, `assignment_published`, `grade_published`, `grade_updated`. The frontend polls the unread count every 60 seconds. No email, no WebSocket.
8. **Admin content:** admin may create materials/assignments in any division and must send `division_id`.

## 6. API conventions

- Base path `/api/v1`. JSON only. Clients send `Accept: application/json`.
- Auth: Sanctum **Bearer token** (`Authorization: Bearer <token>`). No cookie/stateful SPA auth, no CSRF endpoint. `config/sanctum.php` has `stateful = []` and `guard = []`. CORS (`config/cors.php`) allows `FRONTEND_URL` (default `http://localhost:5173`) with `supports_credentials = false`.
- Login: `POST /api/v1/auth/login` with `email` or `nim` + `password`. There is no `/register`.
- Routes: plural kebab-case nouns (`/materials`, `/assignments/{assignment}/submissions`). Controllers: `Api\V1\{Model}Controller`, resourceful method names. Nested actions as sub-resources, e.g. `POST /assignments/{assignment}/grades/publish`.
- JSON keys: `snake_case`. Every response goes through an API Resource.
- Success envelope: `{ "data": ..., "meta"?: { pagination }, "message"?: "..." }`.
- Error envelope: `{ "message": "...", "code"?: "UPPER_SNAKE", "errors"?: { "field": ["..."] } }`. Validation uses FormRequest (`422`).
- Status codes: `401` unauthenticated, `403` role not allowed, `404` not found or other division, `409` state conflict, `422` validation.
- Datetimes: ISO 8601 UTC. The frontend converts to WIB.
- Pagination: `page`, `per_page` (default 15, max 100).

## 7. Naming

- DB: plural snake_case tables, `{singular}_id` foreign keys (actor FKs: `created_by`, `graded_by`, `author_id`), enums as strings matching PRD values exactly (`research`/`competition`, `youtube`/`drive`/`other`, `draft`/`published`).
- PHP: PSR-12, `Model`, `ModelController`, `StoreModelRequest`/`UpdateModelRequest`, `ModelResource`, `ModelPolicy`.
- TypeScript: components and pages `PascalCase.tsx` (`MaterialListPage.tsx`), hooks `useCamelCase.ts`, services `camelCase.ts`, types in `src/types/`. Import with the `@/` alias.

## 8. Frontend rules

- Use existing Shadcn/ui components and tokens from `styles/theme.css`. Do not add another UI library.
- Data fetching through TanStack Query and the shared Axios client. The client attaches the Bearer token and logs out on `401`.
- Every data view handles loading (`Skeleton`), error (`sonner` toast), and empty state.
- Route guards per role. They improve UX only; never rely on them for security.

## 9. Workflow

- Before a feature: state the plan in at most 5 short points.
- Keep code complete: no `TODO` placeholders or hardcoded mock data in production components.
- Comment only non-obvious business logic (division isolation, draft/published).
- After a change: run `npm run build` (frontend) and `php artisan test` (backend) and report the result honestly.
- Never commit `.env` files or secrets.
