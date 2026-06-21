import { useMemo, useState } from "react"
import useSWR from "swr"
import { MoreHorizontal, Plus, RefreshCw, Trash2, Pencil, Bell } from "lucide-react"
import { SearchInput } from "@/components/common/search-input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader, TableCard } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { NotificationEditSheet } from "@/components/notifications/notification-edit-sheet"
import { swrFetcher } from "@/lib/api"
import { notificationsApi } from "@/api/resources"
import { toast } from "@/components/ui/sonner"
import { NOTIFICATION_METHODS, NOTIFICATION_TYPES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Notification } from "@/types"

const labelOf = (list: { value: number; label: string }[], v: number) =>
  list.find((x) => x.value === v)?.label ?? "—"

export default function NotificationsPage() {
  const { data, isLoading, mutate } = useSWR<Notification[]>("/notification", swrFetcher)

  const [q, setQ] = useState("")
  const [edit, setEdit] = useState<Notification | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirm, setConfirm] = useState<Notification | null>(null)

  const filtered = useMemo(() => {
    const list = data ?? []
    const k = q.trim().toLowerCase()
    if (!k) return list
    return list.filter((n) => n.name.toLowerCase().includes(k) || n.url.toLowerCase().includes(k))
  }, [data, q])

  const openAdd = () => {
    setEdit(null)
    setSheetOpen(true)
  }
  const openEdit = (n: Notification) => {
    setEdit(n)
    setSheetOpen(true)
  }
  const doDelete = async (n: Notification) => {
    await notificationsApi.batchDelete([n.id])
    toast.success("已删除通知方式")
    mutate()
  }

  return (
    <>
      <PageHeader
        title="通知方式"
        desc="配置 Webhook 通知渠道 · 触发告警时按所选方式推送"
        actions={
          <Button variant="primary" size="sm" onClick={openAdd}>
            <Plus className="ic-sm" /> 添加通知
          </Button>
        }
      />

      <TableCard
        toolbar={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="按名称 / URL 搜索" />
            <div className="ml-auto">
              <Button variant="ghost" size="icon-sm" onClick={() => mutate()} title="刷新">
                <RefreshCw className="ic-sm" />
              </Button>
            </div>
          </>
        }
        footer={
          <span>
            共 <b className="text-fg">{data?.length ?? 0}</b> 个通知方式
          </span>
        }
      >
        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-meta">加载中…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Bell className="ic-lg" />}
            title="暂无通知方式"
            desc="点击右上角「添加通知」配置一个 Webhook 推送渠道。"
          />
        ) : (
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th>名称</th>
                <th>URL</th>
                <th>请求方式</th>
                <th>请求类型</th>
                <th>TLS 校验</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr key={n.id}>
                  <td>
                    <div className="nm font-medium text-fg">{n.name}</div>
                  </td>
                  <td>
                    <span
                      className="mono block max-w-[280px] truncate text-[12.5px] text-fg-2"
                      title={n.url}
                    >
                      {n.url}
                    </span>
                  </td>
                  <td>
                    <Badge>{labelOf(NOTIFICATION_METHODS, n.request_method)}</Badge>
                  </td>
                  <td>
                    <Badge soft>{labelOf(NOTIFICATION_TYPES, n.request_type)}</Badge>
                  </td>
                  <td>
                    <span
                      className={cn("text-[12.5px]", n.verify_tls ? "text-success" : "text-meta")}
                    >
                      {n.verify_tls ? "开" : "关"}
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
                        <DropdownMenuItem onSelect={() => openEdit(n)}>
                          <Pencil className="ic-sm" /> 编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem danger onSelect={() => setConfirm(n)}>
                          <Trash2 className="ic-sm" /> 删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      <NotificationEditSheet
        open={sheetOpen}
        target={edit}
        onOpenChange={setSheetOpen}
        onSaved={() => mutate()}
      />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="删除通知方式"
        desc={`确定删除「${confirm?.name ?? ""}」？此操作不可恢复。`}
        destructive
        confirmText="删除"
        onConfirm={async () => {
          if (confirm) await doDelete(confirm)
        }}
      />
    </>
  )
}
