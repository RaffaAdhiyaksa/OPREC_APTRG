# Frontend Handoff — APTRG LMS

Dokumen ini untuk **Achmad** dan **AI coding assistant**-nya. Tujuannya: melanjutkan pengerjaan **frontend** APTRG LMS tanpa mengganggu pengerjaan **backend** yang dilanjutkan Afif (Ruddy).

> **Untuk AI:** baca dokumen ini sampai habis, lalu baca `CLAUDE.md` dan `PRD.md` di root repo sebelum menulis kode apa pun. `CLAUDE.md` dan `PRD.md` adalah sumber kebenaran. Jika dokumen ini bertentangan dengan keduanya, ikuti `CLAUDE.md`/`PRD.md` dan catat perbedaannya di `docs/API_QUESTIONS.md`.

---

## 1. Konteks proyek

- Web lama Lab APTRG (Open Recruitment & Open Mind) sudah **dihapus total**. Kodenya masih bisa dilihat di tag git `legacy-oprec`.
- Penggantinya: **APTRG LMS**, Learning Management System internal untuk Asisten Magang.
- Monorepo:
  - `backend/`: Laravel 13 REST API + Sanctum (Bearer token) + MySQL 8.
  - `frontend/`: React 18 + TypeScript + Vite 6 + Tailwind 4 + Shadcn/ui.
- Tidak ada registrasi publik. Semua akun dibuat Admin.
- Tiga role: `admin`, `asisten_aktif` (bisa punya flag `is_coordinator`), `asisten_magang`.
- Divisi riset (Fase 1): Mechanic, System, Ground Control Station (GCS), Non-Technical. Divisi lomba (Fase 2, hanya disiapkan di DB): Fixed Wing (Bangau Team), Racing Plane (Frigate Team), LELA (Strix Team), Teknofest (Avalerion Team, opsional, bisa di-toggle Admin).
- Aturan bisnis penting (detail di `PRD.md`):
  - Asisten Aktif dan Magang hanya melihat data divisi risetnya sendiri.
  - Nilai punya status `draft` dan `published`. Magang **tidak pernah** melihat nilai draft.
  - Pengumuman hanya bisa dikirim Admin atau Asisten Aktif dengan `is_coordinator = true` (khusus ke magang di divisinya).
  - Submission tugas bersifat hybrid: upload file (jika ukuran <= `max_file_size_mb` tugas) **atau** link Google Drive. Minimal salah satu wajib diisi.

## 2. Pembagian kerja & aturan kolaborasi

> **Diperbarui:** frontend dan backend kini dipegang satu maintainer. Aturan terbaru ada di `CLAUDE.md` §9: satu PR hanya mengubah satu sisi (`frontend/` ATAU `backend/`), kecuali docs. Tabel pembagian per orang di bawah tidak berlaku lagi.

| Sisi | Prefix branch |
|---|---|
| Backend | `feat/be-...`, `fix/be-...` |
| Frontend | `feat/fe-...`, `fix/fe-...` |

Aturan:

1. **Jangan pernah commit langsung ke `main`.** Buat branch dari `main`, lalu buka Pull Request. Satu fase = satu branch = satu PR.
2. **PR frontend tidak mengubah backend.** Jika butuh field/endpoint baru atau menemukan respons API yang beda dari kontrak, tulis di `docs/API_QUESTIONS.md` (format di bagian 10), lalu kerjakan di PR backend terpisah.
3. File bersama (`README.md`, `.gitignore`) hanya diubah setelah koordinasi.
4. Sebelum mulai kerja setiap hari: `git checkout main && git pull`, lalu rebase atau merge `main` ke branch kerja.
5. Commit memakai Conventional Commits: `feat(fe): ...`, `fix(fe): ...`, `refactor(fe): ...`, `chore(fe): ...`.

## 3. Status backend saat ini

| Tahap | Isi | Status |
|---|---|---|
| 1 | Restrukturisasi monorepo | Selesai |
| 2 | Laravel 13 + Sanctum + CORS | Selesai |
| 3 | Migrasi, enum, model, seeder | Selesai |
| 4 | Format error JSON, middleware, endpoint Auth | **Selesai, siap dipakai frontend** |
| 5 | Endpoint Admin (user, divisi), limiter per IP, pesan validasi bahasa Indonesia, masa berlaku token | Belum |
| 6 | Endpoint Materi + Tugas | Belum |
| 7 | Endpoint Submission hybrid + Penilaian | Belum |
| 8 | Endpoint Pengumuman + Notifikasi | Belum |

