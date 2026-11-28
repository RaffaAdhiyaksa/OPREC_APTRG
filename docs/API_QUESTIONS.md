# API Questions (Frontend → Backend)

Format: lihat `docs/FRONTEND_HANDOFF.md` bagian 10.

## 2026-11-28 — `UserResource.competition_divisions`
- Temuan: backend mengembalikan `{ id, name, team_name }`. Contoh login di PRD §7.1 juga menyertakan `position`.
- Kebutuhan frontend: `position` (nullable) untuk ditampilkan sebagai Badge di halaman Profil.
- Sementara: tipe frontend mengikuti backend (tanpa `position`).
- Jawaban backend (Tahap 5): sudah ditambahkan. `competition_divisions` sekarang `[{ id, name, team_name, position }]`.

## 2026-11-28 — Akun seed dan `must_change_password`
- Temuan: kelima akun seed dibuat dengan `must_change_password = false`, jadi alur paksa ganti password (403 `PASSWORD_CHANGE_REQUIRED` → `/change-password`) tidak bisa diuji dengan akun seed.
- Kebutuhan frontend: satu akun seed tambahan dengan `must_change_password = true`, misalnya `baru@aptrg.test` (magang System).
- Sementara: alur diuji dengan mengubah flag langsung di database lokal.
- Jawaban backend (Tahap 5): akun seed `baru@aptrg.test` (asisten_magang, System, `must_change_password = true`) ditambahkan. Password sama dengan akun seed lain (`SEED_DEFAULT_PASSWORD`). Jalankan `php artisan db:seed`.

## 2026-11-28 — Field login di `CLAUDE.md`
- Temuan: `CLAUDE.md` §6 menulis login memakai `email` atau `nim`. Backend dan handoff memakai satu field `login` (email atau NIM) + `device_name`.
- Kebutuhan frontend: tidak ada perubahan backend. Mohon `CLAUDE.md` diselaraskan.
- Sementara: frontend mengirim `{ login, password, device_name: "web" }`.
- Jawaban backend (Tahap 5): `CLAUDE.md` §6 sudah diselaraskan: `{ login, password, device_name }`, `login` = email atau NIM.

