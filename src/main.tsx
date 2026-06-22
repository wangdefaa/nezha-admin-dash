import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { AuthProvider } from "@/store/auth"
import { AppLayout } from "@/components/layout/app-layout"
import { Toaster } from "@/components/ui/sonner"
import "./index.css"

import LoginPage from "@/pages/login"
import ServersPage from "@/pages/servers"
import ServerGroupsPage from "@/pages/server-groups"
import ServicesPage from "@/pages/services"
import AlertRulesPage from "@/pages/alert-rules"
import NotificationsPage from "@/pages/notifications"
import NotificationGroupsPage from "@/pages/notification-groups"
import UsersPage from "@/pages/users"
import OnlineUsersPage from "@/pages/online-users"
import WafPage from "@/pages/waf"
import ApiTokensPage from "@/pages/api-tokens"
import SettingsPage from "@/pages/settings"
import ProfilePage from "@/pages/profile"
import ThemesPage from "@/pages/themes"
import NotFoundPage from "@/pages/not-found"

const router = createBrowserRouter(
  [
    { path: "/login", element: <LoginPage /> },
    {
      path: "/",
      element: <AppLayout />,
      children: [
        { index: true, element: <ServersPage /> },
        { path: "server-group", element: <ServerGroupsPage /> },
        { path: "service", element: <ServicesPage /> },
        { path: "alert-rule", element: <AlertRulesPage /> },
        { path: "notification", element: <NotificationsPage /> },
        { path: "notification-group", element: <NotificationGroupsPage /> },
        { path: "profile", element: <ProfilePage /> },
        { path: "settings", element: <SettingsPage /> },
        { path: "settings/user", element: <UsersPage /> },
        { path: "settings/online-user", element: <OnlineUsersPage /> },
        { path: "settings/waf", element: <WafPage /> },
        { path: "settings/api-tokens", element: <ApiTokensPage /> },
        { path: "settings/theme", element: <ThemesPage /> },
        { path: "*", element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: "/dashboard" },
)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <TooltipPrimitive.Provider delayDuration={200}>
        <RouterProvider router={router} />
        <Toaster />
      </TooltipPrimitive.Provider>
    </AuthProvider>
  </StrictMode>,
)
