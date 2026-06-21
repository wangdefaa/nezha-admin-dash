import { useLocation, useNavigate } from "react-router-dom"
import { LogOut, Moon, Sun, User as UserIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NAV, titleForPath } from "@/lib/nav"
import { useTheme } from "@/store/theme"
import { useAuth } from "@/store/auth"

export function Topbar() {
  const loc = useLocation()
  const nav = useNavigate()
  const { theme, toggle } = useTheme()
  const { profile, isAdmin, logout } = useAuth()

  const title = titleForPath(loc.pathname)
  const group =
    NAV.find((n) => n.path === loc.pathname)?.group ??
    (loc.pathname === "/profile" ? "账户" : "监控")

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-border bg-surface px-5">
      <div className="flex items-center gap-1.5 text-[13px]">
        <span className="text-muted">{group}</span>
        <span className="text-meta">/</span>
        <span className="font-medium text-fg">{title}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button className="btn btn-ghost btn-icon btn-sm" onClick={toggle} title="切换主题">
          {theme === "dark" ? <Sun className="ic-sm" /> : <Moon className="ic-sm" />}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="btn btn-ghost btn-sm gap-2 pl-1.5">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-subtle text-[11px] font-semibold uppercase text-accent">
                {profile?.username?.[0] ?? "?"}
              </span>
              <span className="hidden text-fg-2 sm:inline">{profile?.username ?? "账户"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{isAdmin ? "管理员" : "普通成员"}</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => nav("/profile")}>
              <UserIcon className="ic-sm" /> 个人资料
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem danger onSelect={() => logout()}>
              <LogOut className="ic-sm" /> 退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
