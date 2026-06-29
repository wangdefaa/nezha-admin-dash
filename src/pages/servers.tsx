import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  ChevronDown,
  ChevronUp,
  ClipboardCopy,
  MoreHorizontal,
  Plus,
  RefreshCw,
  RotateCw,
  Trash2,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/common/search-input"
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dot } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader, TableCard } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { ServerEditSheet } from "@/components/servers/server-edit-sheet"
import { AddServerDialog } from "@/components/servers/add-server-dialog"
import { apiGet, swrFetcher } from "@/lib/api"
import { serversApi } from "@/api/resources"
import { toast } from "@/components/ui/sonner"
import { isOnline } from "@/lib/format"
import { linuxInstallCmd } from "@/lib/install-cmd"
import { useAuth } from "@/store/auth"
import { cn, copyText } from "@/lib/utils"
import type { Server, ServerGroupResponseItem, SettingResponse } from "@/types"

type SortKey = "id" | "status" | "owner" | "name" | "group"

// 服务器表格列排序比较（升序语义；方向由调用方按 sortAsc 取反）。
function compareServers(
  a: Server,
  b: Server,
  key: SortKey,
  groupOf: Map<number, string[]>,
): number {
  switch (key) {
    case "status":
      return Number(isOnline(a.last_active)) - Number(isOnline(b.last_active))
    case "owner":
      return (a.owner?.username ?? "").localeCompare(b.owner?.username ?? "")
    case "name":
      return a.name.localeCompare(b.name)
    case "group":
      return (groupOf.get(a.id)?.[0] ?? "").localeCompare(groupOf.get(b.id)?.[0] ?? "")
    default:
      return a.id - b.id
  }
}

// 可排序表头：点击切换排序列/方向，激活列显示方向箭头。
function SortableTh({
  label,
  col,
  sortKey,
  sortAsc,
  onSort,
  width,
}: {
  label: string
  col: SortKey
  sortKey: SortKey
  sortAsc: boolean
  onSort: (k: SortKey) => void
  width?: number
}) {
  return (
    <th style={width ? { width } : undefined}>
      <button className="inline-flex items-center gap-1 hover:text-fg" onClick={() => onSort(col)}>
        {label}
        {sortKey === col &&
          (sortAsc ? <ChevronUp className="ic-sm" /> : <ChevronDown className="ic-sm" />)}
      </button>
    </th>
  )
}