Konsekuensi: **hanya fitur Auth yang bisa memakai backend asli sekarang.** Semua fitur lain dibangun dengan **mock** yang mengikuti kontrak di `PRD.md` (lihat bagian 6). Saat endpoint backend selesai, mock untuk domain itu dimatikan.

## 4. Setup lokal (Windows + Laragon)

Kebutuhan: PHP 8.3+, Composer, MySQL 8 (Laragon), Node.js 22 LTS, Git.

### Backend (wajib jalan untuk login)

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Edit `backend/.env`:

```
DB_DATABASE=aptrg_lms
DB_USERNAME=root
DB_PASSWORD=
FRONTEND_URL=http://localhost:5173
SEED_DEFAULT_PASSWORD=isi_password_bebas_minimal_8_karakter
```

Buat database kosong `aptrg_lms` lewat HeidiSQL/phpMyAdmin Laragon, lalu:

```powershell
php artisan migrate --seed
php artisan serve
```

Backend jalan di `http://localhost:8000`. Cek: buka `http://localhost:8000/api/v1/health`.

Akun seed (password = nilai `SEED_DEFAULT_PASSWORD` di `.env` masing-masing):

| Email | Role | Divisi | Catatan |
|---|---|---|---|
| `admin@aptrg.test` | admin | – | |
| `koordinator@aptrg.test` | asisten_aktif | System | `is_coordinator = true`, anggota lomba Fixed Wing |
| `aktif@aptrg.test` | asisten_aktif | Mechanic | bukan koordinator |
| `magang1@aptrg.test` | asisten_magang | System | |
| `magang2@aptrg.test` | asisten_magang | Mechanic | |

Jika `.env` backend jangan pernah di-commit. `backend/.env` sudah ada di `.gitignore`.

### Frontend

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Isi `frontend/.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCKS=true
```

`VITE_API_BASE_URL` tanpa trailing slash dan tanpa `/api/v1`. Client menambahkan `/api/v1` sendiri.

## 5. Kontrak API yang sudah jalan (Auth)

Semua request wajib header `Accept: application/json`. Request terautentikasi memakai `Authorization: Bearer <token>`.

### Format error (semua endpoint)

```json
{ "message": "Pesan untuk ditampilkan", "code": "KODE_ERROR", "errors": { "field": ["pesan"] } }
```

`errors` hanya ada pada error validasi. Kode yang harus ditangani frontend:

| HTTP | `code` | Tindakan frontend |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Hapus token, redirect ke `/login` |
| 403 | `ACCOUNT_INACTIVE` | Hapus token, tampilkan pesan akun nonaktif di halaman login |
| 403 | `PASSWORD_CHANGE_REQUIRED` | Redirect ke `/change-password` |
| 403 | `FORBIDDEN` | Toast error, jangan logout |
| 404 | `NOT_FOUND` | Tampilkan halaman/empty state "tidak ditemukan" |
| 422 | `VALIDATION_ERROR` | Petakan `errors` ke field form (`setError` react-hook-form) |
| 429 | `TOO_MANY_REQUESTS` | Tampilkan pesan + sisa detik dari header `Retry-After` |

Catatan: pesan validasi bawaan Laravel saat ini masih bahasa Inggris. Backend Tahap 5 akan mengubahnya ke bahasa Indonesia. Frontend cukup menampilkan `message`/`errors` apa adanya.

### POST `/api/v1/auth/login`

Request:

```json
{ "login": "magang1@aptrg.test", "password": "rahasia", "device_name": "web" }
```

`login` menerima email **atau** NIM. `device_name` wajib.

Response 200:

```json
{
  "data": {
    "token": "5|xxxx",
    "token_type": "Bearer",
    "user": {
      "id": 4,
      "name": "Magang System",
      "email": "magang1@aptrg.test",
      "nim": null,
      "role": "asisten_magang",
      "is_coordinator": false,
      "is_active": true,
      "must_change_password": false,
      "research_division": { "id": 2, "slug": "system", "name": "System" },
      "competition_divisions": [],
      "permissions": []
    }
  }
}
```

Error: 422 (kredensial salah, pesan generik), 403 `ACCOUNT_INACTIVE`, 429 (limit 5 kali per menit per login + IP).

### GET `/api/v1/auth/me`

