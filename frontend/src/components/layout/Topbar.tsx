import { Fragment } from "react";
import { Link, useLocation, useParams } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DeadlineStrip } from "@/components/layout/DeadlineStrip";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAssignment } from "@/hooks/queries/assignments";
import { useCurrentUser } from "@/hooks/useAuth";
import { ROLE_LABEL } from "@/lib/labels";
import { sectionLabel } from "@/lib/navigation";

function useCrumbs() {
  const { pathname } = useLocation();
  const { id } = useParams();
  const user = useCurrentUser();
  // Shares the detail page's query, so this adds no extra request.
  const assignment = useAssignment(pathname.startsWith("/assignments/") && id ? Number(id) : 0);
  const home = { label: user.role === "admin" ? "Dashboard" : "Beranda", to: "/" };

  const segments = pathname.split("/").filter(Boolean).filter((s) => s !== "admin");
  const crumbs = [home];
  let path = pathname.startsWith("/admin") ? "/admin" : "";
  for (const segment of segments) {
    path += `/${segment}`;
    const label = segment === id ? (assignment.data?.title ?? "Detail") : sectionLabel(segment);
    if (label) crumbs.push({ label, to: path });
  }
  return crumbs;
}

/** Glass header bar of the lab website: page title + trail, deadline pill, bell, user chip. */
export function Topbar() {
  const user = useCurrentUser();
  const crumbs = useCrumbs();
  const current = crumbs[crumbs.length - 1];

  return (
    <header className="sticky top-0 z-20 px-3 pt-3 md:px-4 md:pt-4">
      <div className="glass relative flex h-[4.5rem] items-center gap-3 overflow-hidden rounded-2xl px-3 md:px-5">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20" aria-hidden />
        <SidebarTrigger
          className="size-10 shrink-0 rounded-xl border border-border bg-white/60 hover:bg-white/90 dark:bg-white/5 dark:hover:bg-white/10"
          aria-label="Buka/tutup sidebar"
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold tracking-tight md:text-xl">{current?.label}</p>
          {crumbs.length > 1 ? (
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList className="text-xs">
                {crumbs.slice(0, -1).map((crumb, index) => (
                  <Fragment key={crumb.to}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to={crumb.to}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </Fragment>
                ))}
                <BreadcrumbSeparator />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate text-xs">{current?.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          ) : (
            <p className="hidden truncate text-xs font-medium text-muted-foreground sm:block">
              {user.research_division ? `Divisi ${user.research_division.name}` : "Laboratorium APTRG"}
            </p>
          )}
        </div>

        {user.role !== "admin" && <DeadlineStrip className="mx-auto hidden max-w-xl flex-1 xl:flex" />}

        <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
          <NotificationBell />
          <Link
            to="/profile"
            aria-label="Profil"
            className="flex items-center gap-2.5 rounded-full border border-border bg-white/70 p-1 outline-none transition-colors hover:bg-white focus-visible:ring-[3px] focus-visible:ring-ring/50 md:py-1.5 md:pr-4 md:pl-1.5 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <UserAvatar name={user.name} className="size-8" />
            <span className="hidden max-w-40 flex-col leading-tight md:flex">
              <span className="truncate text-[13px] font-semibold">{user.name}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{ROLE_LABEL[user.role]}</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
