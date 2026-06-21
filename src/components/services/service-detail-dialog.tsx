import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sparkline } from "@/components/common/sparkline"
import { EmptyState } from "@/components/common/empty-state"
import { Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { availability, avgDelay, valClass } from "./shared"
import type { Service, ServiceResponseItem } from "@/types"

function Stat({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="card-soft px-3.5 py-3">
      <div className="text-[11px] uppercase tracking-[.03em] text-meta">{label}</div>
      <div className={cn("mono mt-1 text-[20px] font-semibold text-fg", cls)}>{value}</div>
    </div>
  )
}

// 近 N 次上/下线：每次取该窗口内 down>0 → 红，否则绿。
function Bars({ up, down }: { up?: number[]; down?: number[] }) {
  const len = Math.max(up?.length ?? 0, down?.length ?? 0)
  if (len === 0) return <EmptyState title="暂无检测记录" desc="该服务尚未产生上/下线历史数据。" />
  const slice = Array.from({ length: Math.min(len, 30) }, (_, i) => {
    const idx = len - Math.min(len, 30) + i
    return (down?.[idx] ?? 0) > 0 ? "down" : "up"
  })
  return (
    <div className="flex h-10 items-end gap-[3px]">
      {slice.map((s, i) => (
        <span
          key={i}
          title={s === "down" ? "下线" : "在线"}
          className="min-w-[4px] flex-1 rounded-[2px]"
          style={{
            height: s === "down" ? "60%" : "100%",
            background: s === "down" ? "var(--danger)" : "var(--success)",
          }}
        />
      ))}
    </div>
  )
}

export function ServiceDetailDialog({
  service,
  stats,
  open,
  onOpenChange,
}: {
  service: Service | null
  stats?: ServiceResponseItem
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const avail = availability(stats)
  const delay = avgDelay(stats?.delay)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide" flexcol>
        <DialogHeader>
          <DialogTitle>{service?.name ?? "拨测详情"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto px-5 pb-5">
          <div className="grid grid-cols-4 gap-3">
            <Stat label="当前在线" value={String(stats?.current_up ?? 0)} cls="text-success" />
            <Stat
              label="总检测"
              value={String((stats?.total_up ?? 0) + (stats?.total_down ?? 0))}
            />
            <Stat
              label="可用率"
              value={avail == null ? "—" : `${avail.toFixed(2)}%`}
              cls={avail == null ? undefined : valClass(avail)}
            />
            <Stat label="平均延迟" value={delay == null ? "—" : `${delay.toFixed(1)} ms`} />
          </div>

          <div className="card-soft px-4 py-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-[12px] text-meta">
              <Activity className="ic-sm" /> 延迟趋势 <span className="mono">(ms)</span>
            </div>
            {stats?.delay && stats.delay.filter((d) => d > 0).length >= 2 ? (
              <Sparkline data={stats.delay} width={760} height={120} className="w-full" />
            ) : (
              <div className="py-10 text-center text-[12.5px] text-meta">暂无延迟数据</div>
            )}
          </div>

          <div className="card-soft px-4 py-3.5">
            <div className="mb-2.5 text-[12px] text-meta">
              近 30 次检测 <span className="text-meta">· 绿=在线 / 红=下线</span>
            </div>
            <Bars up={stats?.up} down={stats?.down} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