Response 200: `{ "data": <user seperti di atas> + "unread_notifications_count": number }`. Endpoint ini **tidak** diblokir `PASSWORD_CHANGE_REQUIRED`, jadi aman dipanggil saat bootstrap aplikasi.

### POST `/api/v1/auth/logout`

Mencabut token saat ini. Response: `{ "message": "Berhasil keluar." }`.

### PUT `/api/v1/auth/password`

```json
{ "current_password": "lama", "password": "BaruKuat123", "password_confirmation": "BaruKuat123" }
```

Aturan: minimal 8 karakter, ada huruf dan angka, beda dari password lama. Sukses: `must_change_password` menjadi `false` dan semua token **lain** milik user dicabut. Token saat ini tetap berlaku.

### `permissions`

Array string yang dihitung server. Dipakai frontend **hanya** untuk menampilkan/menyembunyikan menu dan tombol, bukan sebagai pengaman (backend tetap memvalidasi).

| Permission | Dimiliki |
|---|---|
| `user.manage` | admin |
| `material.manage`, `assignment.manage`, `grade.publish` | admin, asisten_aktif |
| `announcement.send` | admin, asisten_aktif dengan `is_coordinator = true` |

**Selalu verifikasi bentuk respons asli** dengan request nyata sebelum membuat tipe TypeScript. Jika berbeda dari dokumen ini, ikuti backend dan catat di `docs/API_QUESTIONS.md`.

## 6. Strategi untuk endpoint yang belum ada: tipe + mock

1. Buat tipe di `src/types/api.ts` berdasarkan kontrak API di `PRD.md` (user, division, material, assignment, submission, grade, announcement, notification, paginated response, error).
2. Setiap domain punya service di `src/services/<domain>.ts` yang mengekspor fungsi bertipe, misalnya `listUsers(params)`, `createUser(payload)`.
3. Implementasi mock di `src/services/mock/<domain>.ts` dengan data in-memory dan delay kecil (300 ms) agar loading state terlihat. Mock harus meniru format error yang sama (misalnya 422 dengan `errors`).
4. Service memilih implementasi berdasarkan `import.meta.env.VITE_USE_MOCKS === 'true'`. **Auth selalu memakai backend asli.**
5. Komponen dan hook **tidak boleh** tahu apakah data berasal dari mock atau API. Komponen hanya memanggil hook TanStack Query, misalnya `useUsers()`, yang memanggil service.
6. Ketika backend menyelesaikan tahap baru, ganti domain itu ke API asli, jalankan ulang alurnya, lalu perbaiki perbedaan.

## 7. Arsitektur frontend

Library yang sudah terpasang: `react-router` 7, `@tanstack/react-query` 5, `axios`, `react-hook-form`, `sonner`, `next-themes`, `lucide-react`, `date-fns`, komponen Shadcn di `src/components/ui/*`.

Boleh ditambah tanpa bertanya: `zod`, `@hookform/resolvers`, `@tanstack/react-table`. **Paket lain wajib ditanyakan dulu** ke Achmad.

Struktur folder (sesuai `PRD.md`):

```
frontend/src/
  components/ui/        # Shadcn, JANGAN di-generate ulang atau ditimpa
  components/layout/    # AppShell, AppSidebar, Topbar, NotificationBell, UserMenu
  components/shared/    # DataTable, EmptyState, StatusBadge, ConfirmDialog, PageHeader
  pages/auth/           # LoginPage, ChangePasswordPage
  pages/dashboard/      # AdminDashboard, AktifDashboard, MagangDashboard
  pages/materials/
  pages/assignments/
  pages/announcements/
  pages/admin/          # UsersPage, DivisionsPage
  services/             # api client + service per domain + mock/
  hooks/                # useAuth, hook TanStack Query per domain
  types/                # api.ts
  lib/                  # utils, format tanggal, mapping error
  styles/               # theme.css, tailwind.css, fonts.css (pertahankan)
```

Pola wajib:

