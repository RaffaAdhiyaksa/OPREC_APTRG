import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

// Route skeleton for F1. Each page is replaced by its real implementation in phases F2–F7.
export function PlaceholderPage({ title }: { title: string }) {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto flex min-h-full max-w-7xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold uppercase tracking-tight sm:text-5xl">{title}</h1>
        {user && (
          <Button variant="default" className="rounded-full" onClick={() => void logout()}>
            <LogOut aria-hidden />
            Keluar
          </Button>
        )}
      </div>
      <div className="rounded-xl bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Halaman ini dibangun di fase berikutnya.
          {user && ` Masuk sebagai ${user.name} (${user.role}).`}
        </p>
      </div>
    </main>
  );
}
