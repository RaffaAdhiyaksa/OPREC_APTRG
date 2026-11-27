import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-7xl font-light tracking-tight">404</p>
      <p className="text-sm text-muted-foreground">Halaman yang Anda cari tidak ditemukan.</p>
      <Button asChild className="rounded-full">
        <Link to="/">
          <ArrowLeft aria-hidden />
          Kembali ke beranda
        </Link>
      </Button>
    </main>
  );
}
