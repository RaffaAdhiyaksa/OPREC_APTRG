import {
  LayoutDashboard,
  TrendingUp,
  CalendarDays,
  KanbanSquare,
  Users,
  BookOpen,
  Megaphone,
  UserCircle,
  Network,
  ClipboardList,
  UserCog,
  CalendarCog,
  LogOut,
  Home,
} from "lucide-react";
import { Logo, Screen, Role, RED } from "../aptrg/shared";

type NavItem = { id: Screen; label: string; Icon: typeof LayoutDashboard };

const MEMBER_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "progress", label: "Progress Saya", Icon: TrendingUp },
  { id: "jadwal", label: "Jadwal Rapat", Icon: CalendarDays },
  { id: "tubes", label: "Tubes & Proyek", Icon: KanbanSquare },
  { id: "anggota", label: "Anggota", Icon: Users },
  { id: "materi", label: "Materi", Icon: BookOpen },
  { id: "pengumuman", label: "Pengumuman", Icon: Megaphone },
  { id: "struktur", label: "Struktur Organisasi", Icon: Network },
  { id: "profil", label: "Profil", Icon: UserCircle },
];

const ADMIN_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "kelola-oprec", label: "Kelola OPREC", Icon: ClipboardList },
  { id: "dashboard-pendaftar", label: "Pendaftar OPREC", Icon: Users },
  { id: "kelola-anggota", label: "Kelola Anggota", Icon: UserCog },
  { id: "kelola-jadwal", label: "Kelola Jadwal", Icon: CalendarCog },
  { id: "pengumuman", label: "Pengumuman", Icon: Megaphone },
  { id: "struktur", label: "Struktur Organisasi", Icon: Network },
  { id: "anggota", label: "Anggota", Icon: Users },
  { id: "materi", label: "Materi", Icon: BookOpen },
  { id: "profil", label: "Profil", Icon: UserCircle },
];

export function Sidebar({
  active,
  role,
  onNavigate,
  isOpen,
  onClose,
}: {
  active: Screen;
  role: Role;
  onNavigate: (s: Screen) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const nav = role === "admin" ? ADMIN_NAV : MEMBER_NAV;
  return (
    <>
      {/* Overlay background for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col p-4 transform transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[18px] border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_40px_-14px_rgba(80,40,40,0.28)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        <div className="px-5 pt-6 pb-5">
          <Logo subtitle="Portal Anggota" />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative flex w-full items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[14px] font-medium transition"
                style={{
                  background: isActive ? "rgba(200,30,44,0.1)" : "transparent",
                  color: isActive ? "#2a2320" : "#5a504b",
                }}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full"
                    style={{ background: RED }}
                  />
                )}
                <item.Icon
                  className="h-[18px] w-[18px]"
                  style={{ color: isActive ? RED : "#857a75" }}
                />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="flex gap-2 p-3">
          <button
            onClick={() => {
              onNavigate("landing");
            }}
            className="flex flex-1 items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[14px] font-medium text-[#5a504b] transition hover:bg-white/70"
          >
            <Home className="h-[18px] w-[18px] text-[#857a75]" /> Kembali ke Beranda
          </button>
          <button
            onClick={() => {
              onNavigate("logging-out");
            }}
            title="Keluar dari akun"
            className="flex flex-none items-center justify-center rounded-[12px] px-3 py-2.5 text-[#857a75] transition hover:bg-red-50 hover:text-[#c81e2c]"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
