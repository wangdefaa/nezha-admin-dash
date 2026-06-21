import { useState } from "react"
import useSWR from "swr"
import { Ban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { PageHeader, TableCard } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { onlineUsersApi } from "@/api/resources"
import { toast } from "@/components/ui/sonner"
import { formatTime, timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { OnlineUser } from "@/types"

// 用 ip 作为选择标识（封禁以 IP 为单位）
export default function OnlineUsersPage() {
  const { data, isLoading, mutate } = useSWR("/online-user", () => onlineUsersApi.list())
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState(false)

  const rows = (data ?? []).filter((u): u is OnlineUser & { ip: string } => !!u.ip)
  const allChecked = rows.length > 0 && rows.every((u) => sel.has(u.ip))
  const someChecked = rows.some((u) => sel.has(u.ip))

  const toggleAll = () =>
    setSel((prev) => {
      const next = new Set(prev)
      if (allChecked) rows.forEach((u) => next.delete(u.ip))
      else rows.forEach((u) => next.add(u.ip))
      return next
    })
  const toggleOne = (ip: string) =>
    setSel((prev) => {
      const next = new Set(prev)
      next.has(ip) ? next.delete(ip) : next.add(ip)
      return next
    })

  const selIps = [...sel]
  const doBlock = async () => {
    await onlineUsersApi.batchBlock(selIps)
    toast.success(`已封禁 ${selIps.length} 个 IP`)
    setSel(new Set())
    mutate()
  }

  return (
    <>
      <PageHeader
        title="在线用户"
        desc="当前已建立会话的登录用户 · 可按 IP 封禁"
        actions={
          selIps.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-danger"
              onClick={() => setConfirm(true)}
            >
              <Ban className="ic-sm" /> 批量封禁所选 IP（{selIps.length}）
            </Button>
          )
        }
      />

      <TableCard
        footer={
          <span>
            共 <b className="text-fg">{rows.length}</b> 个在线会话
          </span>
        }
      >
        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-meta">加载中…</div>
        ) : rows.length === 0 ? (
          <EmptyState title="当前无在线会话" desc="暂时没有用户保持登录连接。" />
        ) : (
          <table className="tbl" style={{ minWidth: 720 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <Checkbox
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th>用户 ID</th>
                <th>登录 IP</th>
                <th>连接时间</th>
                <th>在线时长</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.ip} className={cn(sel.has(u.ip) && "selected")}>
                  <td>
                    <Checkbox checked={sel.has(u.ip)} onCheckedChange={() => toggleOne(u.ip)} />
                  </td>
                  <td className="font-medium text-fg">#{u.user_id ?? "—"}</td>
                  <td className="mono text-[12.5px] text-fg-2">{u.ip}</td>
                  <td className="text-fg-2">{formatTime(u.connected_at)}</td>
                  <td className="text-meta">{timeAgo(u.connected_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="封禁所选 IP"
        desc={`确定封禁选中的 ${selIps.length} 个 IP？这些地址将被加入 WAF 黑名单。`}
        destructive
        confirmText="封禁"
        onConfirm={doBlock}
      />
    </>
  )
}
