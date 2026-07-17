import { Mail, MapPin, Instagram, Globe } from "lucide-react";
import { Logo } from "./shared";

export function Footer() {
  return (
    <footer className="relative z-10 mx-auto mt-24 w-full max-w-6xl px-4 pb-10">
      <div className="relative overflow-hidden rounded-[18px] border border-white/60 bg-white/70 px-8 py-10 backdrop-blur-xl shadow-[0_10px_40px_-14px_rgba(80,40,40,0.25)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-[#857a75]">
              Aeromodelling & Payload Telemetry Research Group — laboratorium riset
              UAV/drone tingkat universitas.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-[#2a2320]">Kontak</h4>
            <ul className="space-y-2.5 text-[14px] text-[#5a504b]">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#c81e2c]" /> recruitment@aptrg.ac.id
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-[#c81e2c]" /> Gedung Riset Teknik, Lt. 3
              </li>
              <li className="flex items-center gap-2.5">
                <Instagram className="h-4 w-4 text-[#c81e2c]" /> @aptrg.lab
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="h-4 w-4 text-[#c81e2c]" /> aptrg.ac.id
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-[#2a2320]">Open Recruitment 2026</h4>
            <p className="text-[14px] leading-relaxed text-[#857a75]">
              Pendaftaran dibuka untuk seluruh mahasiswa aktif. Ikuti setiap tahapan
              seleksi hingga onboarding magang di laboratorium.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-white/60 pt-5 text-[13px] text-[#857a75]">
          © 2026 APTRG — Aeromodelling & Payload Telemetry Research Group. Seluruh hak
          cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
