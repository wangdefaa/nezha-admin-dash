import { useState } from "react"
import useSWR from "swr"
import { KeyRound, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader, TableCard } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { CreateTokenDialog } from "@/components/api-tokens/create-token-dialog"
import { swrFetcher } from "@/lib/api"
import { tokensApi } from "@/api/resources"
import { toast } from "@/components/ui/sonner"
import { formatTime } from "@/lib/format"
import type { APITokenView, Server } from "@/types"

function ScopeChips({ scopes }: { scopes: string[] }) {
  const shown = scopes.slice(0, 3)
  const rest = scopes.length - shown.length
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((s) => (
        <Chip key={s} className="mono">
          {s}
        </Chip>
      ))}
      {rest > 0 && <Chip variant="more">+{rest}</Chip>}
    </div>
  )
}

export default function ApiTokensPage() {
  const { data: tokens, isLoading, mutate } = useSWR<APITokenView[]>("/api-tokens", swrFetcher)
  const { data: servers } = useSWR<Server[]>("/server", swrFetcher)

  const [addOpen, setAddOpen] = useState(false)
  const [confirm, setConfirm] = useState<APITokenView | null>(null)

  const doDelete = async (id: number) => {
    await tokensApi.delete(id)
    toast.success("已删除令牌")
    mutate()
  }

  return (
    <>
      <PageHeader
        title="API 令牌"
        desc="管理个人访问令牌（PAT），用于通过 API 操作面板资源"
        actions={
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="ic-sm" /> 新建令牌
          </Button>
        }
      />

      <TableCard
        footer={
          <span>
            共 <b className="text-fg">{tokens?.length ?? 0}</b> 个令牌
          </span>
        }
      >
        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-meta">加载中…</div>
        ) : (tokens?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<KeyRound className="ic-lg" />}
            title="暂无 API 令牌"
            desc="点击右上角「新建令牌」创建一个个人访问令牌。"
          />
        ) : (
          <table className="tbl" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>名称</th>
                <th>权限范围</th>
                <th>服务器白名单</th>
                <th>过期时间</th>
                <th>最后使用</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {tokens!.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium text-fg">{t.name}</td>
                  <td>
                    <ScopeChips scopes={t.scopes} />
                  </td>
                  <td className="text-fg-2">
                    {!t.server_ids || t.server_ids.length === 0
                      ? "全部"
                      : `指定 ${t.server_ids.length} 台`}
                  </td>
                  <td className="text-fg-2">
                    {t.expires_at == null ? "永不" : formatTime(t.expires_at)}
                  </td>
                  <td>
                    {t.last_used_at ? (
                      <div>
                        <div className="mono text-[12.5px] text-fg-2">
                          {formatTime(t.last_used_at)}
                        </div>
                        {t.last_used_ip && (
                          <div className="mono text-[11px] text-meta">{t.last_used_ip}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-meta">从未</span>
                    )}
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="btn btn-ghost btn-icon btn-sm">
                          <MoreHorizontal className="ic-sm" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem danger onSelect={() => setConfirm(t)}>
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

      <CreateTokenDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        servers={servers ?? []}
        onCreated={() => mutate()}
      />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="删除 API 令牌"
        desc={`确定删除令牌「${confirm?.name}」？使用该令牌的请求将立即失效，此操作不可恢复。`}
        destructive
        confirmText="删除"
        onConfirm={async () => {
          if (confirm) await doDelete(confirm.id)
        }}
      />
    </>
  )
}
