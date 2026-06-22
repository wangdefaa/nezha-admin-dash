import {
  Activity,
  BellRing,
  Boxes,
  KeyRound,
  Palette,
  Send,
  Server,
  Settings,
  ShieldAlert,
  UsersRound,
  Wifi,
} from "lucide-react"
import type { ComponentType } from "react"

export interface NavItem {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
  group: string
  adminOnly?: boolean
}

// 路由与后端 controller.go 的 frontendPageUrlRegistry 对齐，避免硬刷新 404。
export const NAV: NavItem[] = [
  { label: "服务器", path: "/", icon: Server, group: "监控" },
  { label: "服务器分组", path: "/server-group", icon: Boxes, group: "监控" },
  { label: "服务拨测", path: "/service", icon: Activity, group: "监控" },

  { label: "告警规则", path: "/alert-rule", icon: BellRing, group: "告警" },
  { label: "通知方式", path: "/notification", icon: Send, group: "告警" },
  { label: "通知组", path: "/notification-group", icon: Boxes, group: "告警" },

  { label: "用户", path: "/settings/user", icon: UsersRound, group: "系统", adminOnly: true },
  { label: "在线用户", path: "/settings/online-user", icon: Wifi, group: "系统", adminOnly: true },
  { label: "WAF 防火墙", path: "/settings/waf", icon: ShieldAlert, group: "系统", adminOnly: true },
  { label: "API 令牌", path: "/settings/api-tokens", icon: KeyRound, group: "系统" },
  { label: "主题管理", path: "/settings/theme", icon: Palette, group: "系统", adminOnly: true },
  { label: "系统设置", path: "/settings", icon: Settings, group: "系统", adminOnly: true },
]

export const NAV_GROUPS = ["监控", "告警", "系统"]

export function titleForPath(path: string): string {
  if (path === "/profile") return "个人资料"
  const found = NAV.find((n) => n.path === path)
  return found?.label ?? "服务器"
}
