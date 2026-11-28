# Product Requirements Document (PRD): APTRG LMS (Clean Refactor)

- **Versi:** 2.1 (Full-Stack Decoupled Architecture, digabung dengan blueprint arsitektur)
- **Organisasi:** Laboratorium Aeromodelling and Payload Telemetry Research Group (APTRG)
- **Arsitektur & Tech Stack:**
  - **Frontend (`/frontend`):** React 18+, TypeScript, Vite, Tailwind CSS, Shadcn/ui, Lucide Icons, React Router, Axios, TanStack Query, react-hook-form.
  - **Backend (`/backend`):** Laravel 13 (RESTful API), Laravel Sanctum (Bearer Token Auth), MySQL 8.
- **Status Proyek:** Total Refactor — modul Open Recruitment & Open Mind lama sudah dihapus. Aset UI yang dipertahankan: Shadcn/ui, `theme.css`, `aptrg_logo.png`. Sistem dibangun ulang sebagai LMS Asisten Magang.

---

## 1. Ringkasan & Ruang Lingkup Produk

### 1.1 Tujuan Utama

Membangun Learning Management System (LMS) internal terpusat untuk pembinaan, distribusi materi, penugasan, penilaian transparan, dan komunikasi divisi bagi **Asisten Magang APTRG**.

### 1.2 Pembagian Fase Rilis

- **Fase 1 (MVP — fokus saat ini):**
  - Autentikasi & manajemen pengguna (tanpa registrasi publik).
  - Manajemen struktur Divisi Riset & Lomba.
  - Modul materi pembelajaran berbasis tautan eksternal.
  - Modul tugas & *hybrid submission* (direct upload + fallback link Drive).
  - Sistem penilaian dengan kontrol visibilitas (`draft` vs `published`).
  - Sistem notifikasi & pengumuman divisi (khusus Koordinator Divisi & Admin).
- **Fase 2 (post-MVP):**
  - Modul manajemen tim lomba & KRTI untuk **Asisten Aktif** (logbook riset, dokumentasi *flight test*, evaluasi performa tim). Fase 1 hanya menyiapkan fondasi DB (`divisions.type = competition`, tabel `competition_members`).

### 1.3 Arsitektur

- **Frontend (SPA):** TanStack Query untuk data fetching, React Router dengan route guard per role, react-hook-form untuk form yang mencerminkan validasi backend.
- **Backend (REST API):** semua endpoint di bawah `/api/v1`, JSON only. File submission disimpan di disk privat (`storage/app/private`), tidak pernah lewat URL publik.
- **Auth:** Sanctum Personal Access Token (Bearer). FE dan BE bisa beda domain/port tanpa urusan cookie CSRF.

---

## 2. Struktur Organisasi & Manajemen Hak Akses (RBAC)

### 2.1 Taksonomi Divisi

Satu tabel `divisions`, dibedakan kolom `type`.

| Tipe | `slug` | Nama | `team_name` | Fase | Opsional (bisa di-toggle) |
| --- | --- | --- | --- | --- | --- |
| research | `mechanic` | Mechanic | – | 1 | Tidak |
| research | `system` | System | – | 1 | Tidak |
| research | `gcs` | Ground Control Station (GCS) | – | 1 | Tidak |
| research | `non-technical` | Non-Technical | – | 1 | Tidak |
| competition | `fixed-wing` | Fixed Wing | Bangau Team | 2 | Tidak |
| competition | `racing-plane` | Racing Plane | Frigate Team | 2 | Tidak |
| competition | `lela` | LELA (Long Endurance Low Altitude) | Strix Team | 2 | Tidak |
| competition | `teknofest` | Teknofest | Avalerion Team | 2 | Ya (`is_optional = true`, default `is_active = false`) |

### 2.2 Role

- **Admin:** akses penuh. CRUD user, set role, divisi riset dan lomba, flag `is_coordinator`, toggle divisi opsional, broadcast pengumuman. Admin tidak terikat divisi (`research_division_id = null`).
- **Asisten Aktif:** CRUD materi dan tugas di divisi risetnya, periksa submission, input nilai (default `draft`), publish nilai. Bisa tergabung di divisi lomba (Fase 2).
- **Asisten Aktif + `is_coordinator = true`:** semua hak Asisten Aktif, plus kirim pengumuman ke divisi risetnya.
- **Asisten Magang:** lihat materi, kumpulkan tugas, baca notifikasi, lihat nilai berstatus `published`. Semua terbatas pada divisi risetnya.

### 2.3 Matriks Role & Izin Akses

| Kapabilitas / Fitur | Admin | Asisten Aktif *(Non-Koordinator)* | Asisten Aktif *(Koordinator)* | Asisten Magang |
| :--- | :---: | :---: | :---: | :---: |
| CRUD User, assign role, divisi riset/lomba, set koordinator | ✅ | ❌ | ❌ | ❌ |
| Aktif/nonaktifkan divisi lomba opsional (Teknofest) | ✅ | ❌ | ❌ | ❌ |
| CRUD materi (divisi risetnya) | ✅ | ✅ | ✅ | ❌ |
| Akses materi (divisi risetnya) | ✅ *(semua divisi)* | ✅ | ✅ | ✅ *(published saja)* |
| CRUD tugas & atur batas size upload (divisi risetnya) | ✅ | ✅ | ✅ | ❌ |
| Kumpulkan tugas (upload file / link Drive) | ❌ | ❌ | ❌ | ✅ |
| Periksa tugas & input nilai (`draft`) | ✅ | ✅ | ✅ | ❌ |
| **Publish nilai** (`draft` → `published`) | ✅ | ✅ | ✅ | ❌ |
| Lihat nilai & feedback | ✅ *(semua)* | ✅ *(semua di divisinya)* | ✅ *(semua di divisinya)* | ✅ *(milik sendiri, `published` saja)* |
| **Kirim pengumuman** | ✅ *(semua / per divisi / per role)* | ❌ | ✅ *(khusus divisinya)* | ❌ |
| Terima & tandai baca notifikasi | ✅ | ✅ | ✅ | ✅ |

---

## 3. Spesifikasi Fungsional (Fase 1)

### FR-01: Autentikasi & Isolasi Divisi

