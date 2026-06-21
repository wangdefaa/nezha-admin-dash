import { useMemo, useState } from "react"
import useSWR from "swr"
import { MoreHorizontal, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
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
import { GroupEditSheet, type GroupEditState } from "@/components/groups/group-edit-sheet"
import { swrFetcher } from "@/lib/api"
import { serverGroupsApi } from "@/api/resources"
import { toast } from "@/components/ui/sonner"
import type { Server, ServerGroupResponseItem } from "@/types"

const PREVIEW = 4

export default function ServerGroupsPage() {
  const {
    data: groups,
    isLoading,
    mutate,
  } = useSWR<ServerGroupResponseItem[]>("/server-group", swrFetcher)
  const { data: servers } = useSWR<Server[]>("/server", swrFetcher)

  const [edit, setEdit] = useState<GroupEditState | null>(null)
  const [confirm, setConfirm] = useState<{ id: number; name: string } | null>(null)

  const options = useMemo(
    () =>
      (servers ?? []).map((s) => ({
        value: s.id,
        label: s.name,
        desc: s.geoip?.ip?.ipv4_addr || "",
      })),
    [servers],
  )
  const nameOf = useMemo(() => new Map((servers ?? []).map((s) => [s.id, s.name])), [servers])

  const submit = async (id: number | null, name: string, members: number[]) => {
    if (id == null) {
      await serverGroupsApi.create({ name, servers: members })
      toast.success("已创建分组")
    } else {
      await serverGroupsApi.update(id, { name, servers: members })
      toast.success("已保存")
    }
    mutate()
  }

  const doDelete = async (id: number) => {
    await serverGroupsApi.batchDelete([id])
    toast.success("已删除分组")
    mutate()
  }

  return (
    <>
      <PageHeader
        title="服务器分组"
        desc="将服务器归类到分组，便于在列表与拨测中按组筛选"
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setEdit({ id: null, name: "", members: [] })}
          >
            <Plus className="ic-sm" /> 新建分组
          </Button>
        }
      />

      <TableCard
        toolbar={
          <div className="ml-auto">
            <Button variant="ghost" size="icon-sm" onClick={() => mutate()} title="刷新">
              <RefreshCw className="ic-sm" />
            </Button>
          </div>
        }
        footer={
          <span>
            共 <b className="text-fg">{groups?.length ?? 0}</b> 个分组
          </span>
        }
      >
        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-meta">加载中…</div>
        ) : (groups ?? []).length === 0 ? (
          <EmptyState title="暂无分组" desc="点击右上角「新建分组」创建你的第一个服务器分组。" />
        ) : (
          <table className="tbl" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>名称</th>
                <th style={{ width: 100 }}>服务器数</th>
                <th>成员预览</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {groups!.map((g) => {
                const ids = g.servers ?? []
                const shown = ids.slice(0, PREVIEW)
                const rest = ids.length - shown.length
                return (
                  <tr key={g.group.id}>
                    <td className="nm font-medium text-fg">{g.group.name}</td>
                    <td>
                      <Chip>{ids.length} 台</Chip>
                    </td>
                    <td>
                      {ids.length === 0 ? (
                        <span className="text-meta">—</span>
                      ) : (
                        <span className="inline-flex flex-wrap items-center gap-1.5">
                          {shown.map((id) => (
                            <Chip key={id}>{nameOf.get(id) ?? `#${id}`}</Chip>
                          ))}
                          {rest > 0 && <Chip variant="more">+{rest}</Chip>}
                        </span>
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
                          <DropdownMenuItem
                            onSelect={() =>
                              setEdit({ id: g.group.id, name: g.group.name, members: ids })
                            }
                          >
                            <Pencil className="ic-sm" /> 编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            danger
                            onSelect={() => setConfirm({ id: g.group.id, name: g.group.name })}
                          >
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

      <GroupEditSheet
        open={!!edit}
        state={edit}
        title="分组"
        memberLabel="服务器"
        options={options}
        onClose={() => setEdit(null)}
        onSubmit={submit}
      />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="删除分组"
        desc={`确定删除分组「${confirm?.name ?? ""}」？组内服务器不会被删除。`}
        destructive
        confirmText="删除"
        onConfirm={async () => {
          if (confirm) await doDelete(confirm.id)
        }}
      />
    </>
  )
}
