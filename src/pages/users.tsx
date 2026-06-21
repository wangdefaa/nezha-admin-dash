import { useState } from "react"
import useSWR from "swr"
import { MoreHorizontal, Plus, Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Chip } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetFooter, SheetHeader } from "@/components/ui/sheet"
import { PageHeader, TableCard } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { CopyButton } from "@/components/common/copy-button"
import { swrFetcher } from "@/lib/api"
import { usersApi } from "@/api/resources"
import { ROLES } from "@/lib/constants"
import { toast } from "@/components/ui/sonner"
import { formatTime, maskSecret } from "@/lib/format"
import type { User, UserForm } from "@/types"

function roleLabel(role: number) {
  return ROLES.find((r) => r.value === role)?.label ?? "未知"
}

export default function UsersPage() {
  const { data: users, isLoading, mutate } = useSWR<User[]>("/user", swrFetcher)
  const [addOpen, setAddOpen] = useState(false)
  const [confirm, setConfirm] = useState<User | null>(null)

  const doDelete = async (u: User) => {
    await usersApi.batchDelete([u.id])
    toast.success(`已删除用户 ${u.username}`)
    mutate()
  }

  return (
    <>
      <PageHeader
        title="用户"
        desc="管理后台管理员与普通成员账号"
        actions={
          <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="ic-sm" /> 添加用户
          </Button>
        }
      />

      <TableCard
        footer={
          <span>
            共 <b className="text-fg">{users?.length ?? 0}</b> 个账号
          </span>
        }
      >
        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-meta">加载中…</div>
        ) : (users?.length ?? 0) === 0 ? (
          <EmptyState title="暂无用户" desc="点击右上角「添加用户」创建第一个账号。" />
        ) : (
          <table className="tbl" style={{ minWidth: 760 }}>
            <thead>
              <tr>
                <th>用户名</th>
                <th>角色</th>
                <th>Agent 密钥</th>
                <th>创建时间</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id}>
                  <td>
                    <span className="inline-flex items-center gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-semibold uppercase text-fg-2">
                        {u.username?.[0] ?? "?"}
                      </span>
                      <span className="nm font-medium text-fg">{u.username}</span>
                    </span>
                  </td>
                  <td>
                    <Chip variant={u.role === 0 ? "accent" : undefined}>{roleLabel(u.role)}</Chip>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="mono text-[12.5px] text-fg-2">
                        {maskSecret(u.agent_secret)}
                      </span>
                      {u.agent_secret && <CopyButton text={u.agent_secret} />}
                    </span>
                  </td>
                  <td className="text-fg-2">{formatTime(u.created_at)}</td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="btn btn-ghost btn-icon btn-sm">
                          <MoreHorizontal className="ic-sm" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem danger onSelect={() => setConfirm(u)}>
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

      <AddUserSheet open={addOpen} onOpenChange={setAddOpen} onSaved={() => mutate()} />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="删除用户"
        desc={`确定删除用户「${confirm?.username}」？此操作不可恢复。`}
        destructive
        confirmText="删除"
        onConfirm={async () => {
          if (confirm) await doDelete(confirm)
        }}
      />
    </>
  )
}

function AddUserSheet({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<UserForm>({ username: "", password: "", role: 1 })
  const [busy, setBusy] = useState(false)

  const reset = () => setForm({ username: "", password: "", role: 1 })

  const save = async () => {
    if (!form.username.trim() || !form.password) {
      toast.error("请填写用户名与密码")
      return
    }
    setBusy(true)
    try {
      await usersApi.create({ ...form, username: form.username.trim() })
      toast.success("已创建用户")
      onSaved()
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建失败")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <SheetContent>
        <SheetHeader title="添加用户" desc="创建后台管理员或普通成员账号" />
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <Label>用户名</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="登录用户名"
              autoComplete="off"
            />
          </div>
          <div>
            <Label>密码</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="登录密码"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label>角色</Label>
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: Number(e.target.value) })}
              options={ROLES}
            />
          </div>
        </div>
        <SheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            取消
          </Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            <UserPlus className="ic-sm" /> {busy ? "创建中…" : "创建"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
