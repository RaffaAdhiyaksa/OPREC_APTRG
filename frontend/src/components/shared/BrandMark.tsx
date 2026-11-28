import logo from "@/assets/aptrg_logo.png";
import { cn } from "@/components/ui/utils";

/** Lab logo lockup: logo tile + "APTRG" + uppercase subtitle (same as the lab website). */
export function BrandMark({
  className,
  textClassName,
  subtitle = "Learning Management System",
}: {
  className?: string;
  textClassName?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("flex select-none items-center gap-2.5", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
        <img src={logo} alt="Logo APTRG" className="size-7 object-contain drop-shadow-sm" />
      </span>
      <span className={cn("leading-tight", textClassName)}>
        <span className="block text-xl font-extrabold tracking-tight">APTRG</span>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{subtitle}</span>
      </span>
    </div>
  );
}
