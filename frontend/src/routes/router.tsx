import { createBrowserRouter } from "react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";
import ChangePasswordPage from "@/pages/auth/ChangePasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
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
              { path: "/", element: <PlaceholderPage title="Beranda" /> },
              { path: "/materials", element: <PlaceholderPage title="Materi" /> },
              { path: "/assignments", element: <PlaceholderPage title="Tugas" /> },
              { path: "/assignments/:id", element: <PlaceholderPage title="Detail Tugas" /> },
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
                  { path: "/admin/users", element: <PlaceholderPage title="Pengguna" /> },
                  { path: "/admin/divisions", element: <PlaceholderPage title="Divisi" /> },
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
