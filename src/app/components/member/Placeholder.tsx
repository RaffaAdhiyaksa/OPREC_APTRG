import { Construction } from "lucide-react";
import { GlassCard, RED } from "../aptrg/shared";

export function Placeholder({ title }: { title: string }) {
  return (
    <GlassCard className="flex flex-col items-center justify-center gap-4 p-16 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-[16px] text-white"
        style={{ background: RED }}
      >
        <Construction className="h-7 w-7" />
      </div>
      <h2 className="text-[20px] font-extrabold tracking-tight text-[#2a2320]">
        {title}
      </h2>
      <p className="max-w-md text-[14px] leading-relaxed text-[#857a75]">
        Halaman <span className="font-semibold text-[#2a2320]">{title}</span>{" "}
        sedang disiapkan. Sobat Angkasa dapat mengakses fitur ini setelah pembaruan
        portal berikutnya. Terima kasih atas kesabarannya!
      </p>
    </GlassCard>
  );
}
