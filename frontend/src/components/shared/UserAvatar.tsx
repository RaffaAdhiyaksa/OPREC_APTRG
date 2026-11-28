import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/components/ui/utils";
import { initials } from "@/lib/labels";

/** Initials on the lab's red → amber gradient. */
export function UserAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <Avatar className={cn("size-9 ring-2 ring-white/80 dark:ring-white/10", className)}>
      <AvatarFallback className="bg-brand-gradient text-xs font-bold text-white">{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