export default function ServersPage() {
  const {
    data: servers,
    isLoading,
    mutate,
  } = useSWR<Server[]>("/server", swrFetcher, { refreshInterval: 4000 })
  const { data: groups } = useSWR<ServerGroupResponseItem[]>("/server-group", apiGet)
  const { data: setting } = useSWR<SettingResponse>("/setting", apiGet)
  const { profile } = useAuth()

  const [q, setQ] = useState("")
  const [group, setGroup] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("id")
  const [sortAsc, setSortAsc] = useState(true)
  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortAsc((s) => !s)
    else {
      setSortKey(key)
      setSortAsc(true)
    }
  }
  const [sel, setSel] = useState<Set<number>>(new Set())
  const [edit, setEdit] = useState<Server | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [confirm, setConfirm] = useState<{ ids: number[] } | null>(null)

  // serverId → 所属分组名（一台机器可属多个分组）
  const groupOf = useMemo(() => {
    const m = new Map<number, string[]>()
    groups?.forEach((g) =>
      g.servers?.forEach((id) => m.set(id, [...(m.get(id) ?? []), g.group.name])),
    )
    return m
  }, [groups])

  const groupServerIds = useMemo(() => {
    if (group === "all") return null
    const g = groups?.find((x) => String(x.group.id) === group)
    return new Set(g?.servers ?? [])
  }, [group, groups])

  const filtered = useMemo(() => {
    const list = servers ?? []
    const k = q.trim().toLowerCase()
    const out = list.filter((s) => {
      if (groupServerIds && !groupServerIds.has(s.id)) return false
      if (!k) return true
      const ip = s.geoip?.ip?.ipv4_addr || s.geoip?.ip?.ipv6_addr || ""
      return (
        s.name.toLowerCase().includes(k) ||
        (s.uuid ?? "").toLowerCase().includes(k) ||
        ip.toLowerCase().includes(k)
      )
    })
    return out.sort((a, b) => {
      const c = compareServers(a, b, sortKey, groupOf)
      return sortAsc ? c : -c
    })
  }, [servers, q, groupServerIds, sortAsc, sortKey, groupOf])

  const onlineCount = (servers ?? []).filter((s) => isOnline(s.last_active)).length
  const allChecked = filtered.length > 0 && filtered.every((s) => sel.has(s.id))
  const someChecked = filtered.some((s) => sel.has(s.id))

  const toggleAll = () => {
    setSel((prev) => {
      const next = new Set(prev)
      if (allChecked) filtered.forEach((s) => next.delete(s.id))
      else filtered.forEach((s) => next.add(s.id))
      return next
    })
  }
  const toggleOne = (id: number) =>
    setSel((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const selIds = [...sel]
  const forceUpdate = async (ids: number[]) => {
    try {
      await serversApi.forceUpdate(ids)
      toast.success(`已下发强制更新（${ids.length} 台）`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败")
    }
  }
  const doDelete = async (ids: number[]) => {
    await serversApi.batchDelete(ids)
    toast.success(`已删除 ${ids.length} 台服务器`)
    setSel(new Set())
    mutate()
  }
  const copyInstall = async (server: Server) => {
    const host = setting?.config?.install_host
    if (!host) return toast.error("请先在系统设置配置「安装地址」")
    const cmd = linuxInstallCmd({
      host,
      tls: !!setting?.config?.tls,
      secret: profile?.agent_secret || "",
      uuid: server.uuid,
      linuxScript: setting?.config?.install_script_linux,
    })
    const ok = await copyText(cmd)
    if (ok) toast.success(`已复制 ${server.name} 的安装命令`)
    else toast.error("复制失败，请手动复制")
  }

  return (
    <>
      <PageHeader
        title="服务器"
        desc="管理所有被监控的服务器节点 · 实时状态与资源占用"
        actions={
          <>
            {selIds.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => forceUpdate(selIds)}>
                  <RotateCw className="ic-sm" /> 强制更新
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-danger"
                  onClick={() => setConfirm({ ids: selIds })}
                >
                  <Trash2 className="ic-sm" /> 删除（{selIds.length}）
                </Button>
              </>
            )}
            <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="ic-sm" /> 添加服务器
            </Button>
          </>
        }
      />

      <TableCard
        toolbar={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="按名称 / IP / UUID 搜索" />
            <Select value={group} onChange={(e) => setGroup(e.target.value)} className="w-40">
              <option value="all">全部分组</option>
              {groups?.map((g) => (
                <option key={g.group.id} value={String(g.group.id)}>
                  {g.group.name}
                </option>
              ))}
            </Select>
            <div className="ml-auto">
              <Button variant="ghost" size="icon-sm" onClick={() => mutate()} title="刷新">
                <RefreshCw className="ic-sm" />
              </Button>
            </div>
          </>
        }
        footer={
          <span>
            共 <b className="text-fg">{servers?.length ?? 0}</b> 台 ·{" "}
            <span className="text-success">{onlineCount} 在线</span> ·{" "}
            <span className="text-meta">{(servers?.length ?? 0) - onlineCount} 离线</span>
          </span>
        }
      >
        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-meta">加载中…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="暂无服务器"
            desc="点击右上角「添加服务器」在被监控机器上安装 Agent。"
          />
        ) : (
          <table className="tbl" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <Checkbox
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <SortableTh
                  label="ID"
                  col="id"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={toggleSort}
                  width={72}
                />
                <SortableTh
                  label="状态"
                  col="status"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="归属"
                  col="owner"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="名称"
                  col="name"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={toggleSort}
                />
                <SortableTh
                  label="分组"
                  col="group"
                  sortKey={sortKey}
                  sortAsc={sortAsc}
                  onSort={toggleSort}
                />
                <th>IP</th>
                <th>版本</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const online = isOnline(s.last_active)
                const ipv4 = s.geoip?.ip?.ipv4_addr
                const ipv6 = s.geoip?.ip?.ipv6_addr
                const gnames = groupOf.get(s.id) ?? []
                return (
                  <tr
                    key={s.id}
                    className={cn(!online && "row-offline", sel.has(s.id) && "selected")}
                  >
                    <td>
                      <Checkbox checked={sel.has(s.id)} onCheckedChange={() => toggleOne(s.id)} />
                    </td>
                    <td className="mono text-[12.5px] text-meta">
                      {s.id} ({s.display_index})
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-2">
                        <Dot status={online ? "online" : "offline"} />
                        <span className={cn("text-[12.5px]", online ? "text-fg-2" : "text-meta")}>
                          {online ? "在线" : "离线"}
                        </span>
                      </span>
                    </td>
                    <td className="text-fg-2">{s.owner?.username ?? "—"}</td>
                    <td>
                      <div className="nm font-medium text-fg">{s.name}</div>
                      <div className="mono text-[11px] text-meta">
                        {(s.uuid ?? "").slice(0, 8) || "—"}
                      </div>
                    </td>
                    <td>
                      {gnames.length ? (
                        <div className="flex flex-wrap gap-1">
                          {gnames.map((n) => (
                            <span key={n} className="chip">
                              {n}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-meta">—</span>
                      )}
                    </td>
                    <td>
                      <div className="inline-flex items-start gap-1.5">
                        <div className="mono text-[12px] leading-tight">
                          <div className="text-fg-2">{ipv4 || "—"}</div>
                          {ipv6 && (
                            <div className="max-w-[180px] truncate text-meta" title={ipv6}>
                              {ipv6}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="mono text-[12.5px] text-fg-2">{s.host?.version || "—"}</td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="btn btn-ghost btn-icon btn-sm">
                            <MoreHorizontal className="ic-sm" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => setEdit(s)}>
                            <Pencil className="ic-sm" /> 编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => forceUpdate([s.id])}>
                            <RotateCw className="ic-sm" /> 强制更新
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => copyInstall(s)}>
                            <ClipboardCopy className="ic-sm" /> 复制安装命令
                          </DropdownMenuItem>
                          <DropdownMenuItem danger onSelect={() => setConfirm({ ids: [s.id] })}>
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

      <ServerEditSheet server={edit} onClose={() => setEdit(null)} onSaved={() => mutate()} />
      <AddServerDialog open={addOpen} onOpenChange={setAddOpen} />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="删除服务器"
        desc={`确定删除选中的 ${confirm?.ids.length ?? 0} 台服务器？此操作不可恢复。`}
        destructive
        confirmText="删除"
        onConfirm={async () => {
          if (confirm) await doDelete(confirm.ids)
        }}
      />
    </>
  )
}
