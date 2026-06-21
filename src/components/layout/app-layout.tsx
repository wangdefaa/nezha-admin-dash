import { useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { useAuth } from "@/store/auth"

export function AppLayout() {
  const { profile, loading, error } = useAuth()
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("nz-collapsed") === "1")

  const toggle = () => {
    setCollapsed((c) => {
      localStorage.setItem("nz-collapsed", c ? "0" : "1")
      return !c
    })
  }

  if (loading)
    return (
      <div className="grid h-screen place-items-center text-[13px] text-muted">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-accent" />
          加载中…
        </div>
      </div>
    )
  if (error || !profile) return <Navigate to="/login" replace />

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="scroll-y flex-1">
          <div className="mx-auto max-w-[1400px] px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
