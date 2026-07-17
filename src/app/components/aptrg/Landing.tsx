import { motion } from "motion/react";
import {
  FlaskConical,
  Trophy,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Check,
  Plane,
} from "lucide-react";
import { GlassCard, DIVISIONS, Screen, RED, AMBER } from "./shared";
import { useAuthContext } from "../../context/AuthContext";


const REASONS = [
  {
    Icon: FlaskConical,
    title: "Riset Nyata",
    desc: "Terlibat langsung dalam proyek UAV dan pengembangan payload telemetri lab.",
  },
  {
    Icon: Trophy,
    title: "Kompetisi Nasional",
    desc: "Wakili universitas di kontes robotik terbang dan kompetisi UAV nasional.",
  },
  {
    Icon: GraduationCap,
    title: "Mentorship",
    desc: "Dibimbing senior dan dosen pembina di setiap tahap pengembangan.",
  },
  {
    Icon: Briefcase,
    title: "Karir Lab",
    desc: "Jenjang dari anggota magang hingga peneliti dan koordinator divisi.",
  },
];

export function Landing({
  onNavigate,
}: {
  onNavigate: (s: Screen) => void;
}) {
  const { user, role } = useAuthContext();

  const goToDashboard = () => {
    const target = role === "admin" || role === "asisten" ? "dashboard" : "dashboard-user";
    onNavigate(target);
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-32">
      {/* Hero */}
      <section id="hero" className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 },
            },
          }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/60 px-4 py-1.5 text-[13px] font-medium text-[#c81e2c] backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full" style={{ background: RED }} />
            Pendaftaran Dibuka
          </motion.div>
          <motion.h1 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} className="mt-5 text-[44px] font-extrabold leading-[1.08] tracking-tight text-[#2a2320]">
            Open Recruitment{" "}
            <span style={{ color: RED }}>APTRG 2026</span>
          </motion.h1>
          <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} className="mt-5 max-w-lg text-[16px] leading-relaxed text-[#5a504b]">
            Bergabunglah dengan Aeromodelling & Payload Telemetry Research Group.
            Rancang, bangun, dan terbangkan UAV bersama tim riset terbaik kampus.
          </motion.p>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} className="mt-7 flex flex-wrap items-center gap-3">
            {user ? (
              <button
                onClick={goToDashboard}
                className="inline-flex items-center rounded-full bg-[#c81e2c] px-6 py-3 text-[14px] font-bold text-white shadow-lg transition hover:bg-[#a11420] sm:px-8 sm:py-4"
              >
                Buka Dashboard <ArrowRight className="ml-1.5 h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate("login")}
                  className="inline-flex items-center rounded-full bg-[#c81e2c] px-6 py-3 text-[14px] font-bold text-white shadow-lg transition hover:bg-[#a11420] sm:px-8 sm:py-4"
                >
                  Daftar Sekarang <ArrowRight className="ml-1.5 h-4 w-4" />
                </button>
                <button
                  onClick={() => onNavigate("login")}
                  className="rounded-full border border-white/70 bg-white/60 px-6 py-3 text-[14px] font-medium text-[#2a2320] backdrop-blur-xl transition hover:bg-white/80"
                >
                  Sudah mendaftar? Masuk
                </button>
              </>
            )}
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } } }} className="mt-8 flex gap-8">
            {[
              { n: "4", l: "Divisi Riset" },
              { n: "5", l: "Tim Kompetisi" },
              { n: "99+", l: "Prestasi" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-[26px] font-extrabold text-[#2a2320]">{s.n}</div>
                <div className="text-[13px] text-[#857a75]">{s.l}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
        <GlassCard className="p-8">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-[16px] text-white shadow-md"
            style={{ background: `linear-gradient(135deg, ${RED}, ${AMBER})` }}
          >
            <Plane className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-[#2a2320]">Riset UAV & Payload Telemetry</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5a504b]">
            Dari desain airframe hingga ground control station — seluruh siklus
            pengembangan wahana terbang tak berawak dalam satu laboratorium.
          </p>
          <ul className="mt-5 space-y-3">
            {[
              "Akses fasilitas fabrikasi & uji terbang",
              "Proyek kolaboratif lintas divisi",
              "Pembinaan menuju kompetisi nasional",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[14px] text-[#2a2320]">
                <span
                  className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-white"
                  style={{ background: RED }}
                >
                  <Check className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>

      {/* Why */}
      <section id="why" className="mt-24">
        <SectionHeading
          kicker="Kenapa Gabung APTRG"
          title="Alasan bergabung dengan lab"
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r) => (
            <GlassCard key={r.title} className="p-6">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[14px] text-white shadow"
                style={{ background: RED }}
              >
                <r.Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-[16px] text-[#2a2320]">{r.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#857a75]">
                {r.desc}
              </p>
            </GlassCard>
          ))}
        </div>
      </section>



      {/* Divisions */}
      <section id="divisi" className="mt-24">
        <SectionHeading
          kicker="Divisi APTRG"
          title="Pilih jalur risetmu"
        />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DIVISIONS.map((d) => (
            <GlassCard key={d.id} className="group p-6 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-red-500/10 cursor-pointer">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[14px] text-white shadow"
                style={{ background: `linear-gradient(135deg, ${RED}, ${RED})` }}
              >
                <d.Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-[17px] text-[#2a2320]">{d.name}</h3>
              <div className="text-[12px] font-medium uppercase tracking-wide text-[#c81e2c]">
                {d.tagline}
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-[#857a75]">
                {d.desc}
              </p>
            </GlassCard>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => onNavigate("login")}
            className="inline-flex items-center rounded-full px-8 py-4 text-[15px] font-bold text-[#c81e2c] shadow-md transition hover:scale-105"
            style={{ background: "#fff" }}
          >
            Mulai Pendaftaran <ArrowRight className="ml-1.5 h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center">
      <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[#c81e2c]">
        {kicker}
      </div>
      <h2 className="mt-2 text-[30px] font-extrabold tracking-tight text-[#2a2320]">
        {title}
      </h2>
    </div>
  );
}