## 2026-11-28 — Header `Retry-After` pada 429 tidak terbaca browser
- Temuan: `config/cors.php` hanya mengekspos `Content-Disposition`. Browser lintas origin (5173 → 8000) tidak bisa membaca `Retry-After`, jadi sisa detik throttle login tidak diketahui frontend.
- Kebutuhan frontend: tambahkan `Retry-After` (dan `X-RateLimit-Remaining` jika perlu) ke `exposed_headers`.
- Sementara: frontend memakai 60 detik (jendela limiter login) saat header tidak terbaca.
- Jawaban backend (Tahap 5): `exposed_headers` sekarang `Content-Disposition, Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining`. Catatan: login kini punya dua limit, 5/menit per (login + IP) dan 30/menit per IP; `Retry-After` mengikuti limit yang kena.

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
- Jawaban backend (Tahap 5): sudah jalan, detail di PRD §7.2.
  - `POST /admin/users` (201) dan `POST /admin/users/{user}/reset-password` (200): `{ data: { user, temporary_password } }` sesuai permintaan. Reset password selalu mengembalikan password baru (tidak pernah `null`) dan ditolak untuk akun sendiri: `422 { message, code: "CANNOT_RESET_SELF", errors: { user: [...] } }`.
  - `<AdminUser>`: tidak ada tipe terpisah. `UserResource` sekarang selalu berisi `phone`, `last_login_at`, `created_at`, jadi semua endpoint user (termasuk `/auth/me` dan login) memakai bentuk yang sama.
  - `GET /admin/users`: `is_active=1|0` dan `is_coordinator=1|0` diterima. Paginasi standar Laravel (`data`, `links`, `meta`), `per_page` max 100.
  - `GET /admin/dashboard`: **berbeda dari mock untuk sementara.** Bentuknya `{ data: { users: { admin, asisten_aktif, asisten_magang, inactive }, divisions: [{ division: { id, slug, name }, asisten_aktif, asisten_magang }] } }`. `pending_grading`, `divisions[].assignments`, `divisions[].ungraded`, dan `recent_announcements` belum ada; menyusul di tahap tugas/pengumuman. Mohon FE menangani field itu sebagai opsional.
  - `GET /divisions`: **`members_count` hanya untuk admin** (keputusan owner). Non-admin tidak menerima field ini dan hanya melihat divisi aktif.
  - Error aturan admin: `422` dengan `code` dan `errors` per field, misalnya `{ message, code: "CANNOT_DEACTIVATE_SELF", errors: { is_active: [...] } }`. Code lain: `CANNOT_CHANGE_OWN_ROLE` (`role`), `CANNOT_DELETE_SELF` (`user`), `CANNOT_RESET_SELF` (`user`; admin mengganti password sendiri lewat `PUT /auth/password`), `LAST_ADMIN`, `NOT_ASISTEN_AKTIF` (`members`), `DIVISION_NOT_OPTIONAL` (`is_active`).
  - Pesan validasi kini bahasa Indonesia, misalnya "Email/NIM wajib diisi.".

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
- Jawaban backend (Tahap 6, materi & tugas; submission/penilaian menyusul di Tahap 7):
  - `GET /materials` dan `GET /assignments` memakai paginasi standar Laravel (`data`, `links`, `meta`). `per_page=100` (maksimum) didukung, jadi `data.data` di frontend tetap jalan.
  - `Material` dan `Assignment` mengikuti bentuk mock (`division`, `author`, `embed_url`, `stats` termasuk `late`, `is_overdue`, `can_submit`, `my_submission`, `my_grade`). Detail di PRD §7.3–7.4.
  - **Beda dengan mock:**
    - `POST /assignments/{id}/publish` pada tugas yang sudah published → `422 ALREADY_PUBLISHED` (mock mengembalikan 200 tanpa perubahan).
    - Akses ke materi/tugas di luar divisi (atau draft untuk magang) → `404`, termasuk PUT/DELETE/publish. Magang yang menulis di divisinya → `403`.
    - `PATCH /materials/reorder` dengan id yang tidak terlihat → `404`; id dari dua divisi (admin) → `422 errors.order`.
    - `stats.submitted/late/graded_*` menghitung semua submission tugas itu (mock hanya menghitung magang yang masih di divisi tersebut). `total_interns` = magang aktif di divisi.
    - `my_grade.score` berupa angka; `Assignment` juga menyertakan `updated_at`.
    - `embed_url` memakai `youtube-nocookie.com` (sama dengan mock).
  - `GET /admin/dashboard` sekarang menyertakan `pending_grading` (total) dan per divisi `assignments_published` serta `pending_grading`. **Nama berbeda dari mock** (`assignments`, `ungraded`): `assignments_published` hanya menghitung tugas published, dan `pending_grading` = submission tanpa nilai published (termasuk yang nilainya masih draft). `recent_announcements` belum ada (tahap pengumuman).
  - `GET /assignments/{id}/submissions`, `<Grade>` versi staff, publish nilai, dan download belum ada; menyusul di Tahap 7 sesuai bentuk di atas.

## 2026-11-28 — Submission magang & `/me/grades`: asumsi mock (Tahap 7)
- Temuan: bentuk respons berikut belum tertulis di PRD.
- Kebutuhan frontend:
  - `POST /assignments/{id}/submission` (multipart `file` / `drive_link` / `note`) → `{ "data": <Submission> }` dengan `method`. Error: `422 FILE_TOO_LARGE` (`errors.file`), `409 DEADLINE_PASSED`, `409 GRADE_LOCKED`.
  - `DELETE /assignments/{id}/submission` ditolak `409 DEADLINE_PASSED` setelah deadline dan `409 GRADE_LOCKED` bila nilai sudah publish.
  - `GET /me/grades` → `{ data: [{ id, assignment: { id, title, max_score }, score, feedback, published_at }], meta: { average, graded_count } }`. `average` dalam skala 0–100 (persentase dari `max_score`), dibulatkan 1 desimal, `null` bila belum ada nilai.
- Sementara: mock di `src/services/mock/assignments.ts` mengikuti bentuk ini; FE melakukan pre-check ukuran dan ekstensi sebelum upload.

## 2026-11-28 — Pengumuman: asumsi mock (Tahap 8)
- Temuan: PRD §7.6 belum merinci bentuk respons pengumuman.
- Kebutuhan frontend:
  - `<Announcement>` = `{ id, title, body, author: { id, name }, target: { division: { id, slug, name } | null, role: Role | null }, recipients_count, is_read, created_at }`. `is_read` = `true` untuk penulisnya sendiri.
  - `GET /announcements` dan `/announcements/sent` → `{ "data": [...] }` (FE meminta `per_page=100`).
  - Link notifikasi pengumuman: `/announcements?open={id}`. FE membuka dialog detail dari parameter ini dan memanggil `POST /announcements/{id}/read`.
  - Perkiraan penerima di dialog admin dihitung FE dari `/admin/dashboard`. Bila backend menyediakan endpoint pratinjau penerima, FE akan beralih ke sana.
- Sementara: mock di `src/services/mock/announcements.ts` mengikuti bentuk ini, termasuk pemaksaan target untuk koordinator.
