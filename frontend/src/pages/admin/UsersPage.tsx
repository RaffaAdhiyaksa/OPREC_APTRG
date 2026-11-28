import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { KeyRound, MoreHorizontal, Pencil, Plus, Power, Trash2, UserX, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FilterChips } from "@/components/shared/FilterChips";
import { Pager, SearchInput, TableCard } from "@/components/shared/ListControls";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { CoordinatorBadge, InactiveBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useCurrentUser } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDeleteUser, useDivisions, useResetUserPassword, useSetUserActive, useUsers } from "@/hooks/queries/admin";
import { formatRelative } from "@/lib/date";
import { getErrorMessage } from "@/lib/errors";
import { ROLE_LABEL } from "@/lib/labels";
import type { AdminUser, Role, TemporaryPasswordResult } from "@/types/api";
import { TemporaryPasswordDialog } from "./TemporaryPasswordDialog";
import { UserFormDialog } from "./UserFormDialog";

type RoleFilter = Role | "all";
type Confirm = { kind: "deactivate" | "activate" | "reset" | "delete"; user: AdminUser } | null;

export default function UsersPage() {
  const me = useCurrentUser();
  const [params, setParams] = useSearchParams();
  const role = (params.get("role") as RoleFilter | null) ?? "all";
  const divisionId = params.get("division_id") ?? "all";
  const status = params.get("status") ?? "all";
  const page = Number(params.get("page") ?? 1);
  const [search, setSearch] = useState(params.get("q") ?? "");
  const debouncedSearch = useDebouncedValue(search);

  const update = (patch: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === null || value === "all" || value === "") next.delete(key);
          else next.set(key, value);
        }
        if (!("page" in patch)) next.delete("page");
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    if ((params.get("q") ?? "") !== debouncedSearch) update({ q: debouncedSearch });
    // Sync the URL only when the debounced term changes.
  }, [debouncedSearch]);

  const { data: divisions = [] } = useDivisions();
  const users = useUsers({
    search: debouncedSearch || undefined,
    role: role === "all" ? undefined : role,
    division_id: divisionId === "all" ? undefined : Number(divisionId),
    is_active: status === "all" ? undefined : status === "active",
    page,
  });

  const [formUser, setFormUser] = useState<AdminUser | null | undefined>(params.get("create") ? null : undefined);
  const [temporary, setTemporary] = useState<TemporaryPasswordResult | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const setActive = useSetUserActive();
  const resetPassword = useResetUserPassword();
  const deleteUser = useDeleteUser();

  const closeForm = () => {
    setFormUser(undefined);
    if (params.get("create")) update({ create: null });
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, user } = confirm;
    try {
      if (kind === "reset") {
        setTemporary(await resetPassword.mutateAsync(user.id));
      } else if (kind === "delete") {
        await deleteUser.mutateAsync(user.id);
        toast.success(`${user.name} dihapus.`);
      } else {
        await setActive.mutateAsync({ id: user.id, isActive: kind === "activate" });
        toast.success(kind === "activate" ? `${user.name} diaktifkan.` : `${user.name} dinonaktifkan.`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    }
  };

  const confirmCopy = confirm && {
    deactivate: {
      title: `Nonaktifkan ${confirm.user.name}?`,
      description: "Pengguna langsung keluar dari semua perangkat dan tidak bisa masuk sampai diaktifkan kembali. Data tugas dan nilainya tetap tersimpan.",
      label: "Nonaktifkan",
      destructive: true,
    },
    activate: { title: `Aktifkan ${confirm.user.name}?`, description: "Pengguna bisa masuk kembali dengan password terakhirnya.", label: "Aktifkan", destructive: false },
    reset: {
      title: `Reset password ${confirm.user.name}?`,
      description: "Password lama tidak berlaku lagi. Sistem membuat password sementara yang wajib diganti saat masuk.",
      label: "Reset password",
      destructive: false,
    },
    delete: {
      title: `Hapus ${confirm.user.name}?`,
      description: "Akun dihapus dan tidak bisa masuk lagi. Riwayat pengumpulan dan nilai tetap tersimpan untuk arsip.",
      label: "Hapus",
      destructive: true,
    },
  }[confirm.kind];

  const research = divisions.filter((d) => d.type === "research");

  return (
    <>
      <PageHeader
        title="Pengguna"
        description="Kelola akun admin, asisten aktif, dan asisten magang."
        actions={
          <Button size="lg" className="h-11 pl-1.5 shadow-md" onClick={() => setFormUser(null)}>
            <span className="flex size-8 items-center justify-center rounded-full bg-white/20">
              <Plus aria-hidden />
            </span>
            Tambah Pengguna
          </Button>
        }
        stats={users.data ? [{ label: "Pengguna", value: users.data.meta.total }] : undefined}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama, email, atau NIM" className="lg:w-72" />
        <FilterChips<RoleFilter>
          label="Filter role"
          value={role}
          onChange={(v) => update({ role: v })}
          options={[
            { value: "all", label: "Semua" },
            { value: "admin", label: "Admin" },
            { value: "asisten_aktif", label: "Asisten Aktif" },
            { value: "asisten_magang", label: "Asisten Magang" },
          ]}
        />
        <div className="flex gap-2 lg:ml-auto">
          <Select value={divisionId} onValueChange={(v) => update({ division_id: v })}>
            <SelectTrigger className="h-10 w-full bg-white/70 sm:w-44 dark:bg-white/5" aria-label="Filter divisi">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua divisi</SelectItem>
              {research.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => update({ status: v })}>
            <SelectTrigger className="h-10 w-full bg-white/70 sm:w-36 dark:bg-white/5" aria-label="Filter status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {users.isError ? (
        <ErrorState error={users.error} onRetry={() => void users.refetch()} />
      ) : users.data && users.data.data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tidak ada pengguna yang cocok."
          description="Ubah kata kunci atau filter."
          action={
            <Button variant="outline" onClick={() => { setSearch(""); setParams({}, { replace: true }); }}>
              Reset filter
            </Button>
          }
        />
      ) : (
        <TableCard footer={users.data && <Pager meta={users.data.meta} onPage={(p) => update({ page: String(p) })} />}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Nama</TableHead>
                <TableHead>NIM</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Login terakhir</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.isPending
                ? [0, 1, 2, 3, 4].map((i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="px-5">
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : users.data.data.map((u) => {
                    const self = u.id === me.id;
                    return (
                      <TableRow key={u.id} className={u.is_active ? undefined : "opacity-60"}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={u.name} />
                            <div className="min-w-0">
                              <p className="font-medium">
                                {u.name}
                                {self && <span className="ml-1.5 text-xs text-muted-foreground">(Anda)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">{u.nim ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{ROLE_LABEL[u.role]}</span>
                            {u.is_coordinator && <CoordinatorBadge />}
                          </div>
                        </TableCell>
                        <TableCell>{u.research_division?.name ?? "—"}</TableCell>
                        <TableCell>{u.is_active ? <Badge variant="outline">Aktif</Badge> : <InactiveBadge />}</TableCell>
                        <TableCell className="text-muted-foreground">{u.last_login_at ? formatRelative(u.last_login_at) : "Belum pernah"}</TableCell>
                        <TableCell className="pr-5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Aksi untuk ${u.name}`}>
                                <MoreHorizontal aria-hidden />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-xl">
                              <DropdownMenuItem onSelect={() => setFormUser(u)}>
                                <Pencil aria-hidden /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setConfirm({ kind: "reset", user: u })}>
                                <KeyRound aria-hidden /> Reset password
                              </DropdownMenuItem>
                              {u.is_active ? (
                                <DropdownMenuItem disabled={self} onSelect={() => setConfirm({ kind: "deactivate", user: u })}>
                                  <UserX aria-hidden /> Nonaktifkan
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onSelect={() => setConfirm({ kind: "activate", user: u })}>
                                  <Power aria-hidden /> Aktifkan
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" disabled={self} onSelect={() => setConfirm({ kind: "delete", user: u })}>
                                <Trash2 aria-hidden /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </TableCard>
      )}

      <UserFormDialog
        open={formUser !== undefined}
        onOpenChange={(open) => !open && closeForm()}
        user={formUser ?? null}
        onCreated={setTemporary}
      />
      <TemporaryPasswordDialog result={temporary} onClose={() => setTemporary(null)} />
      {confirm && confirmCopy && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setConfirm(null)}
          title={confirmCopy.title}
          description={confirmCopy.description}
          confirmLabel={confirmCopy.label}
          destructive={confirmCopy.destructive}
          onConfirm={runConfirm}
        />
      )}
    </>
  );
}