- **API client** (`services/api.ts`): axios instance dengan `baseURL = VITE_API_BASE_URL + '/api/v1'`, header `Accept: application/json`, interceptor request menambahkan Bearer token, interceptor response menangani tabel kode error di bagian 5.
- **Token**: simpan di `localStorage` dengan key `aptrg_token`. Jangan pernah `console.log` token. Saat logout atau 401, hapus token dan bersihkan cache TanStack Query.
- **AuthContext** (`hooks/useAuth.tsx`): saat aplikasi dibuka, jika ada token, panggil `/auth/me`. Simpan `user`, `isLoading`, `login()`, `logout()`, `hasPermission()`.
- **Route guard**: `RequireAuth` (harus login), `RequirePasswordChanged` (jika `must_change_password` maka redirect ke `/change-password`), `RequireRole`/`RequirePermission`. Role yang salah diarahkan ke beranda role-nya, bukan halaman kosong.
- **Form**: react-hook-form + zod. Validasi frontend meniru aturan backend, tapi error 422 dari server tetap dipetakan ke field.
- **Feedback**: setiap mutasi menampilkan `toast` (sonner). Pesan sukses dan error diambil dari `message` API jika ada.
- **Bahasa UI**: Bahasa Indonesia. Tanggal ditampilkan dalam WIB dengan `date-fns` locale `id` (contoh "Jum, 5 Des 2026 23.59 WIB"). Waktu relatif ("2 hari lagi") dengan tooltip waktu absolut.
- **Styling**: pakai token dari `theme.css` (CSS variable Shadcn). Jangan hardcode warna hex di komponen.

Rute:

| Path | Role | Halaman |
|---|---|---|
| `/login` | publik | Login |
| `/change-password` | login | Ganti password (dipaksa jika `must_change_password`) |
| `/` | semua | Dashboard sesuai role |
| `/materials` | semua | Materi divisi |
| `/assignments`, `/assignments/:id` | semua | Daftar & detail tugas (tampilan beda per role) |
| `/grades` | magang | Nilai saya |
| `/announcements` | semua | Feed pengumuman, tombol "Buat" jika punya `announcement.send` |
| `/notifications` | semua | Semua notifikasi |
| `/profile` | semua | Profil |
| `/admin/users` | admin | Manajemen pengguna |
| `/admin/divisions` | admin | Manajemen divisi |

## 8. Roadmap frontend

Kerjakan berurutan. Satu fase = satu branch = satu PR.

**F1 — Fondasi** (`feat/fe-foundation`)
- Provider: QueryClient, Router, AuthProvider, ThemeProvider (`next-themes`), `<Toaster />`.
- API client + interceptor, `types/api.ts` dasar, util format tanggal dan mapping error.
- Kerangka router dengan semua rute di atas (halaman placeholder) + semua guard.
- Selesai jika: `npm run build` lulus, membuka `/` tanpa token diarahkan ke `/login`.

**F2 — Auth** (`feat/fe-auth`) — backend asli
- LoginPage: input "Email atau NIM", password dengan tombol tampilkan, tombol Masuk. Teks: "Akun dibuat oleh admin lab. Lupa password? Hubungi admin." Tanpa link daftar.
- ChangePasswordPage: tiga field + indikator kekuatan password. Sukses: toast lalu redirect ke beranda role.
- Logout dari menu user.
- Selesai jika: kelima akun seed bisa login dan diarahkan benar; password salah menampilkan error; 429 menampilkan sisa detik; logout membuat request berikutnya kembali ke `/login`.

**F3 — App shell** (`feat/fe-app-shell`)
- `SidebarProvider` + `Sidebar` Shadcn: collapsible di desktop, jadi `Sheet` di mobile (< 768 px).
- Header sidebar: logo + "APTRG LMS" + badge divisi riset. Footer: menu user (avatar, nama, role, Profil, Tema, Keluar).
- Topbar: tombol sidebar, breadcrumb, lonceng notifikasi (popover 5 terbaru + badge jumlah unread, mock).
- Menu per role:
  - Admin: Dashboard, Pengguna, Divisi, Pengumuman, Notifikasi.
  - Asisten Aktif: Beranda, Materi, Tugas, Pengumuman (hanya jika koordinator), Divisi Lomba (disabled, badge "Segera"), Notifikasi.
  - Asisten Magang: Beranda, Materi, Tugas, Nilai, Pengumuman, Notifikasi.
- Halaman Profil (data dari `/auth/me`).
- Selesai jika: setiap akun seed melihat menu yang tepat, dan hanya koordinator (bukan `aktif@`) yang melihat menu Pengumuman.

**F4 — Admin** (`feat/fe-admin`) — mock sampai backend Tahap 5 selesai
- Pengguna: tabel (cari, filter role/divisi/status), dialog tambah/edit (field Divisi muncul jika role bukan admin; switch Koordinator hanya untuk Asisten Aktif), dialog hasil password sementara (tampil sekali + tombol salin), reset password, aktif/nonaktif, hapus dengan AlertDialog.
- Divisi: grid card divisi riset (tanpa toggle) dan divisi lomba; hanya Teknofest yang punya `Switch` + badge "Opsional"; konfirmasi saat menonaktifkan.
- Dashboard admin: card statistik + tabel per divisi.