- Endpoint `/register` tidak tersedia; akun dibuat sepenuhnya oleh Admin.
- Login menggunakan `email` atau `nim` + `password` via Laravel Sanctum (Bearer token).
- User nonaktif (`is_active = false`) tidak bisa login. User dengan `must_change_password = true` wajib ganti password dulu.
- Backend Policy wajib memvalidasi bahwa pengguna non-Admin hanya bisa mengakses/memodifikasi data yang `division_id`-nya identik dengan `research_division_id` miliknya.

### FR-02: Manajemen Materi Pembelajaran (Link-Based)

- Asisten Aktif / Admin menambah materi lewat tautan eksternal (tidak ada *rich-text editor* panjang).
- **Atribut:** `title`, `description`, `sort_order`, `source_type` (`youtube`, `drive`, `other`), `url`, `division_id`, `is_published`.
- UI menampilkan kartu materi berurut dengan *badge* sumber, tombol buka tautan, dan *embed preview* untuk YouTube.

### FR-03: Manajemen Tugas & Hybrid Submission

- **Pembuatan tugas (Asisten Aktif / Admin):** `title`, `description`, `due_at`, `allow_late`, `max_file_size_mb` (default `10`), `allowed_extensions`, `max_score` (default `100`), `status` (`draft`/`published`).
- **Pengumpulan (Asisten Magang):**
  1. **Direct file upload:** ukuran maksimal sesuai `assignment.max_file_size_mb`. Format diizinkan (whitelist global): `pdf, zip, rar, doc, docx, ppt, pptx, png, jpg, jpeg`. `allowed_extensions` per tugas adalah subset whitelist ini (`null` = seluruh whitelist).
  2. **Fallback Google Drive link:** input URL (`drive_link`) jika file melebihi batas.
  - **Validasi:** minimal salah satu (`file` atau `drive_link`) wajib diisi (ditegakkan juga oleh CHECK constraint DB). Kirim ulang sebelum nilai di-*publish* menghapus file lama dari *storage* dan memperbarui data. `is_late = true` jika `submitted_at > due_at`.

### FR-04: Sistem Penilaian (Draft vs Published)

- Asisten Aktif menilai dengan `score` (`0`–`max_score`) dan `feedback`.
- Nilai baru otomatis **`draft`**. Backend **wajib menyembunyikan** nilai `draft` dari endpoint Asisten Magang (magang hanya melihat *"Menunggu Penilaian"*).
- Tombol **Publish Nilai** (satuan maupun *bulk* per tugas). Saat `published`, nilai muncul di akun magang dan memicu notifikasi otomatis.

### FR-05: Sistem Notifikasi & Pengumuman Divisi

- **Otorisasi ketat:** hanya `admin` atau `asisten_aktif` dengan `is_coordinator = true` yang dapat mengirim pengumuman.
- Koordinator mengirim ke asisten magang di divisi risetnya: server memaksa `research_division_id` = divisi koordinator dan `target_role = asisten_magang`, mengabaikan field target dari client. Admin memilih divisi spesifik atau *broadcast* global (`research_division_id = null`), dan opsional mempersempit ke satu role (`target_role`).
- Status baca pengumuman disimpan di `announcement_reads`.
- Notifikasi in-app (pengumuman baru, tugas dipublish, nilai dipublish/diperbarui) memakai tabel `notifications` bawaan Laravel (database channel). Ikon lonceng di navbar menampilkan jumlah notifikasi *unread*, diperbarui dengan polling 60 detik. Tanpa email dan tanpa WebSocket.

---

## 4. Skema Database (MySQL 8)

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

---

## 5. Edge Cases & Keputusan Desain

**User & role**

1. Admin tidak punya divisi riset (`research_division_id = null`, dipaksa model). Asisten Aktif dan Magang wajib punya tepat satu divisi riset.
2. `is_coordinator` hanya valid untuk Asisten Aktif. Jika role diubah ke Magang atau Admin, flag otomatis di-reset ke `false` (dipaksa model). Satu divisi boleh punya lebih dari satu koordinator.
3. Asisten Magang tidak boleh masuk divisi lomba. Keanggotaan lomba hanya untuk Asisten Aktif (Fase 2).
4. Admin tidak bisa menghapus atau menonaktifkan dirinya sendiri, dan sistem menolak aksi yang menyisakan nol admin aktif.
5. User nonaktif: login ditolak dan semua token Sanctum-nya dicabut saat dinonaktifkan.
6. Akun dibuat admin dengan password sementara dan `must_change_password = true`. Selama flag aktif, semua endpoint kecuali ganti password dan logout mengembalikan `403 PASSWORD_CHANGE_REQUIRED`. Lupa password ditangani admin lewat reset.
7. Pindah divisi riset: riwayat submission dan nilai tetap tersimpan (terikat ke tugas). Akses ke materi/tugas divisi lama langsung hilang.

**Divisi**

8. Divisi tidak bisa dibuat/dihapus lewat API (diisi seeder). Hanya divisi `is_optional = true` (Teknofest) yang bisa di-toggle `is_active`.
9. Divisi opsional nonaktif: anggota tetap tercatat, divisi disembunyikan dari UI non-admin dan tidak bisa diberi anggota baru.

**Materi & tugas**

10. Akses lintas divisi menghasilkan `404`, bukan `403`, agar keberadaan resource tidak bocor.
11. Server memvalidasi format URL materi dan mendeteksi `source_type` dari host: `youtube.com`/`youtu.be` → `youtube`, `drive.google.com`/`docs.google.com` → `drive`, lainnya → `other`. YouTube ditampilkan sebagai embed.
12. Tugas `draft` tidak terlihat oleh magang. Notifikasi "tugas baru" dikirim saat tugas dipublish.
13. Tugas dihapus memakai soft delete. File submission tetap ada sampai dibersihkan job terjadwal.
14. Mengubah `max_file_size_mb` tidak membatalkan submission lama; batas baru berlaku untuk submit berikutnya.

**Submission hybrid**

