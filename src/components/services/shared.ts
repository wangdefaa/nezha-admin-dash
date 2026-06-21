import type { ServiceResponseItem } from "@/types"

// 可用率 %：total_up / (total_up + total_down) * 100；无样本返回 null。
export function availability(s?: ServiceResponseItem): number | null {
  if (!s) return null
  const total = (s.total_up ?? 0) + (s.total_down ?? 0)
  if (total <= 0) return null
  return (s.total_up / total) * 100
}

// 平均延迟：delay 数组里非零值平均；无数据返回 null。
export function avgDelay(delay?: number[]): number | null {
  const v = (delay ?? []).filter((d) => d > 0)
  if (v.length === 0) return null
  return v.reduce((a, b) => a + b, 0) / v.length
}

// 可用率越低越危险：<95 红、95–99 琥珀、≥99 绿。
export function availDot(p: number | null): "online" | "warn" | "offline" {
  if (p == null || p < 95) return "offline"
  if (p < 99) return "warn"
  return "online"
}
export function barClass(p: number | null): string {
  if (p == null || p < 95) return "danger"
  if (p < 99) return "warn"
  return ""
}
export function valClass(p: number | null): string {
  if (p == null) return ""
  if (p < 95) return "val-danger"
  if (p < 99) return "val-warn"
  return ""
}
