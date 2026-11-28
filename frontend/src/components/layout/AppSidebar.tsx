import { Link, useLocation } from "react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { BrandMark } from "@/components/shared/BrandMark";
import { UserMenu } from "@/components/layout/UserMenu";
import { useCurrentUser } from "@/hooks/useAuth";
import { isNavActive, navFor } from "@/lib/navigation";

// Lab-site nav item: red tint, red left bar and red icon when active.
const ITEM = [
  "relative h-10 rounded-xl px-3.5 text-sm font-medium text-sidebar-foreground transition-all duration-300 ease-in-out",
  "hover:bg-white/60 dark:hover:bg-white/10",
  "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:[&>svg]:text-sidebar-primary",
  "before:absolute before:top-1/2 before:left-0 before:hidden before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-sidebar-primary data-[active=true]:before:block",
  "[&>svg]:size-[18px] [&>svg]:text-muted-foreground",
  "group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-[11px]!",
].join(" ");

export function AppSidebar() {
  const user = useCurrentUser();
  const { pathname } = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeOnMobile = () => isMobile && setOpenMobile(false);

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      className="p-3 [&_[data-sidebar=sidebar]]:rounded-2xl [&_[data-sidebar=sidebar]]:border-glass-border [&_[data-sidebar=sidebar]]:shadow-[var(--glass-shadow)] [&_[data-sidebar=sidebar]]:backdrop-blur-2xl"
    >
      <SidebarHeader className="px-4 pt-6 pb-4 group-data-[collapsible=icon]:px-2">
        <Link to="/" onClick={closeOnMobile} className="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <BrandMark textClassName="group-data-[collapsible=icon]:hidden" />
        </Link>
        {user.research_division && (
          <span className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary group-data-[collapsible=icon]:hidden">
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            Divisi {user.research_division.name}
          </span>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navFor(user).map((item) => (
                <SidebarMenuItem key={item.to}>
                  {item.comingSoon ? (
                    <>
                      <SidebarMenuButton aria-disabled tooltip={`${item.label} (segera)`} className={ITEM}>
                        <item.icon aria-hidden />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge className="rounded-full bg-warning px-2 text-[10px] font-semibold text-warning-foreground">Segera</SidebarMenuBadge>
                    </>
                  ) : (
                    <SidebarMenuButton asChild isActive={isNavActive(pathname, item.to)} tooltip={item.label} className={ITEM}>
                      <Link to={item.to} onClick={closeOnMobile}>
                        <item.icon aria-hidden />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <UserMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
