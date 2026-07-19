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
  imgUrl,
}: {
  initials: string;
  size?: number;
  ring?: boolean;
  imgUrl?: string;
}) {
  return (
    <div
      className={`flex flex-none items-center justify-center rounded-full text-white shadow-sm overflow-hidden ${ring ? "ring-2 ring-white/80" : ""
        }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 700,
        background: imgUrl ? "transparent" : `linear-gradient(135deg, ${RED}, ${AMBER})`,
      }}
    >
      {imgUrl ? (
        <img src={imgUrl} alt={initials} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
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
    <div className="relative min-h-screen w-full bg-[#f6f2f0] dark:bg-[#1a1614] transition-colors duration-500">
      {/* Fixed Background Image (User Dashboard only) */}
      {role !== "admin" && (
        <div className="fixed inset-0 z-0 pointer-events-none bg-[#f6f2f0] dark:bg-[#1a1614] transition-colors duration-500">
          <img
            src="/assets/Foto Anggota.webp"
            alt="Latar Belakang Anggota"
            className="w-full h-full object-cover object-[center_20%] opacity-20 dark:opacity-50 transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-white/20 dark:bg-black/50 backdrop-blur-[3px] transition-colors duration-500" />
        </div>
      )}

      <div className="relative z-10 flex w-full min-h-screen">
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
            <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-white/50 dark:border-white/10 bg-white/75 dark:bg-[#1a1614]/80 px-5 py-4 backdrop-blur-2xl shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors duration-500 md:px-6">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 dark:via-white/20 to-transparent" />
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="flex flex-none items-center justify-center rounded-xl bg-white/60 p-2.5 text-[#2a2320] transition-all duration-300 hover:bg-white/90 hover:shadow-sm md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-[18px] font-extrabold tracking-tight text-[#2a2320] dark:text-white transition-colors duration-500 md:text-xl">
                    {title}
                  </h1>
                  <p className="truncate text-[12px] font-medium text-[#857a75] dark:text-gray-400 transition-colors duration-500 md:text-sm">
                    {subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 bg-white/80 transition-all duration-300 hover:bg-white hover:shadow-sm">
                  <Bell className="h-[18px] w-[18px] text-[#5a504b]" />
                  <span
                    className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full ring-2 ring-white bg-indigo-600"
                  />
                </button>
                <div className="flex items-center gap-2.5 rounded-full border border-gray-100 dark:border-white/10 bg-white/80 dark:bg-[#1a1614]/80 py-1.5 pl-1.5 pr-4 max-w-[160px] md:max-w-xs lg:max-w-md transition-colors duration-500">
                  <Avatar initials={initials} size={32} />
                  <div className="hidden text-right md:block">
                    <div className="text-[13px] font-extrabold tracking-tight text-[#2a2320] dark:text-white transition-colors duration-500">
                      {displayName}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-[#c81e2c] dark:text-red-400 transition-colors duration-500">
                      {me?.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="px-5 py-7 md:px-8 lg:px-12">{children}</main>
        </div>
      </div>
    </div>
  );
}

/* Status badge: Asisten Lab (amber) / Magang (red) */
export function StatusBadge({ status }: { status: "asisten" | "magang" }) {
  const isAsisten = status === "asisten";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white shadow-sm"
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
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
      style={{ background: `${color}14`, color }}
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
