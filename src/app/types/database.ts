// ============================================================================
// Centralized Database Types — Single Source of Truth
// Semua tipe data yang merepresentasikan baris tabel Supabase dikumpulkan
// di sini agar tidak ada duplikasi definisi di masing-masing komponen.
// ============================================================================

/* ── Profiles ───────────────────────────────────────────── */

export type Role = "magang" | "asisten" | "admin";

export type Profile = {
  nama: string;
  email: string;
  hp: string | null;
  avatar_url: string | null;
};

/** Representasi lengkap baris tabel `profiles` (termasuk kolom role). */
export type ProfileRow = {
  id: string;
  role: Role;
  nama: string;
  email: string;
  hp: string | null;
  avatar_url: string | null;
  created_at: string;
};

/* ── Assignments & Submissions (LMS) ────────────────────── */

export type Assignment = {
  id: string;
  title: string;
  description: string | null;
  division_category: string;
  deadline_at: string;
  created_by: string | null;
  created_at: string;
};

export type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_url: string;
  grade: number | null;
  feedback: string | null;
  submitted_at: string;
};

/* ── Announcements ──────────────────────────────────────── */

export type AnnouncementCategory = "Rapat" | "LMS" | "Umum" | "Deadline";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  created_at: string;
  deadline_at?: string | null;
  is_pinned: boolean;
  author: string;
}

/* ── Members ────────────────────────────────────────────── */

export type DivisionType = "Mekanik" | "Sistem" | "GCS" | "Non-Technical";
export type MemberStatus = "Ketua Lab" | "Kepala Divisi" | "Asisten Lab" | "Magang";

export interface Member {
  id: string;
  user_id?: string | null;
  nama: string;
  nim: string;
  divisi: DivisionType;
  status_jabatan: MemberStatus;
  angkatan: string;
  foto_url?: string | null;
  created_at: string;
}

/* ── Materials ──────────────────────────────────────────── */

export type MaterialFormat = "Dokumen" | "Video" | "Slide";
export type MaterialCategory = DivisionType | "Umum";

export interface Material {
  id: string;
  title: string;
  format: MaterialFormat;
  kategori_divisi: MaterialCategory;
  url_link: string;
  meta_info: string;
  description?: string | null;
  created_at: string;
}

/* ── Meetings (Jadwal Rapat) ────────────────────────────── */

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  kategori_divisi: MaterialCategory;
  description?: string | null;
  created_at: string;
}

/* ── Projects (Tubes & Proyek) ──────────────────────────── */

export type ProjectStatus = "doing" | "review" | "done";

export interface Project {
  id: string;
  title: string;
  kategori_divisi: MaterialCategory;
  deadline?: string | null;
  status: ProjectStatus;
  anggota_tim?: string | null;
  description?: string | null;
  created_at: string;
}

/* ── Member Progress ────────────────────────────────────── */

export interface MemberProgress {
  id: string;
  user_id: string;
  skill_name: string;
  score: number;
  evaluator?: string | null;
  updated_at: string;
}
