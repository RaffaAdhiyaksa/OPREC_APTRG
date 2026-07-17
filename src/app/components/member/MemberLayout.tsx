import { ReactNode, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { Screen, Role, RED, AMBER } from "../aptrg/shared";
import { Sidebar } from "./Sidebar";
import { useAuthContext } from "../../context/AuthContext";

const ROLE_INFO: Record<Role, { label: string; color: string }> = {
  magang: { label: "Anggota Magang", color: RED },
  asisten: { label: "Asisten Lab", color: AMBER },
  admin: { label: "Admin / Pengurus", color: "#2f7dd1" },
};

/** Ambil dua huruf kapital dari email/nama untuk avatar initials. */
function getInitials(email: string | undefined): string {
  if (!email) return "?";
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* Shared avatar chip — nampilin foto asli (`src`) kalau ada, fallback ke inisial */
export function Avatar({
  initials,
  size = 28,
  ring = true,
  src,
}: {
  initials: string;
  size?: number;
  ring?: boolean;
  /** URL foto profil dari Supabase Storage. Kalau null/undefined, fallback ke inisial. */
  src?: string | null;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt="Foto profil"
        className={`flex-none rounded-full object-cover shadow-sm ${
          ring ? "ring-2 ring-white/80" : ""
        }`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full text-white shadow-sm ${
        ring ? "ring-2 ring-white/80" : ""
      }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 700,
        background: `linear-gradient(135deg, ${RED}, ${AMBER})`,
      }}
    >
      {initials}
    </div>
  );
}

export function MemberLayout({
  active,
  role,
  onNavigate,
  title,
  subtitle,
  children,
}: {
  active: Screen;
  role: Role;
  onNavigate: (s: Screen) => void;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const me = ROLE_INFO[role];
  const { user, profile } = useAuthContext();
  const displayName = profile?.nama || user?.email || "Pengguna";
  const initials = getInitials(user?.email);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative z-10 min-h-screen">
      <Sidebar
        active={active}
        role={role}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex w-full flex-1 flex-col transition-all md:pl-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 px-4 pt-4 md:px-6">
          <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-[18px] border border-white/60 bg-white/70 px-4 py-3.5 backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(80,40,40,0.22)] md:px-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex flex-none items-center justify-center rounded-[10px] bg-white/50 p-2 text-[#2a2320] transition hover:bg-white/80 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[16px] md:text-[18px] font-extrabold tracking-tight text-[#2a2320]">
                  {title}
                </h1>
                <p className="truncate text-[12px] md:text-[13px] text-[#857a75]">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/60 transition hover:bg-white/80">
                <Bell className="h-[18px] w-[18px] text-[#5a504b]" />
                <span
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full ring-2 ring-white"
                  style={{ background: RED }}
                />
              </button>
              <button
                onClick={() => onNavigate("profil")}
                className="flex items-center gap-2.5 rounded-full border border-white/70 bg-white/60 py-1 pl-1 pr-3.5 max-w-[160px] transition hover:bg-white/85 md:max-w-xs lg:max-w-md"
              >
                <Avatar initials={initials} size={32} src={profile?.avatar_url} />
                <div className="flex flex-1 min-w-0 flex-col items-start leading-tight lg:flex-row lg:items-center lg:gap-2">
                  <div className="truncate text-[13px] font-semibold text-[#2a2320]">
                    {displayName}
                  </div>
                  <div
                    className="truncate text-[11px] font-medium"
                    style={{ color: me.color }}
                  >
                    {me.label}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

/* Status badge: Asisten Lab (amber) / Magang (red) */
export function StatusBadge({ status }: { status: "asisten" | "magang" }) {
  const isAsisten = status === "asisten";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm"
      style={{ background: isAsisten ? AMBER : RED }}
    >
      {isAsisten ? "Asisten Lab" : "Magang"}
    </span>
  );
}

/* Reusable division tag */
export function DivTag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: `${color}1f`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

/* Reusable avatar stack */
export function AvatarStack({ people }: { people: string[] }) {
  const shown = people.slice(0, 4);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <div key={p + i} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar initials={p} size={26} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="ml-[-8px] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/80 text-[10px] font-bold text-[#5a504b] ring-2 ring-white/80"
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
