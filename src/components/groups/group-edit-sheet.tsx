import { useEffect, useState } from "react"
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/sonner"
import { MultiSelect, type PickOption } from "@/components/common/multi-select"

// “名称 + 成员多选”型分组的通用编辑抽屉（服务器分组 / 通知组共用）。
export interface GroupEditState {
  /** 编辑时为已有成员 id 数组；新建时为 null */
  id: number | null
  name: string
  members: number[]
}

export function GroupEditSheet({
  open,
  state,
  title,
  memberLabel,
  options,
  onClose,
  onSubmit,
}: {
  open: boolean
  /** 打开时的初始值；null 表示关闭 */
  state: GroupEditState | null
  /** 抽屉标题前缀，如 “分组” / “通知组” */
  title: string
  /** 成员字段标题，如 “服务器” / “通知方式” */
  memberLabel: string
  options: PickOption[]
  onClose: () => void
  onSubmit: (id: number | null, name: string, members: number[]) => Promise<void>
}) {
  const [name, setName] = useState("")
  const [members, setMembers] = useState<number[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (state) {
      setName(state.name)
      setMembers(state.members)
    }
  }, [state])

  const editing = state?.id != null

  const save = async () => {
    if (!name.trim()) {
      toast.error("请输入名称")
      return
    }
    setBusy(true)
    try {
      await onSubmit(state?.id ?? null, name.trim(), members)
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader
          title={editing ? `编辑${title}` : `新建${title}`}
          desc={editing ? state?.name : `创建一个新的${title}并选择${memberLabel}`}
        />
        <SheetBody>
          <div>
            <Label>名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${title}名称`}
            />
          </div>
          <div>
            <Label>{memberLabel}</Label>
            <MultiSelect
              options={options}
              selected={members}
              onChange={setMembers}
              placeholder={`搜索${memberLabel}…`}
            />
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? "保存中…" : "保存"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
