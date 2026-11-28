import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TemporaryPasswordResult } from "@/types/api";

/** Shows a server-generated temporary password exactly once. */
export function TemporaryPasswordDialog({ result, onClose }: { result: TemporaryPasswordResult | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const close = () => {
    setCopied(false);
    onClose();
  };

  const copy = async () => {
    if (!result?.temporary_password) return;
    try {
      await navigator.clipboard.writeText(result.temporary_password);
      setCopied(true);
      toast.success("Password disalin.");
    } catch {
      toast.error("Gagal menyalin. Salin manual dari kotak di atas.");
    }
  };

  return (
    <Dialog
      open={result !== null}
      onOpenChange={(open) => !open && close()}
    >
      <DialogContent>
        <DialogHeader>
          <span className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md">
            <KeyRound className="size-5" aria-hidden />
          </span>
          <DialogTitle>Password sementara</DialogTitle>
          <DialogDescription>
            Berikan ke <strong className="text-foreground">{result?.user.name}</strong> ({result?.user.email}). Pengguna wajib menggantinya saat pertama masuk.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-xl border bg-muted/60 p-2 pl-4">
          <code className="flex-1 font-mono text-lg tracking-wider select-all">{result?.temporary_password}</code>
          <Button variant="outline" size="sm" onClick={() => void copy()}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied ? "Disalin" : "Salin"}
          </Button>
        </div>
        <p className="text-sm font-medium text-destructive">Hanya tampil sekali. Password tidak bisa dilihat lagi setelah dialog ditutup.</p>
        <DialogFooter>
          <Button onClick={close}>Selesai</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
