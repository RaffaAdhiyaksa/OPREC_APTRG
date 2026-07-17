import { ReactNode } from "react";
import { Bell } from "lucide-react";
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

/* Shared avatar chip */
export function Avatar({
  initials,
  size = 28,
  ring = true,
}: {
  initials: string;
  size?: number;
  ring?: boolean;
}) {
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
  const { user } = useAuthContext();
  const displayName = user?.user_metadata?.full_name as string | undefined
    ?? user?.email
    ?? "Pengguna";
  const initials = getInitials(user?.email);
  return (
    <div className="relative z-10 min-h-screen">
      <Sidebar active={active} role={role} onNavigate={onNavigate} />
      <div className="pl-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 px-6 pt-4">
          <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-[18px] border border-white/60 bg-white/70 px-6 py-3.5 backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(80,40,40,0.22)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-extrabold tracking-tight text-[#2a2320]">
                {title}
              </h1>
              <p className="truncate text-[13px] text-[#857a75]">{subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/60 transition hover:bg-white/80">
                <Bell className="h-[18px] w-[18px] text-[#5a504b]" />
                <span
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full ring-2 ring-white"
                  style={{ background: RED }}
                />
              </button>
              <div className="flex items-center gap-2.5 rounded-full border border-white/70 bg-white/60 py-1 pl-1 pr-3.5">
                <Avatar initials={initials} size={32} />
                <div className="leading-tight">
                  <div className="text-[13px] font-semibold text-[#2a2320]">
                    {displayName}
                  </div>
                  <div
                    className="text-[11px] font-medium"
                    style={{ color: me.color }}
                  >
                    {me.label}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 py-6">{children}</main>
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