15. `file` wajib jika `drive_link` kosong, dan sebaliknya. Boleh keduanya.
16. File melebihi `max_file_size_mb` ditolak `422 FILE_TOO_LARGE` dengan petunjuk memakai link Drive. FE melakukan pre-check ukuran, server tetap otoritatif.
17. `max_file_size_mb` per tugas dibatasi 1–50 MB (batas global 50 MB, `LMS_MAX_UPLOAD_MB`). `upload_max_filesize`, `post_max_size` (PHP), dan `client_max_body_size` (Nginx) wajib diset sedikit di atas batas global; tanpa itu server menolak `413` sebelum Laravel berjalan.
18. Link Drive wajib HTTPS dengan host `drive.google.com` atau `docs.google.com`. Server tidak bisa memeriksa izin share, jadi UI mengingatkan "Anyone with the link can view".
19. Satu submission per (tugas, magang). Submit ulang menimpa yang lama (file lama dihapus) selama deadline belum lewat dan nilai belum dipublish.
20. Lewat deadline: ditolak kecuali `allow_late = true`; submission terlambat diberi `is_late`.
21. Nama file disimpan ulang dengan UUID (`submissions/{assignment_id}/{uuid}.{ext}`) untuk mencegah path traversal; nama asli di `file_name`.

**Penilaian**

22. Nilai di tabel `grades`, unik per (tugas, magang); `submission_id` nullable agar magang yang tidak mengumpulkan bisa dinilai.
23. Nilai baru selalu `draft`. Magang tidak menerima field nilai sama sekali selama draft (difilter di query, bukan disembunyikan di UI).
24. Publish per magang atau massal per tugas. Saat publish, magang menerima notifikasi.
25. Nilai published masih bisa diedit (tetap `published`) atau di-unpublish kembali ke `draft`.

**Pengumuman**

26. Admin menargetkan: semua (`research_division_id = null`, `target_role = null`), per divisi, per role, atau kombinasi divisi + role.
27. Koordinator hanya bisa ke asisten magang di divisi risetnya; field target dari koordinator diabaikan, server memaksa `research_division_id` = divisi koordinator dan `target_role = asisten_magang`.
29. Pengumuman terlihat oleh user jika (`research_division_id` = divisi user ATAU `null`) DAN (`target_role` = role user ATAU `null`). Admin melihat semua.
30. Setiap pengumuman, tugas dipublish, dan nilai dipublish/diperbarui membuat baris di `notifications` untuk tiap penerima.
28. Asisten Aktif non-koordinator yang memanggil endpoint pengumuman menerima `403`.

---

## 6. Konvensi API, Middleware & Policy

### 6.1 Konvensi

- **Base URL:** `/api/v1`. Header: `Accept: application/json`, `Authorization: Bearer <token>` (kecuali login).
- **Waktu:** ISO 8601 UTC (`2026-12-01T16:59:59Z`). FE mengonversi ke WIB.
- **Naming:** JSON `snake_case`. Semua response melalui Laravel API Resource.
- **Pagination:** `page`, `per_page` (default 15, max 100). Filter lewat query string (`?search=&role=&division_id=`).

Envelope sukses (`meta` hanya pada list; `message` opsional, dipakai FE sebagai Toast):

```json
{ "data": { }, "meta": { "current_page": 1, "per_page": 15, "total": 42, "last_page": 3 }, "message": "Berhasil" }
```

Envelope error:

```json
{ "message": "Ukuran file melebihi batas 10 MB. Gunakan link Google Drive.", "code": "FILE_TOO_LARGE", "errors": { "file": ["Ukuran file maksimal 10 MB."] } }
```

| HTTP | `code` | Kapan |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | Token tidak ada, salah, atau dicabut |
| 403 | `FORBIDDEN` | Role tidak berhak |
| 403 | `ACCOUNT_INACTIVE` | User dinonaktifkan |
| 403 | `PASSWORD_CHANGE_REQUIRED` | `must_change_password = true` |
| 404 | `NOT_FOUND` | Resource tidak ada atau di luar divisi user |
| 409 | `DEADLINE_PASSED` / `GRADE_LOCKED` | Submit setelah deadline / submit ulang setelah nilai publish |
| 413 | `PAYLOAD_TOO_LARGE` | Ditolak server sebelum Laravel |
| 422 | `VALIDATION_ERROR` / `FILE_TOO_LARGE` | Validasi gagal (pesan bahasa Indonesia) |
| 422 | `CANNOT_CHANGE_OWN_ROLE` / `CANNOT_DEACTIVATE_SELF` / `CANNOT_DELETE_SELF` / `CANNOT_RESET_SELF` / `LAST_ADMIN` / `NOT_ASISTEN_AKTIF` / `DIVISION_NOT_OPTIONAL` / `ALREADY_PUBLISHED` | Aturan bisnis; response juga berisi `errors` per field |
| 429 | `TOO_MANY_REQUESTS` | Rate limit |

FE: `401` memicu logout dan redirect ke `/login`. `403 PASSWORD_CHANGE_REQUIRED` redirect ke `/change-password`.

### 6.2 Middleware (alias di `bootstrap/app.php`)

| Alias | Fungsi |
| --- | --- |
| `auth:sanctum` | Wajib login |
| `active` | `EnsureUserIsActive`: tolak user nonaktif |
| `pwd.changed` | `EnsurePasswordChanged`: blok semua kecuali ganti password dan logout |
| `role:admin` / `role:asisten_aktif,admin` / `role:asisten_magang` | `EnsureRole` |
| `coordinator` | `EnsureCoordinator`: `asisten_aktif` dan `is_coordinator = true` |
| `throttle:login` | 5 percobaan per menit per (login + IP) dan 30 per menit per IP. Header `Retry-After` terbaca FE (CORS `exposed_headers`) |
| `throttle:api` | 60 request per menit per user |

Grup default endpoint terautentikasi: `auth:sanctum, active, pwd.changed`.

### 6.3 Gate & Policy

`Gate::before` memberi `true` untuk admin, kecuali ability `submit` (admin tidak mengumpulkan tugas) dan `viewOwnGrades`.

| Policy | Aturan inti |
| --- | --- |
| `MaterialPolicy` | `viewAny/view`: user di divisi yang sama, magang hanya `is_published`. `create/update/delete`: Asisten Aktif dengan `division_id == research_division_id` |
| `AssignmentPolicy` | Sama seperti Materi. Magang hanya `status = published` |
| `SubmissionPolicy` | `create`: magang di divisi tugas, tugas published, deadline belum lewat (atau `allow_late`), nilai belum publish. `view/download`: pemilik, Asisten Aktif divisi tugas, admin |
| `GradePolicy` | `upsert/publish/unpublish`: Asisten Aktif divisi tugas. `view`: magang hanya miliknya dan `status = published` |
| `AnnouncementPolicy` | `create`: admin atau koordinator. `delete`: penulis atau admin |
| `UserPolicy` | Admin saja. Tolak hapus/nonaktifkan diri sendiri dan admin terakhir |

