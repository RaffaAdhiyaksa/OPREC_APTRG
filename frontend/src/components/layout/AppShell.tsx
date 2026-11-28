import { Outlet } from "react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppBackground } from "@/components/layout/AppBackground";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Topbar } from "@/components/layout/Topbar";

export function AppShell() {
  return (
    <SidebarProvider style={{ "--sidebar-width": "17rem" } as React.CSSProperties}>
      <AppBackground />
      <AppSidebar />
      <SidebarInset className="relative z-10 min-w-0 bg-transparent">
        <Topbar />
        {/* SidebarInset already renders the <main> landmark. */}
        <div id="content" className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 pt-6 pb-14 md:px-6 lg:px-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
