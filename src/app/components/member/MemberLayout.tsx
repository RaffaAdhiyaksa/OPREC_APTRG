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
        className={`flex-none rounded-full object-cover shadow-sm ${ring ? "ring-2 ring-white/80" : ""
          }`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full text-white shadow-sm ${ring ? "ring-2 ring-white/80" : ""
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
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex flex-none items-center justify-center rounded-xl bg-slate-100 p-2 text-slate-900 transition hover:bg-slate-200 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg md:text-xl font-bold tracking-tight text-slate-900">
                  {title}
                </h1>
                <p className="truncate text-xs md:text-sm font-semibold text-slate-500">{subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50">
                <Bell className="h-5 w-5 text-slate-500" />
                <span
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full ring-2 ring-white bg-indigo-600"
                />
              </button>
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-4 shadow-sm max-w-[160px] md:max-w-xs lg:max-w-md">
                <Avatar initials={initials} size={32} />
                <div className="flex flex-1 min-w-0 flex-col leading-tight lg:flex-row lg:items-center lg:gap-3">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {displayName}
                  </div>
                  <div
                    className="truncate text-xs font-semibold text-slate-500"
                  >
                    {me.label}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 lg:p-12">{children}</main>
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