---

## 7. Endpoint

### 7.1 Auth & Profil

| Method | Path | Middleware | Keterangan |
| --- | --- | --- | --- |
| POST | `/auth/login` | `throttle:login` | Login (`login` = email atau NIM, + `password`, `device_name`), terbitkan token (berlaku 7 hari, `SANCTUM_EXPIRATION`) |
| POST | `/auth/logout` | `auth:sanctum` | Cabut token saat ini |
| GET | `/auth/me` | `auth:sanctum, active` | Profil + izin (untuk route guard FE) + `unread_notifications_count` |
| PUT | `/auth/password` | `auth:sanctum, active` | Ganti password (dikecualikan dari `pwd.changed`) |
| PUT | `/auth/profile` | grup default | Ubah nama, phone, avatar |

`POST /auth/login` request `{ "login": "apip@aptrg.id", "password": "...", "device_name": "web-chrome" }`. Response `200`:

```json
{
  "data": {
    "token": "12|f8Kq...",
    "token_type": "Bearer",
    "user": {
      "id": 7, "name": "Ruddy", "email": "apip@aptrg.id", "nim": null, "phone": null,
      "role": "asisten_aktif", "is_coordinator": true, "is_active": true, "must_change_password": false,
      "research_division": { "id": 2, "slug": "system", "name": "System" },
      "competition_divisions": [ { "id": 5, "name": "Fixed Wing", "team_name": "Bangau Team", "position": null } ],
      "permissions": ["material.manage", "assignment.manage", "grade.publish", "announcement.send"],
      "last_login_at": "2026-11-28T03:00:00.000000Z", "created_at": "2026-11-20T01:00:00.000000Z"
    }
  }
}
```

Objek `user` ini (`UserResource`) dipakai sama di semua endpoint yang mengembalikan user. Error: `422` (pesan generik "Email/NIM atau password salah."), `403 ACCOUNT_INACTIVE` (hanya jika password benar), `429`. `permissions` dihitung server dari role + flag; FE memakainya untuk menu saja, bukan otorisasi.

`PUT /auth/password`: `current_password`, `password`, `password_confirmation`. Min 8 karakter, huruf + angka, beda dari lama. Sukses: `must_change_password = false`, token lain dicabut.

`PUT /auth/profile`: `multipart/form-data` `name`, `phone`, `avatar` (image, max 2 MB, disimpan ke `avatar_path`). Email dan role tidak bisa diubah sendiri.

### 7.2 Admin (User & Divisi)

Grup default + `role:admin`.

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/admin/dashboard` | Statistik ringkas |
| GET | `/admin/users` | Filter `search`, `role`, `division_id`, `is_active`, `is_coordinator` |
| POST | `/admin/users` | Buat user |
| GET | `/admin/users/{user}` | Detail |
| PUT | `/admin/users/{user}` | Ubah data, role, divisi riset, `is_coordinator` |
| PATCH | `/admin/users/{user}/status` | Aktif/nonaktif (cabut semua token) |
| POST | `/admin/users/{user}/reset-password` | Generate password sementara |
| PUT | `/admin/users/{user}/competition-divisions` | Sync keanggotaan lomba (Fase 2) |
| DELETE | `/admin/users/{user}` | Soft delete |
| GET | `/divisions` | Semua user login. Non-admin hanya divisi aktif |
| PATCH | `/admin/divisions/{division}` | Toggle `is_active`, hanya `is_optional = true` (`422 DIVISION_NOT_OPTIONAL`) |

`GET /admin/users`: query `search` (nama/email/NIM), `role`, `division_id`, `is_active` (`1`/`0`), `is_coordinator` (`1`/`0`), `page`, `per_page` (default 15, max 100). Urut nama. Response paginasi bawaan Laravel: `{ "data": [<UserResource>], "links": {...}, "meta": { "current_page", "per_page", "total", "last_page", ... } }`.

`POST /admin/users` body: `name`, `email`, `nim`, `phone`, `role`, `research_division_id`, `is_coordinator`, `password` (nullable). Validasi:

- `email` dan `nim` unik, termasuk terhadap user yang sudah dihapus (soft delete) → `422` "sudah digunakan".
- `research_division_id` wajib jika role bukan admin, harus divisi `type = research`; admin dipaksa `null`.
- `is_coordinator` hanya `true` untuk `asisten_aktif`; selain itu dipaksa `false`.
- `password` `null` → server generate 12 karakter acak. `must_change_password` selalu `true`.

Response `201` (juga bentuk `POST /admin/users/{user}/reset-password`, status `200`):

```json
{ "data": { "user": <UserResource>, "temporary_password": "Xk82-pLm4-Qa" }, "message": "User berhasil dibuat." }
```

`temporary_password` hanya muncul di response ini; `null` jika admin mengisi password sendiri. Reset password juga mencabut semua token user, dan ditolak untuk akun admin itu sendiri (`422 CANNOT_RESET_SELF`).

`GET`/`PUT /admin/users/{user}` → `{ "data": <UserResource> }`. PUT: semua field opsional. Role diubah dari `asisten_aktif` membuat `is_coordinator = false` dan keanggotaan lomba dihapus.

`PATCH /admin/users/{user}/status` `{ "is_active": false }` → `{ "data": <UserResource> }`. Nonaktif mencabut semua token user.

`DELETE /admin/users/{user}` → `{ "message": "User berhasil dihapus." }`. Soft delete + cabut semua token.

`PUT /admin/users/{user}/competition-divisions`: `{ "members": [ { "division_id": 5, "position": "Pilot" } ] }` → `{ "data": <UserResource> }`. Sync (mengganti seluruh keanggotaan di divisi aktif; `[]` = kosongkan). Keanggotaan di divisi opsional yang sedang nonaktif tidak bisa dikirim, tapi tetap disimpan. Hanya `asisten_aktif` (`422 NOT_ASISTEN_AKTIF`), divisi `type = competition` dan `is_active = true`.

Proteksi (semua `422`, dengan `code` dan `errors` per field):

```json
{ "message": "Anda tidak bisa menonaktifkan akun sendiri.", "code": "CANNOT_DEACTIVATE_SELF", "errors": { "is_active": ["Anda tidak bisa menonaktifkan akun sendiri."] } }
```

| `code` | Field `errors` | Kapan |
| --- | --- | --- |
| `CANNOT_CHANGE_OWN_ROLE` | `role` | Admin mengubah role sendiri |
| `CANNOT_DEACTIVATE_SELF` | `is_active` | Admin menonaktifkan diri |
| `CANNOT_DELETE_SELF` | `user` | Admin menghapus diri |
| `CANNOT_RESET_SELF` | `user` | Admin me-reset password sendiri; pakai `PUT /auth/password` |
| `LAST_ADMIN` | `role` / `is_active` / `user` | Aksi akan menyisakan 0 admin aktif (hanya terjadi saat dua admin beraksi bersamaan) |

`GET /divisions` → `{ "data": [<Division>] }`, urut `sort_order`. `<Division>` = `id, slug, name, type, team_name, is_optional, is_active, sort_order`, ditambah `members_count` **hanya untuk admin** (divisi riset: anggota riset; divisi lomba: anggota tim). Non-admin hanya menerima divisi aktif.

`PATCH /admin/divisions/{division}` `{ "is_active": true }` → `{ "data": <Division> }`.

`GET /admin/dashboard` (pengumuman terbaru menyusul di tahap pengumuman):

```json
{
  "data": {
    "users": { "admin": 1, "asisten_aktif": 2, "asisten_magang": 3, "inactive": 0 },
    "pending_grading": 2,
    "divisions": [
      { "division": { "id": 1, "slug": "mechanic", "name": "Mechanic" }, "asisten_aktif": 1, "asisten_magang": 1, "assignments_published": 3, "pending_grading": 2 }
    ]
  }
}
```

`users` menghitung semua user yang belum dihapus (aktif dan nonaktif); `inactive` adalah total user nonaktif. `divisions` hanya divisi riset. `assignments_published` = tugas published (tidak dihapus). `pending_grading` = submission yang belum punya nilai published (belum dinilai atau masih draft); angka di level atas adalah jumlah semua divisi.

### 7.3 Materi

Grup default. Visibilitas (satu aturan untuk list, detail, dan tulis): Aktif dan Magang hanya divisi risetnya; Magang hanya `is_published = true`; Admin semua divisi. Resource yang tidak terlihat → `404 NOT_FOUND`. Magang yang menulis di divisinya → `403 FORBIDDEN`.

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/materials` | Filter `source_type`, `search` (judul/deskripsi), `division_id` (admin). Urut divisi lalu `sort_order`. Paginasi standar (`per_page` max 100) |
| GET | `/materials/{material}` | `{ data: <Material> }` |
| POST | `/materials` | Asisten Aktif / Admin. `201 { data: <Material> }` |
| PUT | `/materials/{material}` | Semua field opsional. `{ data: <Material> }` |
| DELETE | `/materials/{material}` | `{ message }` (hapus permanen) |
| PATCH | `/materials/reorder` | `{ "order": [12, 9, 10] }` → `sort_order` = posisi (1, 2, 3). Id yang tidak terlihat → `404`; id dari lebih dari satu divisi (admin) → `422` (`errors.order`) |

