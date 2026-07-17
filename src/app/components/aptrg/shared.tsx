import { ReactNode } from "react";
import {
  Wrench,
  Cpu,
  MonitorSmartphone,
  Users,
} from "lucide-react";
import logoImg from "../../../imports/aptrg_logo.png";

/* ---------- Brand tokens ---------- */
export const RED = "#c81e2c";
export const RED_DEEP = "#a3151f";
export const AMBER = "#e3a548";

/* ---------- Screen type ---------- */
export type Screen =
  | "landing"
  | "register"
  | "login"
  | "status"
  | "dashboard"
  | "dashboard-user"
  | "dashboard-pendaftar"
  | "progress"
  | "jadwal"
  | "tubes"
  | "anggota"
  | "materi"
  | "pengumuman"
  | "profil"
  | "member-detail"
  | "struktur"
  | "kelola-oprec"
  | "kelola-anggota"
  | "kelola-jadwal"
  | "pilih-event"
  | "form-open-mind"
  | "pilih-bangku"
  | "open-mind-success"
  | "lolos-admin"
  | "undangan-wawancara"
  | "diterima"
  | "cek-pengumuman"
  | "logging-out";

export type Role = "magang" | "asisten" | "admin";

/* ---------- Background orbs ---------- */
export function GlassBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute rounded-full blur-[120px] opacity-60"
        style={{
          width: "40vw",
          height: "40vw",
          top: "-8vw",
          left: "-6vw",
          background:
            "radial-gradient(circle at 30% 30%, rgba(200,30,44,0.55), transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full blur-[130px] opacity-55"
        style={{
          width: "38vw",
          height: "38vw",
          top: "20vh",
          right: "-10vw",
          background:
            "radial-gradient(circle at 50% 50%, rgba(227,165,72,0.55), transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full blur-[120px] opacity-50"
        style={{
          width: "34vw",
          height: "34vw",
          bottom: "-12vw",
          left: "18vw",
          background:
            "radial-gradient(circle at 50% 50%, rgba(240,170,180,0.6), transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full blur-[110px] opacity-45"
        style={{
          width: "26vw",
          height: "26vw",
          bottom: "6vh",
          right: "12vw",
          background:
            "radial-gradient(circle at 50% 50%, rgba(200,30,44,0.4), transparent 70%)",
        }}
      />
    </div>
  );
}

/* ---------- Glass card ---------- */
export function GlassCard({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_10px_40px_-12px_rgba(80,40,40,0.28),0_2px_8px_-4px_rgba(80,40,40,0.15)] ${className}`}
      style={style}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      {children}
    </div>
  );
}

/* ---------- Logo ---------- */
export function Logo({
  compact = false,
  subtitle = "Open Recruitment",
}: {
  compact?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-[12px] bg-white/70 shadow-md ring-1 ring-white/60">
        <img
          src={logoImg}
          alt="Logo APTRG"
          className="h-full w-full object-contain p-0.5"
        />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold tracking-tight text-[#2a2320]">
            APTRG
          </div>
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#857a75]">
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Division data ---------- */
export type Division = {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  Icon: typeof Wrench;
};

export const DIVISIONS: Division[] = [
  {
    id: "mekanik",
    name: "Mekanik",
    tagline: "Airframe & Struktur",
    desc: "Desain, fabrikasi, dan uji struktur airframe UAV serta integrasi payload secara mekanis.",
    Icon: Wrench,
  },
  {
    id: "sistem",
    name: "Sistem",
    tagline: "Avionik & Kendali",
    desc: "Pengembangan flight controller, sistem telemetri, dan integrasi elektronika pesawat.",
    Icon: Cpu,
  },
  {
    id: "gcs",
    name: "GCS",
    tagline: "Ground Control Station",
    desc: "Perangkat lunak pemantauan misi, komunikasi data, dan antarmuka kendali darat.",
    Icon: MonitorSmartphone,
  },
  {
    id: "non-technical",
    name: "Non-Technical",
    tagline: "Manajemen & Media",
    desc: "Manajemen tim, pendanaan, kompetisi, dokumentasi, serta media dan kerja sama eksternal.",
    Icon: Users,
  },
];

/* ---------- Recruitment stages ---------- */
export const STAGES = [
  "Pendaftaran",
  "Seleksi Administrasi",
  "Wawancara",
  "Pengumuman",
  "Onboarding Magang",
];