**F5 — Asisten Aktif** (`feat/fe-aktif`) — mock sampai backend Tahap 6–7 selesai
- Materi: grid card (thumbnail YouTube atau ikon Drive/Web), dialog tambah/edit dengan deteksi tipe link langsung.
- Tugas: tab Aktif/Lewat Deadline/Draft, Sheet buat/edit tugas (deadline, izinkan terlambat, batas ukuran file MB dengan helper "Di atas batas ini, magang wajib mengirim link Google Drive", ekstensi, nilai maksimal).
- Detail tugas: tabel submission semua magang (termasuk yang belum mengumpulkan), Sheet "Periksa" untuk input nilai (Simpan Draft / Simpan & Publish), publish massal dengan konfirmasi.

**F6 — Asisten Magang** (`feat/fe-magang`) — mock
- Beranda: tugas mendatang, pengumuman terbaru, progres.
- Materi: klik YouTube membuka dialog embed; Drive/Web membuka tab baru.
- Detail tugas: Tabs "Upload File" / "Link Google Drive". Cek ukuran file di browser **sebelum** upload; jika melebihi batas, tampilkan "File X MB melebihi batas Y MB" + tombol pindah ke tab Drive. Tab Drive menampilkan peringatan "Pastikan akses link: Anyone with the link can view". Progress bar saat upload. Kartu nilai hanya tampil jika nilai `published`; jika belum, teks "Nilai belum dipublikasikan." Jangan pernah menampilkan kata "draft" ke magang.
- Nilai: tabel nilai yang sudah dipublikasikan + rata-rata.

**F7 — Pengumuman & notifikasi** (`feat/fe-announcements`) — mock sampai backend Tahap 8 selesai
- Feed pengumuman untuk semua role. Dialog buat pengumuman: Admin memilih target (semua / per role / per divisi); koordinator tanpa pilihan target, dengan teks "Dikirim ke semua asisten magang divisi X".
- Halaman notifikasi (tab Semua / Belum dibaca, tandai semua dibaca), lonceng polling 60 detik.

## 9. Panduan UI/UX ringkas

Detail lengkap ada di bagian UI/UX dan wireframe `PRD.md`. Aturan yang paling sering dipakai:

- Satu aksi utama per halaman, di kanan header halaman.
- Daftar data: `Table` + `@tanstack/react-table`. Form pendek: `Dialog`. Form panjang/penilaian: `Sheet` dari kanan. Aksi destruktif: `AlertDialog` dengan konsekuensi yang spesifik.
- Loading: `Skeleton` sesuai bentuk konten. Data kosong: empty state (ikon, satu kalimat, tombol aksi jika user berhak).
- Bahasa badge harus konsisten di seluruh aplikasi:

| Status | Varian | Teks |
|---|---|---|
| Nilai draft (hanya terlihat asisten/admin) | `secondary` | Draft |
| Nilai published | `default` | Published |
| Tugas draft | `outline` | Draft |
| Sudah dikumpulkan | `default` (hijau) | Terkumpul |
| Belum dikumpulkan | `outline` | Belum |
| Terlambat | `destructive` | Terlambat |
| Deadline < 24 jam | `secondary` (kuning) | Segera |
| User nonaktif | `destructive` outline | Nonaktif |
| Koordinator | `outline` + ikon bintang | Koordinator |

- Semua tombol ikon punya `aria-label`. Fokus keyboard harus terlihat.

## 10. Definition of Done setiap PR

- [ ] `npm run build` (termasuk `tsc --noEmit`) lulus tanpa error.
- [ ] Tidak ada error/warning di console browser saat alur fase dijalankan.
- [ ] Diuji manual di browser dengan akun seed yang relevan, termasuk tampilan mobile (lebar 375 px).
- [ ] Loading, empty, dan error state ada untuk setiap data yang di-fetch.
- [ ] Tidak ada perubahan di luar `frontend/` dan `docs/FRONTEND_*.md` / `docs/API_QUESTIONS.md`.
- [ ] Deskripsi PR berisi: ringkasan, screenshot per role, daftar domain yang masih mock, dan pertanyaan baru di `docs/API_QUESTIONS.md`.

Format `docs/API_QUESTIONS.md`:

