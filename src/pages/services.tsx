import { useMemo, useState } from "react"
import useSWR from "swr"
import { Eye, MoreHorizontal, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { SearchInput } from "@/components/common/search-input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge, Dot } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader, TableCard } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Sparkline } from "@/components/common/sparkline"
import { ServiceEditSheet } from "@/components/services/service-edit-sheet"
import { ServiceDetailDialog } from "@/components/services/service-detail-dialog"
import { availability, availDot, avgDelay, barClass, valClass } from "@/components/services/shared"
import { swrFetcher } from "@/lib/api"
import { servicesApi } from "@/api/resources"
import { toast } from "@/components/ui/sonner"
import { SERVICE_TYPES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Service, ServiceResponse } from "@/types"

const TYPE_LABEL: Record<number, string> = Object.fromEntries(
  SERVICE_TYPES.map((t) => [t.value, t.label]),
)

function coverCount(s: Service) {
  return Object.values(s.skip_servers ?? {}).filter(Boolean).length
}

export default function ServicesPage() {
  const {
    data: list,
    isLoading,
    mutate,
  } = useSWR<Service[]>("/service/list", swrFetcher, { refreshInterval: 10000 })
  const { data: resp, mutate: mutateStats } = useSWR<ServiceResponse>("/service", swrFetcher, {
    refreshInterval: 10000,
  })
  const stats = resp?.services ?? {}

  const [q, setQ] = useState("")
  const [type, setType] = useState("all")
  const [edit, setEdit] = useState<{ service: Service | null } | null>(null)
  const [detail, setDetail] = useState<Service | null>(null)
  const [confirm, setConfirm] = useState<Service | null>(null)

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    return (list ?? []).filter((s) => {
      if (type !== "all" && String(s.type) !== type) return false
      if (!k) return true
      return s.name.toLowerCase().includes(k) || s.target.toLowerCase().includes(k)
    })
  }, [list, q, type])

  const refresh = () => {
    mutate()
    mutateStats()
  }
  const doDelete = async (s: Service) => {
    await servicesApi.batchDelete([s.id])
    toast.success("已删除监控")
    refresh()
  }

  return (
    <>
      <PageHeader
        title="服务拨测"
        desc="HTTP / TCP / Ping 可用性监控 · 延迟趋势与告警"
        actions={
          <Button variant="primary" size="sm" onClick={() => setEdit({ service: null })}>
            <Plus className="ic-sm" /> 添加监控
          </Button>
        }
      />

      <TableCard
        toolbar={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="按名称 / 目标搜索" />
            <Select value={type} onChange={(e) => setType(e.target.value)} className="w-32">
              <option value="all">全部类型</option>
              {SERVICE_TYPES.map((t) => (
                <option key={t.value} value={String(t.value)}>
                  {t.label}
                </option>
              ))}
            </Select>
            <div className="ml-auto">
              <Button variant="ghost" size="icon-sm" onClick={refresh} title="刷新">
                <RefreshCw className="ic-sm" />
              </Button>
            </div>
          </>
        }
        footer={
          <span>
            共 <b className="text-fg">{list?.length ?? 0}</b> 个监控任务
          </span>
        }
      >
        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-meta">加载中…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="暂无监控任务"
            desc="点击右上角「添加监控」创建 HTTP / TCP / Ping 拨测。"
          />
        ) : (
          <table className="tbl" style={{ minWidth: 1080 }}>
            <thead>
              <tr>
                <th style={{ width: 44 }}>状态</th>
                <th>名称</th>
                <th>类型</th>
                <th>目标</th>
                <th style={{ width: 160 }}>可用率</th>
                <th style={{ width: 180 }}>平均延迟</th>
                <th>覆盖</th>
                <th>通知</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const it = stats[s.id]
                const avail = availability(it)
                const delay = avgDelay(it?.delay)
                const cc = coverCount(s)
                return (
                  <tr key={s.id}>
                    <td>
                      <Dot status={availDot(avail)} />
                    </td>
                    <td>
                      <button
                        className="nm text-left font-medium text-fg hover:text-accent"
                        onClick={() => setDetail(s)}
                      >
                        {s.name}
                      </button>
                    </td>
                    <td>
                      <Badge>{TYPE_LABEL[s.type] ?? "—"}</Badge>
                    </td>
                    <td>
                      <span
                        className="mono inline-block max-w-[240px] truncate align-middle text-[12.5px] text-fg-2"
                        title={s.target}
                      >
                        {s.target}
                      </span>
                    </td>
                    <td>
                      {avail == null ? (
                        <span className="text-meta">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={cn("mono w-12 shrink-0 text-[12.5px]", valClass(avail))}>
                            {avail.toFixed(1)}%
                          </span>
                          <span className={cn("bar w-16", barClass(avail))}>
                            <span style={{ width: `${avail}%` }} />
                          </span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="mono w-16 shrink-0 text-[12.5px] text-fg-2">
                          {delay == null ? "—" : `${delay.toFixed(1)} ms`}
                        </span>
                        <Sparkline data={it?.delay ?? []} width={90} height={24} />
                      </div>
                    </td>
                    <td>
                      <span className="text-[12.5px] text-fg-2">
                        {s.cover === 1 ? `仅 ${cc} 台` : cc > 0 ? `排除 ${cc} 台` : "全部"}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <Dot status={s.notify ? "online" : "offline"} />
                        <span className={cn("text-[12.5px]", s.notify ? "text-fg-2" : "text-meta")}>
                          {s.notify ? "开" : "关"}
                        </span>
                      </span>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="btn btn-ghost btn-icon btn-sm">
                            <MoreHorizontal className="ic-sm" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => setDetail(s)}>
                            <Eye className="ic-sm" /> 查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setEdit({ service: s })}>
                            <Pencil className="ic-sm" /> 编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem danger onSelect={() => setConfirm(s)}>
                            <Trash2 className="ic-sm" /> 删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </TableCard>

      <ServiceEditSheet
        service={edit?.service ?? null}
        open={!!edit}
        onClose={() => setEdit(null)}
        onSaved={refresh}
      />
      <ServiceDetailDialog
        service={detail}
        stats={detail ? stats[detail.id] : undefined}
        open={!!detail}
        onOpenChange={(o) => !o && setDetail(null)}
      />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="删除监控"
        desc={`确定删除监控「${confirm?.name ?? ""}」？此操作不可恢复。`}
        destructive
        confirmText="删除"
        onConfirm={async () => {
          if (confirm) await doDelete(confirm)
        }}
      />
    </>
  )
}
