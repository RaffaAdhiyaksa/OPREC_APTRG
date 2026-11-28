import { useState } from "react";
import { Check, Copy, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useImportUsers } from "@/hooks/queries/admin";
import { saveBlob } from "@/lib/download";
import { toApiError } from "@/lib/errors";
import type { UserImportResult } from "@/types/api";

const HEADER = "name,email,nim,phone,role,division_slug";
const TEMPLATE = `${HEADER}
Budi Santoso,budi@student.telkomuniversity.ac.id,1101220001,081234567890,asisten_magang,system
Sari Dewi,sari@student.telkomuniversity.ac.id,1101220002,,asisten_aktif,mechanic
`;

type Failure = { message: string; lines: { line: string; messages: string[] }[] };

const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

/** Upload a user CSV (all rows or none) and show the generated passwords exactly once. */
export function ImportUsersDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const importUsers = useImportUsers();
  const [file, setFile] = useState<File | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [result, setResult] = useState<UserImportResult | null>(null);
  const [copied, setCopied] = useState(false);

  const close = (next: boolean) => {
    if (next || importUsers.isPending) return;
    setFile(null);
    setFailure(null);
    setResult(null);
    setCopied(false);
    onOpenChange(false);
  };

  const submit = async () => {
    if (!file) return;
    setFailure(null);
    try {
      const data = await importUsers.mutateAsync(file);
      setResult(data);
      toast.success(`${data.created_count} pengguna dibuat.`);
    } catch (raw) {
      const error = toApiError(raw);
      if (error.code === "IMPORT_INVALID" || error.code === "IMPORT_TOO_LARGE" || error.code === "VALIDATION_ERROR") {
        // Numeric keys are CSV line numbers (header = line 1); anything else is about the file itself.
        const lines = Object.entries(error.errors ?? {})
          .filter(([key]) => /^\d+$/.test(key))
          .map(([line, messages]) => ({ line, messages }))
          .sort((a, b) => Number(a.line) - Number(b.line));
        const fileMessage = error.errors?.file?.[0];
        setFailure({ message: fileMessage && !lines.length ? fileMessage : error.message, lines });
      } else {
        toast.error(error.message);
      }
    }
  };

  const copyAll = async () => {
    if (!result) return;
    const text = result.users.map((u) => [u.name, u.email, u.temporary_password].join("\t")).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Daftar password disalin.");
    } catch {
      toast.error("Gagal menyalin. Unduh CSV sebagai gantinya.");
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const rows = result.users.map((u) => [u.name, u.email, u.temporary_password].map(csvCell).join(","));
    saveBlob(new Blob([["name,email,temporary_password", ...rows].join("\n") + "\n"], { type: "text/csv" }), "password-sementara.csv");
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>{result.created_count} pengguna dibuat</DialogTitle>
              <DialogDescription>Bagikan password sementara ke masing-masing pengguna. Mereka wajib menggantinya saat pertama masuk.</DialogDescription>
            </DialogHeader>
            <p className="text-sm font-medium text-destructive">Hanya tampil sekali. Salin atau unduh sebelum dialog ditutup.</p>
            <div className="max-h-80 overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="pr-4">Password sementara</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.users.map((u) => (
                    <TableRow key={u.email}>
                      <TableCell className="pl-4">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="pr-4">
                        <code className="font-mono select-all">{u.temporary_password}</code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => void copyAll()}>
                  {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                  {copied ? "Disalin" : "Salin semua"}
                </Button>
                <Button variant="outline" onClick={downloadResult}>
                  <Download aria-hidden /> Unduh CSV
                </Button>
              </div>
              <Button onClick={() => close(false)}>Selesai</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <span className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md">
                <FileSpreadsheet className="size-5" aria-hidden />
              </span>
              <DialogTitle>Import pengguna dari CSV</DialogTitle>
              <DialogDescription>Maksimal 200 baris. Jika satu baris salah, tidak ada pengguna yang dibuat.</DialogDescription>
            </DialogHeader>

            <div className="min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Format</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => saveBlob(new Blob([TEMPLATE], { type: "text/csv" }), "template-import-pengguna.csv")}
                >
                  <Download aria-hidden /> Unduh template
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-xl border bg-muted/60 p-3 font-mono text-xs leading-relaxed">{TEMPLATE.trim()}</pre>
              <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                <li>
                  <code>role</code>: admin, asisten_aktif, atau asisten_magang.
                </li>
                <li>
                  <code>division_slug</code>: mechanic, system, gcs, atau non-technical. Kosongkan untuk admin.
                </li>
                <li>
                  <code>nim</code> dan <code>phone</code> boleh kosong.
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-file">File CSV</Label>
              <Input
                id="import-file"
                type="file"
                accept=".csv,text/csv"
                disabled={importUsers.isPending}
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setFailure(null);
                }}
              />
            </div>

            {failure && (
              <Alert variant="destructive">
                <AlertTitle>{failure.message}</AlertTitle>
                {failure.lines.length > 0 && (
                  <AlertDescription>
                    <ul className="max-h-48 w-full space-y-1 overflow-y-auto">
                      {failure.lines.map(({ line, messages }) => (
                        <li key={line}>
                          <span className="font-semibold">Baris {line}:</span> {messages.join(" ")}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                )}
              </Alert>
            )}

            <DialogFooter>
              <Button variant="outline" disabled={importUsers.isPending} onClick={() => close(false)}>
                Batal
              </Button>
              <Button disabled={!file || importUsers.isPending} onClick={() => void submit()}>
                {importUsers.isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
                {importUsers.isPending ? "Mengimpor… (bisa hingga 1 menit)" : "Import"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
