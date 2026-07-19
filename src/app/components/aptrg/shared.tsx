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
 | "profil-user"
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
 return null; // Disabled for clean SaaS aesthetic
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
 className={`relative overflow-hidden rounded-2xl border border-white/50 bg-white/75 backdrop-blur-2xl shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.03)] transition-all duration-300 ease-in-out ${className}`}
 style={style}
 >
 <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
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
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-gray-100 transition-colors duration-300">
 <img
 src={logoImg}
 alt="APTRG Logo"
 className="h-7 w-7 object-contain drop-shadow-sm"
 />
 </div>
 {!compact && (
 <div className="leading-tight">
 <h1 className="text-xl font-extrabold tracking-tight text-[#2a2320] transition-colors duration-300">
 APTRG
 </h1>
 <p className="text-[10px] font-bold uppercase tracking-widest text-[#857a75] transition-colors duration-300">
 {subtitle}
 </p>
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
 software?: string[];
 hardware?: string[];
};

export const DIVISIONS: Division[] = [
 {
 id: "mekanik",
 name: "Mekanik",
 tagline: "AIRFRAME & STRUKTUR",
 desc: "Bertanggung jawab penuh atas rancang bangun fisik pesawat tanpa awak (UAV). Divisi ini memfokuskan riset pada desain aerodinamika, analisis kekuatan material, proses manufaktur (komposit & 3D printing), serta integrasi payload secara struktural mekanis untuk memastikan wahana terbang dengan stabil dan efisien di berbagai kondisi misi.",
 Icon: Wrench,
 software: ["SolidWorks", "AutoCAD"],
 hardware: ["3D Printer", "CNC Router", "Carbon Fiber", "Fiberglass"],
 },
 {
 id: "sistem",
 name: "Sistem",
 tagline: "AVIONIK & KENDALI",
 desc: "Merupakan otak dari setiap wahana terbang. Divisi ini berfokus pada perancangan elektronika terpadu (avionik), sistem kendali penerbangan otomatis (flight controller), pengolahan citra komputer (computer vision) untuk payload cerdas, serta sistem telemetri berkinerja tinggi untuk komunikasi data realtime antara pesawat dan stasiun darat.",
 Icon: Cpu,
 software: ["ArduPilot", "Mission Planner", "OpenCV"],
 hardware: ["ESC 32", "Mateksys", "ELRS", "Flight Controller", "Soldering Station"],
 },
 {
 id: "gcs",
 name: "GCS",
 tagline: "GROUND CONTROL STATION",
 desc: "Pusat komando dari seluruh operasi penerbangan. Divisi GCS mengembangkan perangkat lunak pemantauan misi (Mission Planner), pengolahan data telemetri, antarmuka pengguna interaktif (UI/UX) untuk pilot dan operator, serta implementasi kecerdasan buatan untuk analisis data penerbangan secara langsung dari darat.",
 Icon: MonitorSmartphone,
 software: ["Python", "Node.js", "Qt", "Mission Planner"],
 hardware: ["Antenna Tracker", "Ground Station PC", "Arduino", "Raspbery PI"],
 },
 {
 id: "non-technical",
 name: "Non-Technical",
 tagline: "MANAJEMEN & MEDIA",
 desc: "Tulang punggung operasional dan citra publik laboratorium. Fokus pada manajemen strategis, administrasi kompetisi tingkat nasional maupun internasional, pencarian sponsor (sponsorship), pengelolaan keuangan, serta produksi dokumentasi multimedia dan publikasi riset di berbagai platform sosial media laboratorium.",
 Icon: Users,
 software: ["Adobe", "Davinci Resolve", "Microsoft Office", "Affinity"],
 hardware: ["DSLR Camera", "Gimbal", "Aerial Drone"],
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