Body POST/PUT: `title` (wajib, max 255), `description` (nullable, max 5000), `url` (wajib, hanya `http`/`https`, max 2048), `is_published` (default `true`), `division_id` (wajib untuk admin, divisi `type = research`; diabaikan untuk Asisten Aktif, server memakai divisinya). `source_type` dari client selalu diabaikan. Divisi materi tidak bisa dipindah lewat PUT. Materi baru ditaruh di urutan terakhir divisinya.

`source_type` dihitung server dari host (setelah membuang `www.`/`m.`): `youtube.com`/`youtu.be` → `youtube`, `drive.google.com`/`docs.google.com` → `drive`, lainnya → `other`. `embed_url` untuk YouTube (`watch?v=`, `youtu.be/`, `shorts/`, `embed/`) berbentuk `https://www.youtube-nocookie.com/embed/{id}`; `null` untuk lainnya.

```json
{
  "data": {
    "id": 12, "division": { "id": 2, "slug": "system", "name": "System" },
    "title": "Pengenalan Pixhawk", "description": "Tonton sebelum praktikum.",
    "source_type": "youtube", "url": "https://youtu.be/dQw4w9WgXcQ",
    "embed_url": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    "sort_order": 4, "is_published": true, "author": { "id": 7, "name": "Ruddy" },
    "created_at": "2026-11-28T03:00:00.000000Z", "updated_at": "2026-11-28T03:00:00.000000Z"
  }
}
```

### 7.4 Tugas

