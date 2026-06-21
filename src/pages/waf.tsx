import { useState } from "react"
import useSWR from "swr"
import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { PageHeader, TableCard } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { wafApi } from "@/api/resources"
import { WAF_REASONS } from "@/lib/constants"
import { toast } from "@/components/ui/sonner"
import { formatTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { WAF_REASON, type WAFItem } from "@/types"

// 严重原因（暴破）标红，认证类失败标黄，手动中性
const SEVERE = new Set<number>([WAF_REASON.BRUTE_FORCE_TOKEN, WAF_REASON.BRUTE_FORCE_OAUTH2])
const WARN = new Set<number>([WAF_REASON.LOGIN_FAIL, WAF_REASON.AGENT_AUTH_FAIL])

function ReasonChip({ reason }: { reason?: number }) {
  const label = WAF_REASONS[reason ?? 0] ?? "未知"
  const dot =
    reason && SEVERE.has(reason) ? "dot-offline" : reason && WARN.has(reason) ? "dot-warn" : null
  return (
    <span className="chip">
      {dot && <span className={cn("dot", dot)} />}
      {label}
    </span>
  )
}

export default function WafPage() {
  const { data, isLoading, mutate } = useSWR("/waf", () => wafApi.list())
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<{ ips: string[] } | null>(null)

  const rows = (data ?? []).filter((w): w is WAFItem & { ip: string } => !!w.ip)
  const allChecked = rows.length > 0 && rows.every((w) => sel.has(w.ip))
  const someChecked = rows.some((w) => sel.has(w.ip))

  const toggleAll = () =>
    setSel((prev) => {
      const next = new Set(prev)
      if (allChecked) rows.forEach((w) => next.delete(w.ip))
      else rows.forEach((w) => next.add(w.ip))
      return next
    })
  const toggleOne = (ip: string) =>
    setSel((prev) => {
      const next = new Set(prev)
      next.has(ip) ? next.delete(ip) : next.add(ip)
      return next
    })

  const selIps = [...sel]
  const doUnblock = async (ips: string[]) => {
    await wafApi.batchUnblock(ips)
    toast.success(`已解封 ${ips.length} 个 IP`)
    setSel((prev) => {
      const next = new Set(prev)
      ips.forEach((ip) => next.delete(ip))
      return next
    })
    mutate()
  }

  return (
    <>
      <PageHeader
        title="WAF 防火墙"
        desc="应用层防火墙拦截记录 · 可解除指定 IP 的封禁"
        actions={
          selIps.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setConfirm({ ips: selIps })}>
              <ShieldX className="ic-sm" /> 批量解封（{selIps.length}）
            </Button>
          )
        }
      />

      <TableCard
        footer={
          <span>
            当前封禁 <b className="text-fg">{rows.length}</b> 个 IP
          </span>
        }
      >
        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-meta">加载中…</div>
        ) : rows.length === 0 ? (
          <EmptyState title="暂无封禁记录" desc="WAF 尚未拦截任何异常 IP。" />
        ) : (
          <table className="tbl" style={{ minWidth: 780 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <Checkbox
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th>IP</th>
                <th>封禁原因</th>
                <th>封禁时间</th>
                <th>累计次数</th>
                <th style={{ width: 88 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => {
                const high = (w.count ?? 0) >= 10
                return (
                  <tr key={w.ip} className={cn(sel.has(w.ip) && "selected")}>
                    <td>
                      <Checkbox checked={sel.has(w.ip)} onCheckedChange={() => toggleOne(w.ip)} />
                    </td>
                    <td className="mono text-[12.5px] text-fg-2">{w.ip}</td>
                    <td>
                      <ReasonChip reason={w.block_reason} />
                    </td>
                    <td className="text-fg-2">{formatTime(w.block_timestamp)}</td>
                    <td className={cn("mono text-[12.5px]", high ? "val-danger" : "text-fg-2")}>
                      {w.count ?? 0}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setConfirm({ ips: [w.ip] })}
                      >
                        解封
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </TableCard>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="解除封禁"
        desc={
          confirm?.ips.length === 1
            ? `确定解封 IP「${confirm.ips[0]}」？该地址将可重新访问。`
            : `确定解封选中的 ${confirm?.ips.length ?? 0} 个 IP？这些地址将可重新访问。`
        }
        confirmText="解封"
        onConfirm={async () => {
          if (confirm) await doUnblock(confirm.ips)
        }}
      />
    </>
  )
}
