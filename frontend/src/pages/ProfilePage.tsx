import { Badge } from "@/components/ui/badge";
import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { CoordinatorBadge } from "@/components/shared/StatusBadge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useCurrentUser } from "@/hooks/useAuth";
import { ROLE_LABEL } from "@/lib/labels";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const user = useCurrentUser();

  return (
    <>
      <PageHeader title="Profil" description="Data akun dikelola admin lab. Hubungi admin untuk mengubah nama atau email." />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="glass min-w-0 space-y-6 rounded-2xl p-6 sm:p-8" aria-labelledby="profile-heading">
          <div className="flex items-center gap-4">
            <UserAvatar name={user.name} className="size-16 text-lg" />
            <div className="min-w-0 space-y-1">
              <h2 id="profile-heading" className="truncate text-2xl font-semibold">
                {user.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Badge>{ROLE_LABEL[user.role]}</Badge>
                {user.is_coordinator && <CoordinatorBadge />}
              </div>
            </div>
          </div>
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field label="Email">{user.email}</Field>
            <Field label="NIM">{user.nim ?? "—"}</Field>
            <Field label="Divisi riset">{user.research_division?.name ?? "—"}</Field>
            <Field label="Divisi lomba">
              {user.competition_divisions.length ? (
                <span className="flex flex-wrap gap-2">
                  {user.competition_divisions.map((d) => (
                    <Badge key={d.id} variant="outline">
                      {d.name}
                      {d.team_name && <span className="text-muted-foreground">· {d.team_name}</span>}
                    </Badge>
                  ))}
                </span>
              ) : (
                "—"
              )}
            </Field>
          </dl>
        </section>

        <section className="glass min-w-0 space-y-6 rounded-2xl p-6 sm:p-8" aria-labelledby="password-heading">
          <div className="space-y-1">
            <h2 id="password-heading" className="text-lg font-medium">
              Ganti password
            </h2>
            <p className="text-sm text-muted-foreground">Sesi di perangkat lain akan dikeluarkan setelah password diganti.</p>
          </div>
          <ChangePasswordForm />
        </section>
      </div>
    </>
  );
}
