// 展示格式化工具：字节、速率、百分比、时长、相对时间、国旗。
import { serverNow } from "./clock"

export function bytes(n?: number): string {
  if (!n || n <= 0) return "0 B"
  const u = ["B", "KB", "MB", "GB", "TB", "PB"]
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), u.length - 1)
  const v = n / Math.pow(1024, i)
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${u[i]}`
}

export function speed(n?: number): string {
  return `${bytes(n)}/s`
}

export function percent(used?: number, total?: number): number {
  if (!used || !total || total <= 0) return 0
  return Math.min(100, Math.round((used / total) * 100))
}

export function pct(n?: number, digits = 0): string {
  return `${(n ?? 0).toFixed(digits)}%`
}

// uptime 秒 → "12d 4h" / "4h 12m" / "12m"
export function uptime(sec?: number): string {
  if (!sec || sec <= 0) return "—"
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// 是否在线：last_active 在 N 秒内
export function isOnline(lastActive?: string, withinSec = 12): boolean {
  if (!lastActive) return false
  const t = new Date(lastActive).getTime()
  if (Number.isNaN(t) || t <= 0) return false
  return serverNow() - t < withinSec * 1000
}

export function formatTime(s?: string | number | null): string {
  if (!s) return "—"
  const d = typeof s === "number" ? new Date(s * 1000) : new Date(s)
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 2000) return "—"
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function timeAgo(s?: string | number | null): string {
  if (!s) return "—"
  const d = typeof s === "number" ? new Date(s * 1000) : new Date(s)
  const diff = serverNow() - d.getTime()
  if (Number.isNaN(diff)) return "—"
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return "刚刚"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} 分钟前`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} 小时前`
  const day = Math.floor(h / 24)
  if (day < 30) return `${day} 天前`
  return formatTime(s)
}

// 两字母国家码 → emoji 国旗
export function flag(code?: string): string {
  if (!code || code.length !== 2) return "🏳"
  const cc = code.toUpperCase()
  if (cc === "TW") return "🏳"
  const A = 0x1f1e6
  return String.fromCodePoint(A + cc.charCodeAt(0) - 65, A + cc.charCodeAt(1) - 65)
}

export function maskSecret(s?: string): string {
  if (!s) return "••••••••"
  const tail = s.slice(-4)
  return `${s.slice(0, 3)}${"•".repeat(8)}${tail}`
}
