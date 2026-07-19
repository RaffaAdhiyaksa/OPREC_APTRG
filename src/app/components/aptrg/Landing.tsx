import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import {
  FlaskConical,
  Trophy,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Plane,
  X,
} from "lucide-react";
import HeroParticles from "./HeroParticles";
import { DIVISIONS, Screen, RED, AMBER } from "./shared";
import { useAuthContext } from "../../context/AuthContext";

const REASONS_KEYS = [
  {
    Icon: FlaskConical,
    id: "facilities",
    img: "Riset Nyata"
  },
  {
    Icon: Trophy,
    id: "competitions",
    img: "Delegasi Kompetisi"
  },
  {
    Icon: GraduationCap,
    id: "mentorship",
    img: "Mentorship"
  },
  {
    Icon: Briefcase,
    id: "career",
    img: "Karir Lab"
  },
];

export function Landing({
  onNavigate,
}: {
  onNavigate: (s: Screen) => void;
}) {
  const { user, role, loading } = useAuthContext();
  const { t } = useTranslation();
  const [expandedDivision, setExpandedDivision] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  useEffect(() => {
    if (expandedDivision !== null || selectedReason !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [expandedDivision, selectedReason]);

  const goToDashboard = () => {
    // Cuma tunggu selama loading AWAL (initial fetch belum selesai sama
    // sekali). Kalau loading udah selesai tapi role tetap null (query gagal),
    // jangan nyangkut nunggu selamanya — arahkan ke "dashboard", yang sudah
    // punya tampilan error yang jelas buat kasus ini (lihat Dashboard.tsx).
    if (loading) return;
    const target = role === "admin" || role === "asisten" || role === null ? "dashboard" : "dashboard-user";
    onNavigate(target);
  };

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#f6f2f0] dark:bg-zinc-950 transition-colors duration-500">
        <img
          src="/assets/Foto Anggota.webp"
          alt="Latar Belakang Anggota"
          className="w-full h-full object-cover object-[center_20%] opacity-20 dark:opacity-50 transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-white/20 dark:bg-black/50 backdrop-blur-[3px] transition-colors duration-500" />
        <HeroParticles />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pt-32 pb-32">
        {/* Hero */}
        <section id="hero" className="grid items-center gap-16 md:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            className="relative z-10"
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
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { ease: "linear", duration: 0.4 } } }} className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/40 px-4 py-1.5 text-sm font-semibold text-[#c81e2c] backdrop-blur-xl shadow-sm transition-colors duration-500">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: RED }} />
              {t("hero.registrationOpen")}
            </motion.div>
            <motion.h1 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { ease: "linear", duration: 0.4 } } }} className="mt-8 text-5xl sm:text-6xl font-extrabold leading-[1.1] tracking-tighter text-[#1a1614] dark:text-zinc-50 transition-colors duration-500">
              {t("hero.openRecruitment")}{" "}
              <span className="text-[#c81e2c]">APTRG 2026</span>
            </motion.h1>
            <motion.p variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { ease: "linear", duration: 0.4 } } }} className="mt-6 max-w-lg text-lg leading-relaxed text-gray-600 dark:text-zinc-400 transition-colors duration-500">
              {t("hero.desc")}
            </motion.p>
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { ease: "linear", duration: 0.4 } } }} className="mt-10 flex flex-wrap items-center gap-4">
              {user ? (
                <button
                  onClick={goToDashboard}
                  className="inline-flex items-center justify-center rounded-full bg-[#c81e2c] px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all ease-linear duration-300 hover:scale-[1.03] hover:shadow-xl hover:bg-[#a11420]"
                >
                  {t("hero.openDashboard")} <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate("login")}
                    className="inline-flex items-center justify-center rounded-full bg-[#c81e2c] px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all ease-linear duration-300 hover:scale-[1.03] hover:shadow-xl hover:bg-[#a11420]"
                  >
                    {t("hero.openDashboard")} <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onNavigate("login")}
                    className="rounded-full border border-gray-200 bg-white/80 px-8 py-3.5 text-base font-semibold text-[#1a1614] backdrop-blur-xl transition-all ease-linear duration-300 hover:bg-gray-50 hover:border-gray-300"
                  >
                    {t("hero.alreadyRegistered")}
                  </button>
                </>
              )}
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { ease: "linear", duration: 0.4 } } }} className="mt-12 flex gap-10 border-t border-gray-200 dark:border-white/10 pt-8 transition-colors duration-500">
              {[
                { n: "4", l: t("stats.divisions") },
                { n: "5", l: t("stats.teams") },
                { n: "99+", l: t("stats.achievements") },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-3xl font-extrabold tracking-tight text-[#1a1614] dark:text-zinc-50 transition-colors duration-500">{s.n}</div>
                  <div className="mt-1 text-sm font-medium text-gray-500 dark:text-zinc-400 transition-colors duration-500">{s.l}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Hero Card */}
          <div className="relative z-10 overflow-hidden rounded-2xl border border-gray-50 dark:border-white/10 bg-white/90 dark:bg-zinc-900/60 p-10 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-md dark:shadow-black/50 transition-colors duration-500">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${RED}, ${AMBER})` }}
            >
              <Plane className="h-8 w-8" />
            </div>
            <h3 className="mt-8 text-2xl font-bold tracking-tight text-[#1a1614] dark:text-zinc-50 transition-colors duration-500">{t("heroCard.title")}</h3>
            <p className="mt-3 text-base leading-relaxed text-gray-500 dark:text-zinc-400 transition-colors duration-500">
              {t("heroCard.desc")}
            </p>
            <ul className="mt-8 space-y-4">
              {(t("heroCard.list", { returnObjects: true }) as string[]).map((tItem) => (
                <li key={tItem} className="flex items-center gap-3 text-base font-medium text-[#1a1614] dark:text-zinc-400 transition-colors duration-500">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-[#c81e2c]">
                    <Plane className="h-3.5 w-3.5" />
                  </span>
                  {tItem}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Why */}
        <section id="why" className="mt-32">
          <SectionHeading
            kicker={t("reasons.kicker")}
            title={t("reasons.title")}
          />
          <div className="mt-12 grid gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS_KEYS.map((r, i) => (
              <motion.div
                key={r.id}
                onClick={() => setSelectedReason(r.id)}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: "linear" }}
                className="relative overflow-hidden [transform:translateZ(0)] group rounded-2xl aspect-square lg:aspect-auto lg:h-[420px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer"
              >
                <img loading="lazy" width="800" height="800" src={`/assets/${r.img}.webp`} alt={t(`reasons.items.${r.id}.title`)} className="absolute inset-0 w-full h-full object-cover object-center transition-transform ease-linear duration-700 group-hover:scale-100" />
                <div className="absolute inset-0 bg-black/50 transition-opacity ease-linear duration-500 group-hover:opacity-20 z-0"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 z-0"></div>

                <div className="absolute bottom-0 left-0 p-6 lg:p-8 flex flex-col items-start justify-end w-full z-10 transition-transform ease-linear duration-500 group-hover:-translate-y-2 text-left">
                  <div className="flex flex-none h-12 w-12 lg:h-16 lg:w-16 items-center justify-center rounded-full bg-white/25 backdrop-blur-md text-white mb-0 mt-0 shadow-lg border border-white/20">
                    <r.Icon className="h-5 w-5 lg:h-8 lg:w-8 drop-shadow-md" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-white drop-shadow-md leading-tight h-[2.75rem] lg:h-[3.5rem] flex items-end">{t(`reasons.items.${r.id}.title`)}</h3>
                  <p className="mt-1 text-sm lg:text-base leading-relaxed text-gray-100 drop-shadow-md h-[4.5rem] lg:h-[5rem] line-clamp-3">
                    {t(`reasons.items.${r.id}.desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Reason Side Drawer */}
          {typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
              {selectedReason && (() => {
                const r = REASONS_KEYS.find(x => x.id === selectedReason);
                if (!r) return null;
                return (
                  <div className="fixed inset-0 z-[10000] flex justify-end">
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: "linear" }}
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                      onClick={() => setSelectedReason(null)}
                    />

                    {/* Drawer */}
                    <motion.div
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ duration: 0.3, ease: "linear" }}
                      className="relative h-full w-full md:w-[400px] bg-[#1a1614] dark:bg-zinc-950 shadow-2xl dark:shadow-md dark:shadow-black/50 dark:border-l dark:border-white/10 flex flex-col z-10 overflow-hidden"
                    >
                      <button
                        onClick={() => setSelectedReason(null)}
                        className="absolute top-6 right-6 z-20 text-white/70 hover:text-white bg-black/40 hover:bg-black/80 p-2 rounded-full backdrop-blur-md transition-all ease-linear cursor-pointer"
                      >
                        <X className="w-6 h-6 drop-shadow-md" />
                      </button>

                      {/* Header Image */}
                      <div className="relative h-[250px] w-full shrink-0">
                        <img loading="lazy" src={`/assets/${r.img}.webp`} alt={t(`reasons.items.${r.id}.title`)} className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" />
                        <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1614] dark:from-zinc-950 via-[#1a1614]/80 dark:via-zinc-950/80 to-transparent z-0 pointer-events-none"></div>

                        <div className="absolute bottom-0 left-0 p-8 flex flex-col justify-end w-full z-10 translate-y-6">
                          <div className="flex flex-none h-14 w-14 items-center justify-center rounded-full bg-[#c81e2c] backdrop-blur-md text-white mb-0 mt-0 shadow-lg border border-red-400/30">
                            <r.Icon className="h-6 w-6 drop-shadow-md" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 overflow-y-auto p-8 pt-8 text-left">
                        <h3 className="text-3xl font-bold tracking-tight text-white dark:text-zinc-50 drop-shadow-md leading-tight">{t(`reasons.items.${r.id}.title`)}</h3>
                        <p className="mt-6 text-base leading-relaxed text-gray-300 dark:text-zinc-400 drop-shadow-md">
                          {t(`reasons.items.${r.id}.desc`)}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                );
              })()}
            </AnimatePresence>,
            document.body
          )}
        </section>

        {/* Divisions */}
        <section id="divisi" className="mt-32">
          <SectionHeading
            kicker={t("divisions.kicker")}
            title={t("divisions.title")}
          />

          {/* Mobile-Only: Swiper Idle */}
          <div className="md:hidden mt-8 px-6 -mx-6 z-10 relative">
            <Swiper
              slidesPerView={1.15}
              centeredSlides={true}
              spaceBetween={16}
              className="w-full h-[70vh]"
            >
              {DIVISIONS?.map((d) => (
                <SwiperSlide key={`mobile-${d?.id}`}>
                  <div
                    onClick={() => setExpandedDivision(d?.id)}
                    className="relative overflow-hidden w-full h-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl cursor-pointer"
                  >
                    <img loading="lazy" width="800" height="800" src={`/assets/${d?.name}.webp`} alt={d?.name} className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" />
                    <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90 z-0 pointer-events-none"></div>

                    <div className="absolute left-0 p-8 flex flex-col justify-end w-full z-10 bottom-0 pointer-events-none">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 backdrop-blur-md text-white mb-6 shadow-xl border border-red-400/30">
                        {d?.Icon && <d.Icon className="h-8 w-8 drop-shadow-md" />}
                      </div>
                      <h3 className="font-bold tracking-tight text-white dark:text-zinc-50 drop-shadow-md text-3xl">{t(`divisions.items.${d?.id}.name`)}</h3>
                      <div className="mt-2 text-sm font-bold uppercase tracking-wider text-red-400 drop-shadow-md">
                        {t(`divisions.items.${d?.id}.tagline`)}
                      </div>
                      <p className="mt-4 leading-relaxed text-gray-100 dark:text-zinc-400 drop-shadow-md text-base line-clamp-2">
                        {t(`divisions.items.${d?.id}.desc`)}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Desktop-Only: Swiper Navigation Layout */}
          <div className="mt-4 hidden md:block px-6 -mx-4 relative z-20 pt-6">
            <Swiper
              modules={[Navigation]}
              navigation
              slidesPerView={4}
              spaceBetween={32}
              className="w-full pb-8 !overflow-visible"
            >
              {DIVISIONS?.map((d) => (
                <SwiperSlide key={`desktop-${d?.id}`}>
                  <motion.div
                    layoutId={`card-${d?.id}`}
                    onClick={() => setExpandedDivision(d?.id)}
                    whileHover={{ scale: 1.05, y: -10 }}
                    className="w-full relative overflow-hidden [transform:translateZ(0)] group cursor-pointer rounded-2xl aspect-[4/5] lg:aspect-auto lg:h-[500px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-shadow ease-linear duration-500 hover:shadow-[0_20px_40px_rgba(220,38,38,0.2)]"
                  >
                    <img loading="lazy" width="800" height="800" src={`/assets/${d?.name}.webp`} alt={d?.name} className="absolute inset-0 w-full h-full object-cover object-center transition-transform ease-linear duration-700 group-hover:scale-105 pointer-events-none" />
                    <div className="absolute inset-0 bg-black/50 transition-opacity ease-linear duration-500 group-hover:opacity-20 z-0 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 z-0 pointer-events-none"></div>

                    <div className="absolute bottom-0 left-0 p-8 flex flex-col justify-end w-full z-10 transition-transform ease-linear duration-500 group-hover:-translate-y-2 pointer-events-none">
                      <motion.div layoutId={`icon-${d?.id}`} className="flex h-14 w-14 lg:h-20 lg:w-20 items-center justify-center rounded-full bg-red-600 backdrop-blur-md text-white mb-6 lg:mb-8 shadow-xl border border-red-400/30">
                        {d?.Icon && <d.Icon className="h-6 w-6 lg:h-10 lg:w-10 drop-shadow-md" />}
                      </motion.div>
                      <motion.h3 layoutId={`title-${d?.id}`} className="text-2xl lg:text-4xl font-bold tracking-tight text-white dark:text-zinc-50 drop-shadow-md">{t(`divisions.items.${d?.id}.name`)}</motion.h3>
                      <motion.div layoutId={`tagline-${d?.id}`} className="mt-1.5 lg:mt-2 text-xs lg:text-sm font-bold uppercase tracking-wider text-red-400 drop-shadow-md">
                        {t(`divisions.items.${d?.id}.tagline`)}
                      </motion.div>
                      <motion.p layoutId={`desc-${d?.id}`} className="mt-3 lg:mt-5 text-sm lg:text-lg leading-relaxed text-gray-100 dark:text-zinc-400 drop-shadow-md line-clamp-2 lg:line-clamp-3">
                        {t(`divisions.items.${d?.id}.desc`)}
                      </motion.p>
                    </div>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Universal Pop-up Modal with Swiper (Portaled to document.body) */}
          {typeof document !== 'undefined' && createPortal(
            <AnimatePresence>
              {expandedDivision && (() => {
                const initialIndex = DIVISIONS.findIndex((div) => div?.id === expandedDivision);
                return (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center md:p-4"
                  >
                    {/* Backdrop Click Handler */}
                    <div className="absolute inset-0 cursor-pointer" onClick={() => setExpandedDivision(null)}></div>

                    <button
                      onClick={() => setExpandedDivision(null)}
                      className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/40 hover:bg-black/80 p-3 rounded-full backdrop-blur-md transition-all ease-linear cursor-pointer z-[10000]"
                    >
                      <X className="w-8 h-8 drop-shadow-md" />
                    </button>

                    <div className="relative w-full h-full md:max-w-5xl md:h-[85vh] pointer-events-auto">
                      <Swiper
                        modules={[Navigation]}
                        navigation={true}
                        initialSlide={initialIndex}
                        slidesPerView={1}
                        spaceBetween={0}
                        style={{ '--swiper-navigation-color': '#d1d5db' } as React.CSSProperties}
                        className="w-full h-full [&_.swiper-button-next]:text-gray-300 [&_.swiper-button-prev]:text-gray-300 [&_.swiper-button-next]:w-12 [&_.swiper-button-next]:h-12 [&_.swiper-button-prev]:w-12 [&_.swiper-button-prev]:h-12 [&_.swiper-button-next:after]:text-xl [&_.swiper-button-prev:after]:text-xl [&_.swiper-button-next]:hidden md:[&_.swiper-button-next]:flex [&_.swiper-button-prev]:hidden md:[&_.swiper-button-prev]:flex"
                      >
                        {DIVISIONS?.map((d) => (
                          <SwiperSlide key={`popup-${d?.id}`}>
                            <div className="flex w-full h-full items-center justify-center">
                              {/* Left Panel: Software */}
                              <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3, ease: "easeOut", duration: 0.5 }}
                                className="hidden md:flex flex-col justify-center w-[280px] pr-10 text-right"
                              >
                                <div className="text-xs font-mono tracking-widest text-gray-400 uppercase mb-5 flex items-center justify-end gap-3">
                                  Software
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                </div>
                                <ul className="space-y-4">
                                  {d.software?.map((s, i) => (
                                    <li key={`s-${i}`} className="text-gray-100 dark:text-zinc-400 font-semibold tracking-wide">{s}</li>
                                  ))}
                                </ul>
                              </motion.div>

                              {/* Center Card */}
                              <motion.div
                                layoutId={expandedDivision === d?.id ? `card-${d?.id}` : undefined}
                                className="relative w-full md:w-[450px] h-full bg-[#1a1614] dark:bg-zinc-950 overflow-hidden rounded-none md:rounded-[2.5rem] shadow-2xl dark:shadow-md dark:shadow-black/50 dark:border dark:border-white/10 flex-shrink-0"
                              >
                                <img loading="lazy" width="800" height="800" src={`/assets/${d?.name}.webp`} alt={d?.name} className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" />
                                <div className="absolute inset-0 bg-black/20 md:bg-black/10 z-0 pointer-events-none"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 md:via-black/40 to-transparent z-0 pointer-events-none"></div>

                                <div className="relative h-full flex flex-col justify-end p-8 md:p-12 pt-32 md:pt-48 w-full z-10 overflow-y-auto pb-10">
                                  <div className="flex-1 md:flex-none"></div>
                                  <motion.div layoutId={expandedDivision === d?.id ? `icon-${d?.id}` : undefined} className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-red-600 backdrop-blur-md text-white mb-6 shadow-xl border border-red-400/30 shrink-0">
                                    {d?.Icon && <d.Icon className="h-8 w-8 md:h-10 md:w-10 drop-shadow-md" />}
                                  </motion.div>
                                  <motion.h3 layoutId={expandedDivision === d?.id ? `title-${d?.id}` : undefined} className="text-3xl md:text-4xl font-bold tracking-tight text-white dark:text-zinc-50 drop-shadow-md">{t(`divisions.items.${d?.id}.name`)}</motion.h3>
                                  <motion.div layoutId={expandedDivision === d?.id ? `tagline-${d?.id}` : undefined} className="mt-2 text-sm font-bold uppercase tracking-wider text-red-400 drop-shadow-md">
                                    {t(`divisions.items.${d?.id}.tagline`)}
                                  </motion.div>
                                  <motion.p layoutId={expandedDivision === d?.id ? `desc-${d?.id}` : undefined} className="mt-4 md:mt-6 text-base md:text-lg leading-relaxed text-gray-100 dark:text-zinc-400 drop-shadow-md">
                                    {t(`divisions.items.${d?.id}.desc`)}
                                  </motion.p>
                                  
                                  {/* Mobile-Only Tech Stack Chips */}
                                  <div className="md:hidden mt-6 flex flex-wrap gap-2">
                                    {d.software?.map((s, i) => (
                                      <span key={`ms-${i}`} className="bg-red-500/20 border border-red-500/30 text-red-200 text-xs px-3 py-1.5 rounded-full whitespace-nowrap">{s}</span>
                                    ))}
                                    {d.hardware?.map((h, i) => (
                                      <span key={`mh-${i}`} className="bg-blue-500/20 border border-blue-500/30 text-blue-200 text-xs px-3 py-1.5 rounded-full whitespace-nowrap">{h}</span>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>

                              {/* Right Panel: Hardware */}
                              <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3, ease: "easeOut", duration: 0.5 }}
                                className="hidden md:flex flex-col justify-center w-[280px] pl-10 text-left"
                              >
                                <div className="text-xs font-mono tracking-widest text-gray-400 uppercase mb-5 flex items-center justify-start gap-3">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  Equipment
                                </div>
                                <ul className="space-y-4">
                                  {d.hardware?.map((h, i) => (
                                    <li key={`h-${i}`} className="text-gray-100 font-semibold tracking-wide">{h}</li>
                                  ))}
                                </ul>
                              </motion.div>
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>,
            document.body
          )}
          <div className="mt-16 flex justify-center">
            <button
              onClick={() => onNavigate("login")}
              className="inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-base font-bold text-[#1a1614] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 transition-all ease-linear duration-300 hover:scale-[1.03] hover:shadow-[0_12px_40px_rgb(0,0,0,0.1)]"
            >
              {t("footer.startRegistration")} <ArrowRight className="ml-2 h-5 w-5 text-[#c81e2c]" />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center">
      <div className="text-sm font-bold uppercase tracking-widest text-[#c81e2c]">
        {kicker}
      </div>
      <h2 className="mt-3 text-4xl font-extrabold tracking-tighter text-[#1a1614] dark:text-white sm:text-5xl transition-colors duration-500">
        {title}
      </h2>
    </div>
  );
}
