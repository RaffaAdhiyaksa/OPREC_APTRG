# Product Requirements Document (PRD): APTRG LMS (Clean Refactor)

- \*\*Versi:\*\* 2.0 (Full-Stack Decoupled Architecture)

- \*\*Organisasi:\*\* Laboratorium Aeromodelling and Payload Telemetry Research Group (APTRG)

- \*\*Arsitektur & Tech Stack:\*\*

  - \*\*Frontend (`/frontend`):\*\* React 18+, TypeScript, Vite, Tailwind CSS, Shadcn/ui, Lucide Icons, React Router, Axios/TanStack Query.

  - \*\*Backend (`/backend`):\*\* Laravel 11 (RESTful API), Laravel Sanctum (SPA Token/Cookie Auth), MySQL/MariaDB.

- \*\*Status Proyek:\*\* Total Refactor — Menghapus seluruh modul Open Recruitment & Open Mind lama, mempertahankan aset UI (`Shadcn/ui`, `theme.css`, `aptrg_logo.png`), dan membangun ulang sistem sebagai LMS Asisten Magang.

---

## 1. Ringkasan & Ruang Lingkup Produk

### 1.1 Tujuan Utama

Membangun Learning Management System (LMS) internal terpusat untuk mendukung proses pembinaan, distribusi materi, penugasan, penilaian transparan, dan komunikasi divisi bagi \*\*Asisten Magang APTRG\*\*.

### 1.2 Pembagian Fase Rilis

- \*\*Fase 1 (MVP - Fokus Utama Saat Ini):\*\*

  - Autentikasi & Manajemen Pengguna (tanpa registrasi publik).

  - Manajemen Struktur Divisi Riset & Lomba.

  - Modul Materi Pembelajaran berbasis tautan eksternal.

  - Modul Tugas & \*Hybrid Submission\* (Direct Upload + Fallback Link Drive).

  - Sistem Penilaian dengan kontrol visibilitas (`Draft` vs `Published`).

  - Sistem Notifikasi & Pengumuman Divisi (khusus Koordinator Divisi & Admin).

- \*\*Fase 2 (Post-MVP - Setelah Fase 1 Stabil):\*\*

  - Modul Manajemen Tim Lomba & KRTI untuk \*\*Asisten Aktif\*\* (Logbook riset, dokumentasi \*flight test\*, evaluasi performa tim lomba).

---

## 2. Struktur Organisasi & Manajemen Hak Akses (RBAC)

### 2.1 Taksonomi Divisi

1. \*\*Divisi Riset (Wajib Aktif di Fase 1 — Jalur Pembelajaran Asisten Magang):\*\*

   - `Mechanic` (`RES-MECH`)

   - `System` (`RES-SYS`)

   - `Ground Control Station (GCS)` (`RES-GCS`)

   - `Non-Technical` (`RES-NONT`)

2. \*\*Divisi Lomba (Disiapkan di Database untuk Fase 2 — Jalur Asisten Aktif):\*\*

   - `Fixed Wing (Bangau Team)` (`COMP-FW`)

   - `Racing Plane (Frigate Team)` (`COMP-RP`)

   - `Long Endurance Low Altitude - LELA (Strix Team)` (`COMP-LELA`)

   - `Teknofest (Avalerion Team)` (`COMP-TEKNO`) — \*Bersifat opsional, memiliki flag `is_active` yang dikontrol Admin.\*

### 2.2 Matriks Role & Izin Akses

| Kapabilitas / Fitur | Admin | Asisten Aktif \*(Non-Koordinator)\* | Asisten Aktif \*(Koordinator Divisi)\* | Asisten Magang |

| :--- | :---: | :---: | :---: | :---: |

| CRUD User, Assign Role, Divisi Riset/Lomba, & Set Koordinator | ✅ | ❌ | ❌ | ❌ |

