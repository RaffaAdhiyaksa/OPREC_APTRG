import {
  Award,
  Bell,
  BookOpen,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Megaphone,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Me } from "@/types/api";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Shown but not clickable, with a "Segera" badge (Phase 2 features). */
  comingSoon?: boolean;
}

// Menus only shape the UI; the backend authorizes every request.
export function navFor(user: Me): NavItem[] {
  const notifications: NavItem = { label: "Notifikasi", to: "/notifications", icon: Bell };
  const announcements: NavItem = { label: "Pengumuman", to: "/announcements", icon: Megaphone };
  const materials: NavItem = { label: "Materi", to: "/materials", icon: BookOpen };
  const assignments: NavItem = { label: "Tugas", to: "/assignments", icon: ClipboardList };

  switch (user.role) {
    case "admin":
      return [
        { label: "Dashboard", to: "/", icon: LayoutDashboard },
        { label: "Pengguna", to: "/admin/users", icon: Users },
        { label: "Divisi", to: "/admin/divisions", icon: Building2 },
        materials,
        assignments,
        announcements,
        notifications,
      ];
    case "asisten_aktif":
      return [
        { label: "Beranda", to: "/", icon: LayoutDashboard },
        materials,
        assignments,
        announcements,
        { label: "Divisi Lomba", to: "/competition", icon: Trophy, comingSoon: true },
        notifications,
      ];
    case "asisten_magang":
      return [
        { label: "Beranda", to: "/", icon: LayoutDashboard },
        materials,
        assignments,
        { label: "Nilai", to: "/grades", icon: Award },
        announcements,
        notifications,
      ];
  }
}

export function isNavActive(pathname: string, to: string) {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}

const SEGMENT_LABEL: Record<string, string> = {
  materials: "Materi",
  assignments: "Tugas",
  grades: "Nilai",
  announcements: "Pengumuman",
  notifications: "Notifikasi",
  profile: "Profil",
  users: "Pengguna",
  divisions: "Divisi",
};

export function sectionLabel(segment: string) {
  return SEGMENT_LABEL[segment];
}
