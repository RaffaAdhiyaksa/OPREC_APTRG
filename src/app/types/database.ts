export type AnnouncementCategory = "Rapat" | "OPREC" | "Umum" | "Deadline";

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
