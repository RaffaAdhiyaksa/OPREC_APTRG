import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

export interface ChipOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

/** Single-select pill filters (radio group semantics). */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm outline-none transition-all duration-200 ease-out focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4",
              active
                ? "border-transparent bg-card font-medium text-foreground shadow-sm"
                : "border-border text-muted-foreground hover:bg-card/60 hover:text-foreground",
            )}
          >
            {option.icon}
            {option.label}
            {option.count !== undefined && <span className="tabular-nums text-muted-foreground">{option.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
