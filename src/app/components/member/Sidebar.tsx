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
import { ThemeToggle } from "../aptrg/ThemeToggle";

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
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/75 backdrop-blur-2xl shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03)]">
        {role === "admin" && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img 
              src="/assets/Foto Anggota.webp" 
              alt="Admin Sidebar Background" 
              className="w-full h-full object-cover object-[center_20%] opacity-15 mix-blend-overlay" 
            />
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]" />
          </div>
        )}
        <div className="relative z-10 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <div className="relative z-10 px-5 pt-6 pb-5">
          <Logo subtitle="Portal Anggota" />
        </div>
        <nav className="relative z-10 flex-1 space-y-1 overflow-y-auto px-3">
          {nav.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium transition-all duration-300 ease-in-out hover:bg-white/60"
                style={{
                  background: isActive ? "rgba(200,30,44,0.08)" : "transparent",
                  color: isActive ? "#1a1614" : "#6b6460",
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
        <div className="relative z-10 flex gap-2 p-3">
          <button
            onClick={() => {
              onNavigate("landing");
            }}
            className="flex flex-1 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-[#6b6460] transition-all duration-300 hover:bg-white/60"
          >
            <Home className="h-[18px] w-[18px] text-[#857a75]" /> Kembali ke Beranda
          </button>
          <ThemeToggle />
          <button
            onClick={() => {
              onNavigate("logging-out");
            }}
            title="Keluar dari akun"
            className="flex flex-none items-center justify-center rounded-xl px-3 py-2.5 text-[#857a75] transition-all duration-300 hover:bg-red-50/80 hover:text-[#c81e2c]"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