| Aktif/Nonaktifkan Divisi Lomba Opsional (Teknofest) | ✅ | ❌ | ❌ | ❌ |

| CRUD Materi Pembelajaran (Divisi Risetnya) | ✅ | ✅ | ✅ | ❌ |

| Akses Materi Pembelajaran (Divisi Risetnya) | ✅ | ✅ | ✅ | ✅ |

| CRUD Tugas & Atur Batas Size Upload (Divisi Risetnya) | ✅ | ✅ | ✅ | ❌ |

| Kumpulkan Tugas (Upload File / Link Drive) | ❌ | ❌ | ❌ | ✅ |

| Periksa Tugas & Input Nilai (`Draft`) | ✅ | ✅ | ✅ | ❌ |

| \*\*Publish Nilai\*\* (`Draft` -&gt; `Published`) | ✅ | ✅ | ✅ | ❌ |

| Lihat Nilai & Feedback (Hanya status `Published`) | ✅ | ✅ \*(semua di divisinya)\* | ✅ \*(semua di divisinya)\* | ✅ \*(milik sendiri)\* |

| \*\*Kirim Notifikasi / Pengumuman\*\* | ✅ \*(Semua/Per Divisi)\* | ❌ | ✅ \*(Khusus divisinya)\* | ❌ |

| Terima & Tandai Baca Notifikasi | ✅ | ✅ | ✅ | ✅ |

---

## 3. Spesifikasi Fungsional (Fase 1)

### FR-01: Autentikasi & Isolasi Divisi

- Endpoint `/register` tidak tersedia; akun dibuat sepenuhnya oleh Admin.

- Login menggunakan `email` atau `nim` + `password` via Laravel Sanctum.

- Backend Laravel Policy wajib memvalidasi bahwa pengguna non-Admin hanya bisa mengakses/memodifikasi data yang memiliki `research_division_id` identik dengan miliknya.

### FR-02: Manajemen Materi Pembelajaran (Link-Based)

- Asisten Aktif / Admin menambah materi melalui tautan eksternal (tidak ada \*rich-text editor\* panjang di web).

- \*\*Atribut:\*\* `title`, `description`, `order_number`, `source_type` (`youtube`, `drive`, `other`), `url`, `research_division_id`.

- UI menampilkan kartu/daftar materi berurut dengan \*badge\* sumber dan tombol buka tautan (serta \*embed preview\* opsional untuk YouTube).

### FR-03: Manajemen Tugas & Hybrid Submission

- \*\*Pembuatan Tugas (Asisten Aktif / Admin):\*\* Mengisi `title`, `description`, `deadline`, dan `max_file_size_mb` (default `10` MB, dapat dikustomisasi per tugas).

- \*\*Pengumpulan Tugas (Asisten Magang):\*\*

  1. \*\*Direct File Upload:\*\* Validasi ukuran file maksimal dinamis sesuai `assignment.max_file_size_mb`. Format diizinkan: `pdf, zip, rar, doc, docx, ppt, pptx, png, jpg, jpeg`.

  2. \*\*Fallback Google Drive Link:\*\* Kolom input URL teks (`drive_link`) sebagai alternatif apabila ukuran file pekerjaan melebihi batas maksimal server.

  - \*\*Validasi:\*\* Minimal salah satu (`file` atau `drive_link`) wajib diisi. Jika Asisten Magang mengirim ulang sebelum nilai di-\*publish\*, file lama dihapus dari \*storage\* dan data diperbarui. Otomatis mencatat `is_late = true` jika `submitted_at > deadline`.

### FR-04: Sistem Penilaian (Draft vs Published)

- Asisten Aktif menilai \*submission\* dengan `score` (`0–100`) dan `feedback`.

- Nilai baru otomatis berstatus \*\*`draft`\*\*. Backend API \*\*wajib menyembunyikan\*\* record nilai berstatus `draft` dari endpoint Asisten Magang (Asisten Magang hanya melihat status \*"Menunggu Penilaian"\*).

