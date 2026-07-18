import { useState, useRef, useEffect } from "react";
import { Logo, Screen, RED } from "./shared";
import { useAuthContext } from "../../context/AuthContext";
import { User, LogOut } from "lucide-react";


const LINKS = [
  { label: "Beranda", target: "hero" },
  { label: "Kenapa APTRG", target: "why" },
  { label: "Divisi", target: "divisi" },
];

export function Navbar({
  onNavigate,
  onSection,
}: {
  onNavigate: (s: Screen) => void;
  onSection: (id: string) => void;
}) {
  const { user, profile, role, loading } = useAuthContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    onNavigate("logging-out");
  };

  const goToDashboard = () => {
    if (loading) return;
    const target = role === "admin" || role === "asisten" || role === null ? "dashboard" : "dashboard-user";
    onNavigate(target);
  };

  const initials = profile?.nama ? profile.nama.substring(0, 2).toUpperCase() : "U";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[99] flex justify-center px-4 pt-4">
      <nav className="pointer-events-auto relative flex w-full max-w-6xl items-center justify-between rounded-[18px] border border-white/60 bg-white/70 px-5 py-3 backdrop-blur-xl shadow-[0_8px_30px_-10px_rgba(80,40,40,0.25)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        <button onClick={() => onNavigate("landing")}>
          <Logo />
        </button>
        <div className="hidden items-center gap-1 md:flex pointer-events-auto">
          {LINKS.map((l) => (
            <button
              key={l.target}
              onClick={() => onSection(l.target)}
              className="pointer-events-auto rounded-full px-3.5 py-2 text-[14px] font-medium text-[#5a504b] transition-colors hover:bg-white/70 hover:text-[#2a2320]"
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate("cek-pengumuman")}
            className="hidden rounded-full px-3.5 py-2 text-[14px] font-medium text-[#5a504b] transition-colors hover:text-[#2a2320] sm:block"
          >
            Cek Pengumuman
          </button>
          
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6f2f0] text-[13px] font-bold text-[#2a2320] shadow-sm transition hover:bg-[#e0dcd9] focus:outline-none focus:ring-2 focus:ring-[#c81e2c]"
              >
                {initials}
              </button>
              
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 z-[60] rounded-[14px] border border-white/60 bg-white/90 p-2 backdrop-blur-xl shadow-[0_8px_30px_-10px_rgba(80,40,40,0.25)]">
                  <button
                    onClick={() => { setMenuOpen(false); goToDashboard(); }}
                    className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[14px] font-medium text-[#2a2320] transition hover:bg-[#f6f2f0]"
                  >
                    <User className="h-4 w-4" /> Dashboard Saya
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); handleLogout(); }}
                    className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[14px] font-medium text-[#c81e2c] transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => onNavigate("login")}
                className="hidden rounded-full px-3.5 py-2 text-[14px] font-medium text-[#5a504b] transition-colors hover:text-[#2a2320] sm:block"
              >
                Masuk
              </button>
              <button
                onClick={() => onNavigate("login")}
                className="rounded-full px-5 py-2 text-[14px] font-semibold text-white shadow-md transition hover:opacity-90"
                style={{ background: RED }}
              >
                Daftar Sekarang
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
