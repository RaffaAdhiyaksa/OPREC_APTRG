import type { ReactNode } from "react";
import { AlertTriangle, RotateCw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import { getErrorMessage } from "@/lib/errors";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 glass rounded-2xl px-6 py-14 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry: () => void; className?: string }) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Data gagal dimuat"
      description={getErrorMessage(error)}
      className={className}
      action={
        <Button variant="outline" onClick={onRetry}>
          <RotateCw aria-hidden />
          Coba lagi
        </Button>
      }
    />
  );
}
