import { useState } from "react"
import useSWR from "swr"
import { Check, DownloadCloud, MoreHorizontal, Plus, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge, Chip } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader, TableCard } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { ThemeEditSheet } from "@/components/themes/theme-edit-sheet"
import { swrFetcher } from "@/lib/api"
import { themeApi } from "@/api/resources"
import { toast } from "@/components/ui/sonner"
import type { SettingResponse, Theme } from "@/types"

const SOURCE_LABEL: Record<string, string> = { builtin: "内置", upload: "上传", github: "GitHub" }

export default function ThemesPage() {
  const { data, isLoading, mutate } = useSWR<Theme[]>("/theme", swrFetcher)
  const { data: setting, mutate: mutateSetting } = useSWR<SettingResponse>("/setting", swrFetcher)
  const userTemplate = setting?.config?.user_template
  const adminTemplate = setting?.config?.admin_template

  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirm, setConfirm] = useState<Theme | null>(null)

  const apply = async (t: Theme) => {
    await themeApi.apply(t.id)
    toast.success(`已将${t.is_admin ? "管理端" : "访客"}主题切换为「${t.name}」`)
    mutateSetting()
  }
  const refresh = async (t: Theme) => {
    await themeApi.refresh(t.id)
    toast.success("已拉取最新版本")
    mutate()
  }
  const doDelete = async (t: Theme) => {
    await themeApi.batchDelete([t.id])
    toast.success("已删除主题")
    mutate()
  }

  return (
    <>
      <PageHeader
        title="主题管理"
        desc="管理访客状态页与管理端主题：上传 / 拉取、切换、更新，无需重新发版"
        actions={
          <Button variant="primary" size="sm" onClick={() => setSheetOpen(true)}>
            <Plus className="ic-sm" /> 新增主题
          </Button>
        }
      />

      <TableCard
        toolbar={
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={async () => {
                await mutate()
                toast.success("已刷新")
              }}
              title="刷新"
            >
              <RefreshCw className="ic-sm" />
            </Button>
          </div>
        }
        footer={
          <span>
            共 <b className="text-fg">{data?.length ?? 0}</b> 个主题
          </span>
        }
      >
        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-meta">加载中…</div>
        ) : (data ?? []).length === 0 ? (
          <EmptyState title="暂无主题" desc="点击右上角「新增主题」上传或从 GitHub 拉取主题。" />
        ) : (
          <table className="tbl" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>名称</th>
                <th style={{ width: 100 }}>类型</th>
                <th style={{ width: 96 }}>来源</th>
                <th style={{ width: 160 }}>版本</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {data!.map((t) => (
                <ThemeRow
                  key={t.id}
                  theme={t}
                  current={t.is_admin ? adminTemplate : userTemplate}
                  onApply={apply}
                  onRefresh={refresh}
                  onDelete={setConfirm}
                />
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      <ThemeEditSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onSaved={() => mutate()} />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="删除主题"
        desc={`确定删除主题「${confirm?.name ?? ""}」？磁盘文件会一并清除。`}
        destructive
        confirmText="删除"
        onConfirm={async () => {
          if (confirm) await doDelete(confirm)
        }}
      />
    </>
  )
}

function ThemeRow({
  theme: t,
  current,
  onApply,
  onRefresh,
  onDelete,
}: {
  theme: Theme
  current?: string
  onApply: (t: Theme) => void
  onRefresh: (t: Theme) => void
  onDelete: (t: Theme) => void
}) {
  const isCurrent = t.path === current
  const canApply = !isCurrent
  const canRefresh = !!(t.github_repo && t.release_asset)
  const canDelete = t.source !== "builtin"
  const hasActions = canApply || canRefresh || canDelete

  return (
    <tr>
      <td className="nm font-medium text-fg">
        {t.name}
        {isCurrent && <Badge className="ml-2">当前</Badge>}
      </td>
      <td>
        {t.is_admin ? <Chip variant="accent">管理端</Chip> : <Chip>访客端</Chip>}
      </td>
      <td>
        <Chip>{SOURCE_LABEL[t.source] ?? t.source}</Chip>
      </td>
      <td className="mono text-[12px] text-meta">{t.version_tag || "—"}</td>
      <td>
        {hasActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn btn-ghost btn-icon btn-sm">
                <MoreHorizontal className="ic-sm" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {canApply && (
                <DropdownMenuItem onSelect={() => onApply(t)}>
                  <Check className="ic-sm" /> 设为当前
                </DropdownMenuItem>
              )}
              {canRefresh && (
                <DropdownMenuItem onSelect={() => onRefresh(t)}>
                  <DownloadCloud className="ic-sm" /> 拉取最新
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem danger onSelect={() => onDelete(t)}>
                  <Trash2 className="ic-sm" /> 删除
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </td>
    </tr>
  )
}
