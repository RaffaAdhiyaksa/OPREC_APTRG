# Frontend Handoff V2 — Integrasi Penuh ke Backend

Dokumen ini lanjutan dari `docs/FRONTEND_HANDOFF.md`. Untuk **Achmad** dan **AI coding assistant**-nya.

> **Untuk AI:** baca dokumen ini sampai habis, lalu `CLAUDE.md`, `PRD.md` (terutama kontrak API §6–7), dan `docs/API_QUESTIONS.md`. Aturan kolaborasi di `FRONTEND_HANDOFF.md` §2 tetap berlaku. Jika dokumen ini bertentangan dengan respons backend yang sebenarnya, **respons backend yang benar**. Catat perbedaannya di `docs/API_QUESTIONS.md`.

---

## 1. Status saat ini

- **Backend selesai Tahap 1–8.** Semua endpoint yang dipanggil `frontend/src/services/*.ts` sudah ada di backend. Tidak ada path yang beda atau hilang. Yang tersisa hanya **beda bentuk respons** di beberapa tempat (bagian 4).
- **Tujuan fase ini:** matikan semua mock, sambungkan semua halaman ke API asli, lalu uji end-to-end per role di browser.
- Semua perubahan backend sudah di `main` (PR #14–#17). Rinciannya ada di body masing-masing PR.

| Tahap | Isi | PR |
|---|---|---|
| 4 | Auth, format error, middleware | (di main sejak awal) |
| 5 | Admin: user, divisi, dashboard; limit login per IP; pesan validasi bahasa Indonesia; token 7 hari | #14 |
| 6 | Materi, tugas, publish tugas + notifikasi | #15 |
| 7 | Submission hybrid, download, penilaian draft/published | #16 |
| 8 | Pengumuman, notifikasi, `recent_announcements` di dashboard | #17 |

## 2. Git

1. Mulai dari `main` terbaru: `git checkout main && git pull`.
2. Kalau commit `77ef42b` (dari `feat/fe-foundation` lama) atau branch `fix/fe-admin-integration` belum masuk `main`, gabungkan dulu ke branch integrasi.
3. Kerja di branch baru per domain (bagian 6), misalnya `feat/fe-integrate-admin`. Satu domain = satu PR ke `main`.
4. Satu PR hanya mengubah satu sisi (`frontend/` ATAU `backend/`), kecuali docs (`CLAUDE.md` §9). PR integrasi di sini hanya mengubah `frontend/` dan docs.

## 3. Refresh setup lokal

Backend berubah banyak sejak setup pertama. Jalankan:

```powershell
cd backend
composer install
php artisan migrate:fresh --seed
php artisan serve
```

Tambahkan ke `backend/.env` jika belum ada (lihat `.env.example`):

```
SANCTUM_EXPIRATION=10080
LMS_MAX_UPLOAD_MB=50
SEED_DEFAULT_PASSWORD=isi_bebas_minimal_8_karakter
```

`migrate:fresh` menghapus semua data lokal. Akun seed (password = `SEED_DEFAULT_PASSWORD`):

| Email | Role | Divisi | Catatan |
|---|---|---|---|
| `admin@aptrg.test` | admin | – | |
| `koordinator@aptrg.test` | asisten_aktif | System | koordinator, anggota lomba Fixed Wing |
| `aktif@aptrg.test` | asisten_aktif | Mechanic | bukan koordinator |
| `magang1@aptrg.test` | asisten_magang | System | |
| `magang2@aptrg.test` | asisten_magang | Mechanic | |
| `baru@aptrg.test` | asisten_magang | System | `must_change_password = true` |

Seed tidak membuat materi, tugas, atau pengumuman. Buat sendiri lewat UI saat uji end-to-end.

## 4. Perbedaan kontrak yang WAJIB disesuaikan di frontend

Ini hasil audit service FE terhadap route backend, ditambah semua perubahan Tahap 5–8. **Verifikasi setiap poin dengan request nyata** sebelum mengubah tipe.

### 4.1 Perbedaan dari audit (path sama, bentuk beda)

| Fungsi FE | Backend mengirim | FE saat ini memakai |
|---|---|---|
| `users.dashboard` (`GET /admin/dashboard`) | per divisi: `assignments_published`, `pending_grading` | `assignments`, `ungraded` |
| `assignments.publishGrades` (`POST /assignments/{id}/grades/publish`) | `data.published_count` | `data.published` |
| `assignments.myGrades` (`GET /me/grades`) | `meta: { average, published_count, assignments_total }` | `meta.graded_count` |
| `notifications.unreadCount` (`GET /notifications/unread-count`) | `data.count` | `data.unread_count` |
| `divisions.list` (`GET /divisions`) | `members_count` **hanya untuk admin** | tipe mewajibkan `members_count` |

### 4.2 Dashboard admin

- `GET /admin/dashboard` sekarang berisi `users` (jumlah per role + `inactive`), `divisions[]` (per divisi riset: `asisten_aktif`, `asisten_magang`, `assignments_published`, `pending_grading`), total `pending_grading`, dan `recent_announcements` (3 terbaru, bentuk `<Announcement>` lengkap).
- Tidak ada `ungraded`. Jangan `Math.max(...[])` pada array kosong. Semua angka dan array beri fallback.

### 4.3 User & auth

- Satu `UserResource` untuk login, `/auth/me`, dan semua endpoint admin. Field: `id, name, email, nim, phone, role, is_coordinator, is_active, must_change_password, research_division {id,slug,name}|null, competition_divisions [{id,name,team_name,position}], permissions[], last_login_at, created_at`.
- `/auth/me` menambah `unread_notifications_count` (data asli).
- Login punya **dua** limit: 5 per menit per (login + IP) dan 30 per menit per IP. Header `Retry-After` bisa dibaca browser.
- Token berlaku 7 hari. Setelah itu request apa pun dapat 401: hapus token dan arahkan ke `/login`.
- Pesan validasi sekarang bahasa Indonesia. Tampilkan apa adanya.
- `POST /admin/users` dan `POST /admin/users/{id}/reset-password` mengembalikan `{ data: { user, temporary_password } }`. Reset password akun sendiri ditolak `422 CANNOT_RESET_SELF`: menu itu dibuat disabled untuk baris akun sendiri.
- **Baru (Tahap 10):** `UserResource` berisi `avatar_url` (URL lengkap atau `null`).
- **Baru:** `PUT /auth/profile` untuk halaman Profil. Kirim `FormData` sebagai **`POST /auth/profile` dengan field `_method=PUT`** (PHP tidak membaca multipart pada PUT). Field opsional `name`, `phone`, `avatar` (jpg/png/webp, maks 2 MB). Email, role, divisi tidak bisa diubah. Respons `{ data: <UserResource> }`; perbarui cache `/auth/me` dengan data ini.
- **Berubah:** email/NIM user yang sudah dihapus kini boleh dipakai lagi saat membuat user baru (sebelumnya 422).
- **Baru:** `POST /admin/users/{id}/restore` memulihkan user terhapus → `{ data: <UserResource> }`. `422 RESTORE_CONFLICT` (`errors.email`/`errors.nim`) jika email/NIM sudah dipakai user aktif; `422 NOT_DELETED` jika user tidak terhapus. List `GET /admin/users` tetap tidak menampilkan user terhapus.
- **Baru:** `POST /admin/users/import` (FormData `file`, CSV header `name,email,nim,phone,role,division_slug`, maks 200 baris). Semua-atau-tidak. Gagal: `422 IMPORT_INVALID` dengan `errors` dikunci nomor baris file (`{"3": ["Email sudah digunakan."]}`) atau `IMPORT_TOO_LARGE`. Sukses `201 { data: { created_count, users: [{ name, email, temporary_password }] } }`; tampilkan daftar password sekali (seperti dialog password sementara) dan sediakan tombol salin. Import 200 baris bisa memakan ~40 detik: tampilkan loading dan jangan memakai timeout Axios yang pendek.
- **Baru:** `POST /assignments/{id}/submission` dibatasi 10 per menit per user (`429 TOO_MANY_REQUESTS`, header `Retry-After`).

### 4.4 Materi & tugas

- Materi: `source_type` dideteksi server dari URL (field dari client diabaikan). `embed_url` terisi untuk YouTube (format `watch?v=`, `youtu.be/`, `shorts/`), selain itu `null`.
- `PATCH /materials/reorder`: id yang tidak terlihat oleh user dapat 404, id dari divisi berbeda dapat 422.
- Publish tugas yang sudah published: `422 ALREADY_PUBLISHED` (mock lama mengembalikan 200).
- `stats` tugas (untuk asisten/admin) berisi `total_interns, submitted, late, graded_draft, graded_published`. Hanya menghitung magang **aktif** yang **saat ini** di divisi tugas.
- Untuk magang: `is_overdue`, `can_submit`, `my_submission` (atau `null`), `my_grade` (**hanya** jika published, selain itu `null`).

### 4.5 Submission & nilai

- `POST /assignments/{id}/submission` (multipart: `file`, `drive_link`, `note`). Respons 201 (baru) atau 200 (kirim ulang). Submission berisi `method: file|drive|both` dan `download_url`.
- Error yang harus ditangani di `SubmissionForm`:

| HTTP | `code` | Tindakan |
|---|---|---|
| 422 | `FILE_TOO_LARGE` | `meta: { max_file_size_mb, fallback: "drive_link" }`: tampilkan pesan + pindahkan ke tab Drive |
| 413 | `PAYLOAD_TOO_LARGE` | sama seperti `FILE_TOO_LARGE` |
| 409 | `DEADLINE_PASSED` | kunci form, tampilkan "Batas waktu sudah lewat" |
| 409 | `GRADE_LOCKED` | kunci form, tampilkan "Nilai sudah dipublikasikan" |
| 422 | `VALIDATION_ERROR` | petakan ke field (ekstensi salah, link Drive tidak valid, file dan link kosong) |

- Download file: `GET /submissions/{id}/download` dengan header Bearer (bukan `<a href>` biasa). Ambil sebagai blob, nama file dari header `Content-Disposition`.
- `GET /assignments/{id}/submissions` (asisten/admin): semua magang aktif divisi, termasuk yang belum mengumpulkan. Key per baris: **`user`**, `submission|null`, `grade|null`. **Tidak dipaginasi.** `meta` berisi jumlah per status (`submitted`, `missing`, `late`, `graded_draft`, `graded_published`).
- `PUT /assignments/{id}/grades/{user}` selalu 200 (juga saat nilai baru dibuat). Nilai baru berstatus `draft`. Mengubah nilai yang sudah published tetap published dan mengirim notifikasi `grade_updated`.
- `POST /grades/{id}/unpublish` mengembalikan nilai ke draft.

### 4.6 Pengumuman & notifikasi

- `GET /announcements`: setiap item berisi `author {id,name}`, `target {division|null, role|null}`, `is_read`. Filter `unread=1`. Paginasi standar.
- `GET /announcements/sent` (admin/koordinator): ditambah `recipients_count` dan `read_count`.
- `POST /announcements`: admin memilih target (`research_division_id` nullable, `target_role` nullable). Koordinator **tidak** mengirim target: server memaksa ke magang di divisinya. Asisten aktif non-koordinator dapat 403. Respons 201 dengan `recipients_count`.
- `POST /announcements/{id}/read`: tandai dibaca. Idempoten. Notifikasi terkait ikut ditandai dibaca.
- Notifikasi (`GET /notifications`): `{ id, type, title, excerpt, link, read_at, created_at }`. `type`: `announcement`, `assignment_published`, `grade_published`, `grade_updated`, `deadline_reminder`. `link` adalah path FE (misalnya `/assignments/21`), langsung dipakai untuk navigasi. List membawa `meta.unread_count`.
- **Tipe baru `deadline_reminder` (Tahap 9):** dikirim otomatis setiap jam ke magang yang belum mengumpulkan tugas dengan deadline dalam 24 jam. Payload sama: `title` = `Deadline: <judul tugas>`, `excerpt` menyebut batas waktu (WIB), `link` = `/assignments/{id}`. **Wajib** ditambahkan ke `NotificationType` di `src/types/api.ts` dan ke peta ikon di `components/shared/NotificationItem.tsx` (misalnya ikon jam/alarm) **sebelum** backend Tahap 9 dideploy: `ICON[n.type]` untuk tipe yang tidak dikenal bernilai `undefined` dan merender komponen kosong yang membuat halaman error.
- Lonceng: polling `GET /notifications/unread-count` setiap 60 detik (`data.count`).

### 4.7 Kode error lengkap

`UNAUTHENTICATED`, `FORBIDDEN`, `ACCOUNT_INACTIVE`, `PASSWORD_CHANGE_REQUIRED`, `NOT_FOUND`, `VALIDATION_ERROR`, `TOO_MANY_REQUESTS`, `CANNOT_CHANGE_OWN_ROLE`, `CANNOT_DEACTIVATE_SELF`, `CANNOT_DELETE_SELF`, `CANNOT_RESET_SELF`, `LAST_ADMIN`, `NOT_ASISTEN_AKTIF`, `DIVISION_NOT_OPTIONAL`, `ALREADY_PUBLISHED`, `FILE_TOO_LARGE`, `PAYLOAD_TOO_LARGE`, `DEADLINE_PASSED`, `GRADE_LOCKED`.

Semua masuk ke `ApiErrorCode`. Kode yang tidak dikenali tetap tampil lewat `message`.

### 4.8 Endpoint backend yang belum dipakai FE (opsional)

`GET /admin/users/{id}`, `PUT /admin/users/{id}/competition-divisions` (Fase 2), `GET /materials/{id}`, `GET /assignments/{id}/submission`, `GET /announcements/{id}`. Pakai jika halaman memerlukannya, misalnya membuka detail pengumuman dari link notifikasi.

Baru di Tahap 10 dan belum dipakai FE: `PUT /auth/profile` (halaman Profil), `POST /admin/users/{id}/restore`, `POST /admin/users/import` (tombol "Import CSV" di halaman Pengguna). Detail di 4.3.

## 5. Sisa item review sebelumnya

Jika belum dikerjakan, selesaikan di fase integrasi:

1. Dashboard admin aman dari field kosong (bagian 4.2).
2. Mock per domain (`VITE_MOCK_DOMAINS`) atau langsung matikan semua mock.
3. `ApiErrorCode` lengkap (bagian 4.7).
4. `members_count` opsional.
5. "Reset password" disabled untuk akun sendiri.
6. `position` di `CompetitionDivisionRef`.
7. Tidak mendesak: code-splitting per route (`React.lazy`), bundle sekarang ±859 kB.

## 6. Rencana integrasi

Kerjakan berurutan. Setiap langkah: matikan mock domain itu, sesuaikan tipe dan service, uji di browser dengan akun seed, lalu buka PR.

| Langkah | Branch | Domain | Selesai jika |
|---|---|---|---|
| I1 | `feat/fe-integrate-admin` | users, divisions, dashboard admin | Admin bisa CRUD user, reset password (dialog password sementara), nonaktifkan, toggle Teknofest. Dashboard tampil tanpa error. Semua error proteksi admin tampil sebagai pesan yang jelas. |
| I2 | `feat/fe-integrate-materials` | materials | Asisten aktif CRUD + urutkan materi. Magang divisi lain tidak melihat materi divisi lain. Embed YouTube jalan. |
| I3 | `feat/fe-integrate-assignments` | assignments, submissions, grades | Alur penuh: aktif buat + publish tugas, magang kirim file dan link Drive, file kebesaran pindah ke Drive, aktif unduh dan beri nilai draft, publish, magang baru melihat nilai setelah publish. |
| I4 | `feat/fe-integrate-announcements` | announcements, notifications | Admin kirim ke target tertentu, koordinator kirim ke magangnya, lonceng bertambah, tandai dibaca, link notifikasi membuka halaman yang tepat. |
| I5 | `chore/fe-remove-mocks` | semua | Hapus `src/services/mock/` dan flag mock jika semua domain sudah lulus. `npm run build` lulus. |

## 7. Skenario uji end-to-end (setelah I1–I4)

1. Login `baru@aptrg.test`: dipaksa ganti password, lalu masuk beranda magang.
2. Admin: buat user baru, salin password sementara, nonaktifkan lalu aktifkan lagi, aktifkan Teknofest.
3. Koordinator (System): buat materi YouTube dan Drive, buat tugas (batas 5 MB, PDF), publish.
4. Magang1 (System): notifikasi tugas muncul. Kirim PDF kecil. Coba file > 5 MB: diarahkan ke link Drive. Kirim ulang. Tarik submission, kirim lagi.
5. Magang2 (Mechanic): tidak melihat materi dan tugas System.
6. Koordinator: lihat daftar submission (magang yang belum kirim ikut tampil), unduh file, beri nilai draft. Magang1 belum melihat nilai.
7. Koordinator: publish nilai. Magang1 dapat notifikasi dan melihat nilai di `/grades`.
8. Koordinator: kirim pengumuman. Magang1 menerima, magang2 tidak. Aktif (Mechanic, bukan koordinator) tidak punya tombol buat pengumuman.
9. Admin: kirim pengumuman ke role asisten_aktif. Hanya koordinator dan aktif yang menerima.
10. Logout. Request berikutnya dari tab yang sama diarahkan ke `/login`.

Setiap langkah: console browser bersih, tampilan mobile 375 px tidak rusak.

## 8. Prompt untuk AI

### Orientasi V2 (belum menulis kode)

```
Backend APTRG LMS sudah selesai Tahap 1-8. Tugas kita sekarang: menyambungkan frontend ke API asli dan menghapus mock.

Sebelum menulis kode:
1. git checkout main && git pull. Baca docs/FRONTEND_HANDOFF_V2.md sampai habis, lalu CLAUDE.md, PRD.md (kontrak API), docs/API_QUESTIONS.md.
2. Pastikan backend lokal jalan (bagian 3 V2) dengan migrate:fresh --seed.
3. Untuk setiap baris di bagian 4.1, lakukan request nyata ke backend dan tunjukkan respons aslinya. Konfirmasi atau koreksi isi dokumen.
4. Cek status item bagian 5 di kode sekarang (sudah/belum).
5. Laporkan rencana langkah I1: file yang akan diubah, perubahan tipe, cara mematikan mock admin.
Jangan mengubah file apa pun di langkah ini. Tunggu konfirmasi saya.
```

### Per langkah integrasi (ganti `<I-n>`)

```
Kerjakan langkah <I-n> di docs/FRONTEND_HANDOFF_V2.md bagian 6.

Aturan:
- Branch baru dari main terbaru sesuai tabel. Hanya ubah frontend/ dan docs. Jangan ubah backend di PR ini (CLAUDE.md §9).
- Matikan mock untuk domain ini. Sesuaikan types/api.ts dan service dengan respons ASLI backend (bagian 4), bukan dengan mock lama.
- Tangani semua kode error yang relevan (bagian 4.5 dan 4.7) dengan pesan bahasa Indonesia yang jelas.
- Jika backend kurang field atau perilakunya aneh, tulis di docs/API_QUESTIONS.md, jangan diakali di FE.

Verifikasi:
- npm run build lulus.
- Jalankan kriteria "Selesai jika" di tabel bagian 6 di browser dengan akun seed. Jika chrome-devtools-mcp tersedia, pakai untuk login per role, screenshot, dan cek console/network.
- Cek tampilan mobile 375 px.

Commit (feat(fe): ...), push, buka PR ke main. STOP dan laporkan: file diubah, hasil uji per kriteria, pertanyaan untuk backend.
```

### Uji akhir

```
Semua langkah I1-I5 sudah di main. Jalankan skenario bagian 7 docs/FRONTEND_HANDOFF_V2.md dari awal (migrate:fresh --seed dulu) di browser. Catat setiap langkah: lulus/gagal, screenshot, error console/network. Jangan memperbaiki apa pun di langkah ini. Laporkan daftar bug, dipisah: bug frontend vs dugaan bug backend (yang backend tulis di docs/API_QUESTIONS.md).
```

## 9. Definition of Done fase integrasi

- [ ] Tidak ada import dari `src/services/mock/` di kode produksi, dan folder mock sudah dihapus.
- [ ] Skenario bagian 7 lulus semua untuk keenam akun seed.
- [ ] `npm run build` lulus, console bersih di semua halaman.
- [ ] Tidak ada pertanyaan terbuka di `docs/API_QUESTIONS.md` yang memblokir rilis.
