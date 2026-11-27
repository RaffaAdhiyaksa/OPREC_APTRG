import logo from "@/assets/aptrg_logo.png";
import { cn } from "@/components/ui/utils";

export function BrandMark({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card">
        <img src={logo} alt="Logo APTRG" className="size-8 object-contain" />
      </span>
      {showText && <span className="text-lg font-semibold tracking-tight">APTRG LMS</span>}
    </div>
  );
}
