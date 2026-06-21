import { NavLink } from "react-router-dom"
import { Activity, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { NAV, NAV_GROUPS } from "@/lib/nav"
import { useAuth } from "@/store/auth"
import { cn } from "@/lib/utils"

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { profile, isAdmin } = useAuth()
  const items = NAV.filter((n) => !n.adminOnly || isAdmin)

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200",
        collapsed && "sidebar-collapsed",
      )}
      style={{ width: 232 }}
    >
      {/* 品牌 */}
      <div className="brand-wrap flex h-[52px] items-center gap-2.5 border-b border-border px-4">
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-accent text-accent-fg">
          <Activity className="ic-sm" />
        </div>
        <div className="hide-collapsed min-w-0">
          <div className="truncate text-[13.5px] font-semibold leading-tight text-fg">Nezha</div>
          <div className="truncate text-[11px] text-meta">管理后台</div>
        </div>
      </div>

      {/* 导航 */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {NAV_GROUPS.map((g) => {
          const groupItems = items.filter((i) => i.group === g)
          if (groupItems.length === 0) return null
          return (
            <div key={g}>
              <div className="nav-group">{g}</div>
              {groupItems.map((it) => (
                <NavLink
                  key={it.path}
                  to={it.path}
                  end
                  className={({ isActive }) => cn("nav-item", isActive && "active")}
                  title={it.label}
                >
                  <it.icon className="ic" />
                  <span className="nav-label hide-collapsed">{it.label}</span>
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>

      {/* 底部：用户 + 折叠 */}
      <div className="border-t border-border p-3">
        {collapsed ? (
          <button
            className="btn btn-ghost btn-icon btn-sm mx-auto"
            onClick={onToggle}
            title="展开侧栏"
          >
            <PanelLeftOpen className="ic-sm" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-semibold uppercase text-fg-2">
              {profile?.username?.[0] ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-fg">
                {profile?.username ?? "—"}
              </div>
              <div className="text-[11px] text-meta">{isAdmin ? "管理员" : "普通成员"}</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onToggle} title="折叠侧栏">
              <PanelLeftClose className="ic-sm" />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
