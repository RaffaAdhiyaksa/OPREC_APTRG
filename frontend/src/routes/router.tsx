import { createBrowserRouter } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";
import DivisionsPage from "@/pages/admin/DivisionsPage";
import UsersPage from "@/pages/admin/UsersPage";
import AssignmentDetailPage from "@/pages/assignments/AssignmentDetailPage";
import AssignmentsPage from "@/pages/assignments/AssignmentsPage";
import ChangePasswordPage from "@/pages/auth/ChangePasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import MaterialsPage from "@/pages/materials/MaterialsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProfilePage from "@/pages/ProfilePage";
import { GuestOnly, RequireAuth, RequirePasswordChanged, RequireRole } from "@/routes/guards";

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      // Reachable while must_change_password is true; everything below is not.
      { path: "/change-password", element: <ChangePasswordPage /> },
      {
        element: <RequirePasswordChanged />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: "/", element: <DashboardPage /> },
              { path: "/materials", element: <MaterialsPage /> },
              { path: "/assignments", element: <AssignmentsPage /> },
              { path: "/assignments/:id", element: <AssignmentDetailPage /> },
              { path: "/announcements", element: <PlaceholderPage title="Pengumuman" /> },
              { path: "/notifications", element: <PlaceholderPage title="Notifikasi" /> },
              { path: "/profile", element: <ProfilePage /> },
              {
                element: <RequireRole roles={["asisten_magang"]} />,
                children: [{ path: "/grades", element: <PlaceholderPage title="Nilai" /> }],
              },
              {
                element: <RequireRole roles={["admin"]} />,
                children: [
                  { path: "/admin/users", element: <UsersPage /> },
                  { path: "/admin/divisions", element: <DivisionsPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