Grup default. Visibilitas sama seperti materi; Magang hanya `status = published`. Tugas yang dihapus (soft delete) → `404`.

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/assignments` | Filter `status`, `search` (judul), `due` (`upcoming` = `due_at >= sekarang`, `past`), `division_id` (admin). Urut `due_at` naik. Paginasi standar |
| GET | `/assignments/{assignment}` | `{ data: <Assignment> }` |
| POST | `/assignments` | Asisten Aktif / Admin. Selalu `draft`. `201 { data: <Assignment> }` |
| PUT | `/assignments/{assignment}` | Semua field opsional; `status` diabaikan (pakai `/publish`) |
| POST | `/assignments/{assignment}/publish` | `status = published`, `published_at`, notifikasi `assignment_published` ke semua Asisten Magang **aktif** di divisi tugas. Sudah published → `422 ALREADY_PUBLISHED` (`errors.status`) |
| DELETE | `/assignments/{assignment}` | Soft delete. `{ message }` |

Body POST/PUT: `title` (wajib, max 255), `description` (wajib), `due_at` (wajib; harus di masa depan **hanya saat create**), `allow_late` (default `false`), `max_file_size_mb` (1–`LMS_MAX_UPLOAD_MB`, default 10; batas global 50), `allowed_extensions` (nullable, subset `pdf, zip, rar, doc, docx, ppt, pptx, png, jpg, jpeg`; `null` = semua), `max_score` (1–1000, default 100), `status` (hanya `draft` saat create), `division_id` (wajib untuk admin, divisi riset; diabaikan untuk Asisten Aktif). Divisi tugas tidak bisa dipindah lewat PUT.

`<Assignment>` untuk Asisten Aktif / Admin:

```json
{
  "id": 21, "division": { "id": 2, "slug": "system", "name": "System" },
  "title": "Tugas 3 – Wiring Diagram", "description": "...", "due_at": "2026-12-05T16:59:59.000000Z",
  "allow_late": false, "max_file_size_mb": 10, "allowed_extensions": ["pdf", "zip"], "max_score": 100,
  "status": "published", "published_at": "2026-11-28T04:00:00.000000Z", "author": { "id": 7, "name": "Ruddy" },
  "created_at": "...", "updated_at": "...",
  "stats": { "total_interns": 16, "submitted": 12, "late": 1, "graded_draft": 5, "graded_published": 7 }
}
```

`total_interns` = Asisten Magang aktif di divisi tugas. `submitted`, `late`, `graded_*` menghitung semua submission/nilai tugas itu.

`<Assignment>` untuk Asisten Magang: field dasar yang sama **tanpa** `stats`, ditambah:

```json
{
  "is_overdue": false,
  "can_submit": true,
  "my_submission": { "id": 88, "method": "file", "file_name": "wiring.pdf", "file_size": 4194304, "mime_type": "application/pdf", "drive_link": null, "note": null, "is_late": false, "submitted_at": "..." },
  "my_grade": null
}
```

`my_grade` hanya berisi nilai milik magang itu sendiri yang sudah `published` (`{ id, score, feedback, status, published_at, graded_by { id, name }, updated_at }`, `score` berupa angka); selain itu `null`. Nilai draft tidak pernah dikirim. `can_submit` = tugas published DAN (deadline belum lewat ATAU `allow_late`) DAN nilai belum published. `method` = `file` | `drive` | `both`.

Notifikasi `assignment_published` (tabel `notifications`, `type = "assignment_published"`): `data = { title: "Tugas baru: <judul>", excerpt, link: "/assignments/{id}", assignment_id }`.

### 7.5 Submission Hybrid & Penilaian

| Method | Path | Policy | Keterangan |
| --- | --- | --- | --- |
| POST | `/assignments/{assignment}/submission` | `role:asisten_magang`, `SubmissionPolicy@create` | Kumpulkan / kumpulkan ulang |
| GET | `/assignments/{assignment}/submission` | `role:asisten_magang` | Submission saya |
| DELETE | `/assignments/{assignment}/submission` | `delete` | Tarik sebelum deadline |
| GET | `/assignments/{assignment}/submissions` | `role:asisten_aktif,admin`, `viewAny` | Semua magang divisi + status submit & nilai |
| GET | `/submissions/{submission}/download` | `view` | Stream file privat (`Content-Disposition: attachment`) |
| PUT | `/assignments/{assignment}/grades/{user}` | `GradePolicy@upsert` | Input/ubah nilai |
| POST | `/assignments/{assignment}/grades/publish` | `GradePolicy@publish` | Publish massal (`user_ids` opsional, kosong = semua draft) |
| POST | `/grades/{grade}/unpublish` | `GradePolicy@publish` | Kembali ke draft |
| GET | `/me/grades` | `role:asisten_magang` | Nilai saya (published saja) + rata-rata |

`POST /assignments/{assignment}/submission` (`multipart/form-data`):

| Field | Aturan |
| --- | --- |
| `file` | `required_without:drive_link`, `max:{max_file_size_mb*1024}` KB, `mimes:{allowed_extensions}` |
| `drive_link` | `required_without:file`, `url`, HTTPS, host `drive.google.com`/`docs.google.com` |
| `note` | opsional, max 1000 |

Urutan cek server: (1) Policy: magang di divisi tugas, tugas published. (2) Deadline lewat tanpa `allow_late` → `409 DEADLINE_PASSED`. (3) Nilai published → `409 GRADE_LOCKED`. (4) Validasi field, file terlalu besar → `422 FILE_TOO_LARGE` dengan `meta.fallback = "drive_link"`. (5) Simpan file, hapus file lama, upsert submission dalam satu transaksi. Response `201` (baru) / `200` (ulang) dengan `method` = `file` | `drive` | `both`.

`GET /assignments/{assignment}/submissions`: filter `status` (`submitted`, `missing`, `late`, `graded_draft`, `graded_published`), `search`. Mengembalikan semua magang di divisi tugas, termasuk yang belum submit, plus `meta` hitungan.

`PUT /assignments/{assignment}/grades/{user}`: `{ "score": 85, "feedback": "..." }`. `score` 0–`max_score`, `{user}` harus magang di divisi tugas. Grade baru `draft`; jika sudah `published`, diperbarui dan tetap `published` dengan notifikasi "nilai diperbarui".

### 7.6 Pengumuman & Notifikasi

| Method | Path | Policy | Keterangan |
| --- | --- | --- | --- |
| GET | `/announcements` | grup default | Yang menargetkan saya. Admin melihat semua |
| GET | `/announcements/sent` | `create` | Riwayat yang saya kirim |
| POST | `/announcements` | `create` (admin atau koordinator) | Kirim |
| GET | `/announcements/{announcement}` | `view` | Detail |
| DELETE | `/announcements/{announcement}` | `delete` | Hapus |
| POST | `/announcements/{announcement}/read` | grup default | Tandai pengumuman dibaca (`announcement_reads`) |
| GET | `/notifications` | grup default | Notifikasi saya, filter `unread=1`, paginasi |
| GET | `/notifications/unread-count` | grup default | Badge lonceng (polling 60 detik) |
| PATCH | `/notifications/{id}/read` | grup default | Tandai satu notifikasi dibaca |
| POST | `/notifications/read-all` | grup default | Tandai semua notifikasi dibaca |

Admin: `{ "title": "...", "body": "...", "research_division_id": null, "target_role": "asisten_magang" }`. Koordinator: `{ "title": "...", "body": "..." }`; field target diabaikan, server memaksa `research_division_id` = divisi koordinator dan `target_role = asisten_magang`.

Response menyertakan `target` (`division`, `role`), `author`, `recipients_count`.

`GET /notifications` response:

```json
{
  "data": [
    { "id": "9b1e...", "type": "announcement", "title": "Deadline Tugas 3 diperpanjang", "excerpt": "Diperpanjang sampai...", "link": "/announcements/14", "read_at": null, "created_at": "2026-11-28T05:00:00Z" },
    { "id": "a77c...", "type": "grade_published", "title": "Nilai Tugas 2 sudah keluar", "excerpt": "Skor: 90", "link": "/assignments/18", "read_at": "2026-11-27T09:00:00Z", "created_at": "2026-11-27T08:00:00Z" }
  ],
  "meta": { "current_page": 1, "total": 23, "unread_count": 4 }
}
```

Tipe notifikasi: `announcement`, `assignment_published`, `grade_published`, `grade_updated`. `link` adalah path FE, bukan URL API.

---

## 8. Panduan UI/UX

**Prinsip:** bersih, padat informasi tapi tidak sesak, satu aksi utama per halaman, status selalu terlihat lewat Badge, setiap aksi memberi umpan balik lewat Toast.

**Token & tema**

- Pakai warna, radius, dan font dari `theme.css` via CSS variable Shadcn (`--primary`, `--muted`, `--destructive`, `--radius`). Jangan hardcode hex.
- Dukung light dan dark mode (toggle di menu user).
- Spasi kelipatan 4 px (`gap-4`, `p-6` untuk Card, `space-y-6` antar seksi).
- Tipografi: judul halaman `text-2xl font-semibold`, judul Card `text-base font-medium`, teks bantu `text-sm text-muted-foreground`.
- Transisi halus `transition-all duration-200 ease-out` pada hover kartu, tombol, modal. Hindari animasi berat.

**App shell (semua role)**

- `SidebarProvider` + `Sidebar` (collapsible ke ikon di desktop, `Sheet` di mobile < 768 px).
- Header sidebar: logo + "APTRG LMS" + Badge divisi riset user. Footer: `DropdownMenu` user (avatar, nama, role, Profil, Tema, Logout).
- Topbar: `SidebarTrigger`, `Breadcrumb`, lonceng notifikasi (`Popover` 5 terbaru + "Lihat semua") dengan Badge unread.
- Konten: max-width `7xl`; header halaman = judul + deskripsi + tombol aksi utama di kanan.

**Pemetaan komponen**

| Kebutuhan | Komponen Shadcn |
| --- | --- |
| Daftar data | `Table`, `Input` search, `Select` filter, `Pagination` |
| Ringkasan angka | `Card` statistik (angka besar + label + ikon lucide) |
| Form pendek | `Dialog` + `Form` (react-hook-form) |
| Form panjang / penilaian | `Sheet` dari kanan |
| Aksi destruktif | `AlertDialog` dengan konsekuensi spesifik |
| Umpan balik | Toast `sonner`; error menampilkan `message` dari API |
| Sub-konten | `Tabs` |
| Loading | `Skeleton` sesuai bentuk konten |
| Kosong | Empty state: ikon, satu kalimat, tombol aksi (jika berhak) |
| Progres upload | `Progress` |
| Toggle divisi | `Switch` |
| Aksi baris | `DropdownMenu` titik tiga |
| Info tambahan | `Tooltip`, `HoverCard` |

**Bahasa Badge**

| Status | Varian | Teks |
| --- | --- | --- |
| Nilai draft | `secondary` | Draft |
| Nilai published | `default` | Published |
| Tugas draft | `outline` | Draft |
| Sudah dikumpulkan | `default` (hijau) | Terkumpul |
| Belum dikumpulkan | `outline` | Belum |
| Terlambat | `destructive` | Terlambat |
| Deadline < 24 jam | `secondary` (kuning) | Segera |
| User nonaktif | `destructive` outline | Nonaktif |
| Koordinator | `outline` + ikon bintang | Koordinator |
| Tipe materi | `outline` + ikon | YouTube / Drive / Lainnya |

**Pola interaksi**

- Mutasi: tombol disabled + spinner saat loading, Toast setelah selesai, invalidasi query TanStack terkait.
- `422` dipetakan ke field form (`errors.field`); error lain sebagai Toast.
- Konfirmasi wajib: hapus apa pun, nonaktifkan user, publish nilai massal, unpublish, tarik submission.
- Waktu relatif + absolut di Tooltip ("2 hari lagi" / "Jum, 5 Des 2026 23.59 WIB").
- Route guard `<RequireRole roles={[...]}>`; role salah diarahkan ke beranda role-nya.
- Aksesibilitas: tombol ikon punya `aria-label`, fokus terlihat, kontras Badge minimal AA.

---

## 9. Wireframe Deskriptif per Role

### 9.1 Halaman bersama

- **`/login`:** dua kolom di desktop (panel brand kiri, `Card` form kanan); mobile hanya Card. Field email/NIM, password (tombol tampilkan), tombol "Masuk". Teks "Akun dibuat oleh admin lab. Lupa password? Hubungi admin." Tanpa link daftar. Error kredensial: `Alert` destructive.
- **`/change-password`:** Card tengah tanpa sidebar, tiga field + indikator kekuatan. Sukses: Toast + redirect ke beranda role.
- **`/announcements` (pembaca):** list pengumuman; judul tebal jika belum dibaca, cuplikan, waktu relatif. Membuka pengumuman menandainya dibaca.
- **`/notifications`:** `Tabs` Semua / Belum dibaca, tombol "Tandai semua dibaca". Item: ikon per tipe, judul tebal + titik jika unread, cuplikan, waktu relatif. Klik membuka `link` dan menandai dibaca.
- **`/profile`:** Card profil (avatar, nama, email, NIM, role, divisi riset, divisi lomba sebagai Badge) + Card ganti password.

### 9.2 Admin

Sidebar: Dashboard, Pengguna, Divisi, Pengumuman, Materi & Tugas (mode pantau).

- **`/admin`:** 4 `Card` statistik (Asisten Aktif, Asisten Magang, User Nonaktif, Penilaian Tertunda). Grid: `Table` "Per Divisi Riset" dan "Pengumuman Terbaru".
- **`/admin/users`:** tombol "Tambah Pengguna". Toolbar cari (nama/email/NIM), `Select` Role/Divisi/Status. `Table`: Avatar+Nama, NIM, Role, Divisi, Koordinator, Status, aksi (Edit, Reset password, Nonaktifkan, Hapus). Dialog: `Select` Divisi muncul jika role bukan admin; `Switch` Koordinator hanya untuk Asisten Aktif; seksi Divisi Lomba (Fase 2) hanya Asisten Aktif. Setelah create/reset: Dialog password sementara + tombol salin + "Hanya tampil sekali".
- **`/admin/divisions`:** seksi Divisi Riset (4 Card tanpa toggle) dan Divisi Lomba (4 Card, nama tim sebagai subjudul). Teknofest punya `Switch` + Badge "Opsional"; Card nonaktif redup. Menonaktifkan memunculkan `AlertDialog`.
- **`/admin/announcements`:** list pengumuman terkirim (judul, cuplikan, Badge target, jumlah penerima, waktu, hapus). Dialog: Judul, Isi, `Select` Divisi (atau "Semua"), `Select` Role (atau "Semua"), preview "Akan dikirim ke ~N orang".

### 9.3 Asisten Aktif

Sidebar: Beranda, Materi, Tugas, Penilaian, Pengumuman (kirim hanya jika koordinator), Divisi Lomba (Fase 2, disabled + Badge "Segera").

- **`/`:** sapaan + Badge divisi (+ Koordinator). 3 Card statistik (Jumlah Magang, Tugas Aktif, Belum Dinilai). Card "Perlu Dinilai" (5 terbaru) dan "Deadline Terdekat".
- **`/materials`:** tombol "Tambah Materi", cari + `Tabs` tipe. Grid Card (thumbnail YouTube atau ikon), judul, deskripsi 2 baris, Badge tipe, Badge Draft jika belum publish, menu aksi, urutan bisa diubah. Dialog: Judul, Deskripsi, URL (deteksi tipe live), `Switch` Publish.
- **`/assignments`:** tombol "Buat Tugas", `Tabs` Aktif / Lewat Deadline / Draft. `Table`: Judul, Deadline, Status, Progres (`Progress` "12/16"), Belum dinilai, aksi. `Sheet` Buat/Edit: Judul, Deskripsi, tanggal + jam deadline, `Switch` Izinkan terlambat, Batas ukuran file (helper "Di atas batas ini, magang wajib mengirim link Google Drive"), ekstensi, Nilai maksimal. Footer "Simpan Draft" / "Publish".
- **`/assignments/:id`:** header + tombol Edit dan "Publish Semua Nilai Draft". Tab Submission: Card mini (Terkumpul, Belum, Terlambat, Draft nilai), filter, `Table` (Nama+NIM, Status, Metode, Waktu, Nilai, Status nilai, "Periksa"), checkbox untuk publish terpilih. `Sheet` Periksa: info magang, file (Unduh) atau link Drive (Buka), catatan, form skor + feedback, "Simpan Draft" / "Simpan & Publish", navigasi Sebelumnya/Berikutnya. Magang tanpa submission tetap bisa dinilai.
- **`/announcements` (koordinator):** seperti admin tanpa pilihan target. Info "Dikirim ke divisi System (N orang)". Non-koordinator tidak melihat tombol kirim.

### 9.4 Asisten Magang

Sidebar: Beranda, Materi, Tugas, Nilai, Pengumuman.

- **`/`:** sapaan + Badge divisi. Card "Tugas Mendatang" (3 terdekat + countdown), "Pengumuman Terbaru", "Progres Saya" (X/Y terkumpul, rata-rata nilai published).
- **`/materials`:** grid Card tanpa aksi edit. YouTube membuka `Dialog` embed; Drive/lainnya membuka tab baru.
- **`/assignments`:** `Tabs` Belum / Sudah / Lewat Deadline. Card: judul, deadline + countdown, Badge status, Badge nilai jika published.
- **`/assignments/:id`:** kiri deskripsi + deadline + batas file + ekstensi. Kanan Card "Pengumpulan": `Tabs` "Upload File" / "Link Google Drive". Upload: dropzone "Maks 10 MB • PDF, ZIP"; jika melebihi, pesan merah + tombol "Kirim via Google Drive". Drive: `Input` URL + `Alert` "Anyone with the link can view". Catatan opsional, tombol "Kumpulkan" disabled sampai salah satu terisi. Sudah kumpul: ringkasan + "Kumpulkan Ulang" / "Tarik" selama `can_submit`. Card "Nilai" hanya tampil jika published; jika belum: "Nilai belum dipublikasikan."
- **`/grades`:** Card ringkasan (rata-rata, jumlah dinilai) + `Table` (Tugas, Skor/Maks, Feedback, Tanggal publish), published saja.

---

## 10. Struktur Direktori Target (Clean Monorepo)

```text
aptrg-lms/
├── PRD.md
├── CLAUDE.md
├── backend/                  # Laravel 13 REST API
│   ├── app/{Enums,Models,Policies,Http}/
│   ├── database/
│   └── routes/api.php
└── frontend/                 # React + TypeScript + Vite + Shadcn/ui
    ├── src/
    │   ├── components/
    │   │   ├── ui/           # Komponen Shadcn/ui
    │   │   └── layout/       # Sidebar, Navbar, NotificationBell
    │   ├── pages/
    │   │   ├── auth/         # LoginPage, ChangePasswordPage
    │   │   ├── dashboard/    # AdminDashboard, AsistenDashboard, MagangDashboard
    │   │   ├── materials/    # MaterialListPage
    │   │   ├── assignments/  # AssignmentListPage, AssignmentDetailPage
    │   │   ├── announcements/# AnnouncementPage
    │   │   └── admin/        # UserManagementPage, DivisionManagementPage
    │   ├── services/         # Axios API client & endpoints
    │   ├── hooks/            # AuthContext & custom hooks
    │   ├── types/            # Interface TypeScript sesuai API Resource
    │   └── styles/           # theme.css & tailwind.css
    └── package.json
```

---

## 11. Pertanyaan Terbuka

Keputusan:

1. Auth Bearer token (bukan cookie). Satu divisi riset per asisten. Submit ulang sampai deadline. Flag `allow_late` per tugas. Skala nilai numerik 0–`max_score`.
2. Notifikasi memakai tabel `notifications` bawaan Laravel. `announcement_reads` tetap untuk status baca pengumuman.
3. Pengumuman koordinator: server memaksa `target_role = asisten_magang` dan divisi riset koordinator.
4. Batas global upload 50 MB.
5. Admin boleh membuat materi/tugas di divisi mana pun (wajib `division_id`).
6. Fase 2 lomba belum punya materi/tugas sendiri; `division_id` generik cukup.
7. Notifikasi real-time: polling 60 detik, tanpa Laravel Reverb.
8. Tanpa email; notifikasi in-app saja.
9. Audit nilai (`grade_logs`) ditunda.

Masih terbuka: tidak ada.