- Tersedia tombol \*\*Publish Nilai\*\* (satuan maupun \*bulk publish\* per tugas). Saat berubah menjadi `published`, nilai muncul di akun Asisten Magang dan memicu notifikasi otomatis.

### FR-05: Sistem Notifikasi & Pengumuman Divisi

- \*\*Otorisasi Ketat:\*\* Hanya `Admin` atau `Asisten Aktif` dengan `is_coordinator = true` yang dapat mengirim pengumuman.

- Koordinator Divisi mengirim pengumuman ke seluruh anggota di `research_division_id`-nya; Admin dapat memilih divisi spesifik atau \*broadcast\* global (`research_division_id = null`).

- Dilengkapi ikon lonceng notifikasi di navbar dengan penghitung \*unread\* (`announcement_reads`).

---

## 4. Skema Database (MySQL)

1. \*\*`divisions`\*\*: `id`, `name`, `code`, `type` (`'research'|'competition'`), `is_active` (`boolean`), `timestamps`.

2. \*\*`users`\*\*: `id`, `name`, `nim` (unique), `email` (unique), `password`, `role` (`'admin'|'asisten_aktif'|'asisten_magang'`), `research_division_id` (FK nullable), `competition_division_id` (FK nullable - Fase 2), `is_coordinator` (`boolean`, default `false`), `timestamps`.

3. \*\*`materials`\*\*: `id`, `research_division_id` (FK), `created_by` (FK), `title`, `description`, `source_type` (`'youtube'|'drive'|'other'`), `url`, `order_number`, `timestamps`.

4. \*\*`assignments`\*\*: `id`, `research_division_id` (FK), `created_by` (FK), `title`, `description`, `max_file_size_mb` (int, default `10`), `deadline` (datetime), `timestamps`.

5. \*\*`submissions`\*\*: `id`, `assignment_id` (FK), `user_id` (FK), `file_path` (nullable), `original_filename` (nullable), `drive_link` (nullable), `notes` (nullable), `submitted_at` (datetime), `is_late` (boolean), `timestamps`.

6. \*\*`grades`\*\*: `id`, `submission_id` (FK unique), `graded_by` (FK), `score` (decimal 5,2), `feedback` (nullable), `status` (`'draft'|'published'`), `published_at` (nullable), `timestamps`.

7. \*\*`announcements`\*\*: `id`, `research_division_id` (FK nullable), `created_by` (FK), `title`, `content`, `timestamps`.

8. \*\*`announcement_reads`\*\*: `id`, `announcement_id` (FK), `user_id` (FK), `read_at` (datetime).

---

## 5. Struktur Direktori Target (Clean Monorepo)

\`\`\`text

aptrg-lms/

├── [PRD.md](http://PRD.md)

├── [CLAUDE.md](http://CLAUDE.md)

├── backend/                  # Laravel 11 REST API

│   ├── app/

│   ├── database/

│   └── routes/api.php

└── frontend/                 # React + TypeScript + Vite + Shadcn/ui

    ├── src/

    │   ├── components/

    │   │   ├── ui/           # Pertahankan komponen Shadcn/ui lama

    │   │   └── layout/       # Sidebar, Navbar, NotificationBell

    │   ├── pages/

    │   │   ├── auth/         # LoginPage

    │   │   ├── dashboard/    # AdminDashboard, AsistenDashboard, MagangDashboard

    │   │   ├── materials/    # MaterialListPage

    │   │   ├── assignments/  # AssignmentListPage, AssignmentDetailPage

    │   │   ├── announcements/# AnnouncementPage

    │   │   └── admin/        # UserManagementPage, DivisionManagementPage

    │   ├── services/         # Axios API client & endpoints

    │   ├── hooks/            # AuthContext & custom hooks

    │   └── styles/           # Pertahankan theme.css & tailwind.css lama

    └── package.json