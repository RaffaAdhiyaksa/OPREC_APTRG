# API Questions (Frontend → Backend)

Format: lihat `docs/FRONTEND_HANDOFF.md` bagian 10.

## 2026-11-28 — `UserResource.competition_divisions`
- Temuan: backend mengembalikan `{ id, name, team_name }`. Contoh login di PRD §7.1 juga menyertakan `position`.
- Kebutuhan frontend: `position` (nullable) untuk ditampilkan sebagai Badge di halaman Profil.
- Sementara: tipe frontend mengikuti backend (tanpa `position`).

## 2026-11-28 — Akun seed dan `must_change_password`
- Temuan: kelima akun seed dibuat dengan `must_change_password = false`, jadi alur paksa ganti password (403 `PASSWORD_CHANGE_REQUIRED` → `/change-password`) tidak bisa diuji dengan akun seed.
- Kebutuhan frontend: satu akun seed tambahan dengan `must_change_password = true`, misalnya `baru@aptrg.test` (magang System).
- Sementara: alur diuji dengan mengubah flag langsung di database lokal.

## 2026-11-28 — Field login di `CLAUDE.md`
- Temuan: `CLAUDE.md` §6 menulis login memakai `email` atau `nim`. Backend dan handoff memakai satu field `login` (email atau NIM) + `device_name`.
- Kebutuhan frontend: tidak ada perubahan backend. Mohon `CLAUDE.md` diselaraskan.
- Sementara: frontend mengirim `{ login, password, device_name: "web" }`.

## 2026-11-28 — Header `Retry-After` pada 429 tidak terbaca browser
- Temuan: `config/cors.php` hanya mengekspos `Content-Disposition`. Browser lintas origin (5173 → 8000) tidak bisa membaca `Retry-After`, jadi sisa detik throttle login tidak diketahui frontend.
- Kebutuhan frontend: tambahkan `Retry-After` (dan `X-RateLimit-Remaining` jika perlu) ke `exposed_headers`.
- Sementara: frontend memakai 60 detik (jendela limiter login) saat header tidak terbaca.

## 2026-11-28 — Notifikasi: bentuk respons `GET /notifications/unread-count`
- Temuan: PRD §7.6 tidak menyebut bentuk respons endpoint ini.
- Kebutuhan frontend: `{ "data": { "unread_count": 3 } }`.
- Sementara: mock (`src/services/mock/notifications.ts`) mengikuti bentuk ini; lonceng polling 60 detik.

## 2026-11-28 — Menu per role: handoff vs PRD
- Temuan: handoff F3 meminta menu Pengumuman hanya untuk koordinator dan tidak menyebut Materi/Tugas untuk admin. PRD §9.2–9.3 menulis admin punya "Materi & Tugas (mode pantau)" dan Asisten Aktif melihat Pengumuman ("kirim hanya jika koordinator"); admin juga bisa menargetkan pengumuman ke `asisten_aktif`.
- Kebutuhan frontend: konfirmasi. Frontend mengikuti PRD (PRD menang bila bertentangan).
- Sementara: semua Asisten Aktif melihat feed Pengumuman; tombol "Buat" hanya muncul dengan permission `announcement.send`. Admin punya menu Materi dan Tugas.

## 2026-11-28 — Admin: bentuk respons yang diasumsikan mock (Tahap 5)
- Temuan: PRD §7.2 belum merinci beberapa bentuk respons.
- Kebutuhan frontend:
  - `POST /admin/users` dan `POST /admin/users/{user}/reset-password` → `{ "data": { "user": <AdminUser>, "temporary_password": "..." | null } }`. `temporary_password` `null` bila admin mengisi password sendiri.
  - `<AdminUser>` = UserResource + `phone`, `last_login_at`, `created_at`.
  - `GET /admin/users` menerima `is_active=1|0` dan mengembalikan `meta` paginasi standar.
  - `GET /admin/dashboard` → `{ users: { admin, asisten_aktif, asisten_magang, inactive }, pending_grading, divisions: [{ division, asisten_aktif, asisten_magang, assignments, ungraded }], recent_announcements: [<Announcement>] }`. "Belum dinilai" = submission tanpa nilai sama sekali.
  - `GET /divisions` → setiap divisi menyertakan `members_count`.
  - Error validasi aturan admin (hapus/nonaktifkan diri sendiri, admin terakhir) dikembalikan sebagai 422 dengan `errors` per field.
- Sementara: mock di `src/services/mock/users.ts` dan `divisions.ts` mengikuti bentuk ini.

## 2026-11-28 — Materi, Tugas, Penilaian: asumsi mock (Tahap 6–7)
- Temuan: PRD §7.3–7.5 belum merinci beberapa bentuk respons.
- Kebutuhan frontend:
  - `GET /materials` dan `GET /assignments` → `{ "data": [...] }`; frontend meminta `per_page=100` dan tidak memakai paginasi untuk daftar ini (jumlah per divisi kecil). Mohon konfirmasi atau beri tahu jika wajib paginasi.
  - `Material` menyertakan `division` (`id, slug, name`), `author` (`id, name`), `embed_url` (YouTube, `null` untuk lainnya).
  - `Assignment` (staff) menyertakan `stats: { total_interns, submitted, late, graded_draft, graded_published }`; (magang) `is_overdue, can_submit, my_submission, my_grade`.
  - `GET /assignments/{id}/submissions` → `{ data: [{ user: { id, name, email, nim }, submission: <Submission>|null, grade: <Grade>|null }], meta: { total, submitted, missing, late, graded_draft, graded_published } }`.
  - `<Submission>`: `id, method, file_name, file_size, mime_type, drive_link, note, is_late, submitted_at`. `<Grade>`: `id, score, feedback, status, published_at, graded_by { id, name }, updated_at`.
  - `POST /assignments/{id}/grades/publish` → `{ "data": { "published": <jumlah> } }`.
  - `GET /submissions/{id}/download` → header `Content-Disposition` dengan nama file asli (sudah di `exposed_headers`).
  - Dashboard Asisten Aktif memakai `stats.total_interns` untuk "Jumlah Magang" karena belum ada endpoint jumlah magang per divisi untuk non-admin. Jika divisi belum punya tugas, angka menjadi 0.
- Sementara: mock di `src/services/mock/materials.ts` dan `assignments.ts` mengikuti bentuk ini.