```
## <tanggal> — <endpoint atau topik>
- Temuan: <apa yang beda / kurang>
- Kebutuhan frontend: <field/endpoint/perilaku yang dibutuhkan>
- Sementara: <bagaimana frontend menanganinya sekarang>
```

## 11. Prompt untuk AI

### Prompt pertama (orientasi, belum menulis kode)

```
Kamu membantu saya (Achmad) mengerjakan FRONTEND APTRG LMS di monorepo ini. Backend dikerjakan rekan saya, jangan ubah folder backend/.

Sebelum menulis kode:
1. Baca docs/FRONTEND_HANDOFF.md sampai habis, lalu CLAUDE.md dan PRD.md (fokus: aturan RBAC, kontrak API, UI/UX dan wireframe).
2. Telusuri frontend/: package.json, vite.config.ts, tsconfig.json, src/ (termasuk daftar komponen di src/components/ui dan isi src/styles).
3. Jalankan git log --oneline -15 untuk memahami riwayat.
4. Laporkan ke saya:
   - Ringkasan pemahamanmu tentang proyek, role, dan aturan bisnis (maksimal 15 poin).
   - Endpoint backend yang sudah bisa dipakai vs yang harus di-mock.
   - Daftar komponen Shadcn yang tersedia dan yang mungkin kurang untuk roadmap F1–F7.
   - Perbedaan atau ketidakjelasan antara FRONTEND_HANDOFF.md, CLAUDE.md, dan PRD.md.
   - Rencana F1 (Fondasi): daftar file yang akan dibuat beserta isinya secara singkat.
Jangan menulis atau mengubah file apa pun di langkah ini. Tunggu konfirmasi saya.
```

### Prompt per fase (ganti `<FASE>`)

```
Kerjakan fase <FASE> dari docs/FRONTEND_HANDOFF.md bagian 8.

Aturan:
- Buat branch feat/fe-<nama-fase> dari main yang terbaru.
- Tulis asumsi + rencana file dulu. Jika ada yang ambigu, tanya, jangan menebak.
- Hanya ubah frontend/ dan docs/FRONTEND_*.md / docs/API_QUESTIONS.md.
- Pakai komponen yang sudah ada di src/components/ui. Jangan generate ulang komponen Shadcn.
- Paket baru selain zod, @hookform/resolvers, @tanstack/react-table: tanya dulu.
- Endpoint yang belum ada di backend: pakai mock sesuai bagian 6, ikuti kontrak di PRD.md.
- Teks UI bahasa Indonesia, warna dari token theme.css.

Verifikasi sebelum selesai:
- npm run build lulus.
- Jalankan alur fase di browser (npm run dev) dengan akun seed yang relevan; cek console bersih dan tampilan mobile 375 px.
- Centang Definition of Done di bagian 10.

Commit dengan Conventional Commits (feat(fe): ...), lalu STOP dan laporkan: file yang dibuat/diubah, hasil verifikasi, domain yang masih mock, dan pertanyaan untuk backend.
```

### Prompt ketika endpoint backend baru selesai

```
Backend sudah menyelesaikan Tahap <N> (<domain>). Pull main terbaru.
1. Baca perubahan di PRD.md/CLAUDE.md dan routes/api.php untuk domain <domain>.
2. Uji endpoint asli dengan request nyata, bandingkan dengan types/api.ts dan mock.
3. Ganti service <domain> ke API asli, perbaiki tipe dan UI yang beda.
4. Tutup pertanyaan terkait di docs/API_QUESTIONS.md.
Jangan ubah backend. Laporkan perbedaan yang ditemukan.
```

## 12. Tools opsional untuk AI (Claude Code)

Jika memakai Claude Code, plugin berikut membantu (pasang dengan `/plugin marketplace add ...` lalu `/plugin install ...`):

- **chrome-devtools-mcp** (`ChromeDevTools/chrome-devtools-mcp`): AI bisa membuka `localhost:5173`, login, screenshot, membaca console dan network. Sangat berguna untuk verifikasi setiap fase.
- **andrej-karpathy-skills** (`forrestchang/andrej-karpathy-skills`): AI menyatakan asumsi dulu, menulis kode minimal, dan mengubah hanya yang perlu.
- **ponytail** (`DietrichGebert/ponytail`): mengurangi kode yang tidak perlu. `/ponytail-review branch` untuk review sebelum membuka PR.

Jika memakai Gemini CLI, `GEMINI.md` di root sudah mengarahkan ke `CLAUDE.md` dan `PRD.md`.
