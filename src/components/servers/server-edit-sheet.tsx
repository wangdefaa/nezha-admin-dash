import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetFooter, SheetHeader } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/sonner"
import { serversApi } from "@/api/resources"
import type { Server, ServerForm } from "@/types"

export function ServerEditSheet({
  server,
  onClose,
  onSaved,
}: {
  server: Server | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<ServerForm>({ name: "" })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (server)
      setForm({
        name: server.name,
        note: server.note ?? "",
        public_note: server.public_note ?? "",
        display_index: server.display_index ?? 0,
        hide_for_guest: server.hide_for_guest ?? false,
      })
  }, [server])

  const save = async () => {
    if (!server) return
    setBusy(true)
    try {
      await serversApi.update(server.id, form)
      toast.success("已保存")
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={!!server} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader
          title="编辑服务器"
          desc={server ? `${server.name} · ${(server.uuid ?? "").slice(0, 8)}` : ""}
        />
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <Label>名称</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>
              管理员备注 <span className="font-normal text-meta">(note · 仅管理员可见)</span>
            </Label>
            <Textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="内部备注，不对外展示"
            />
          </div>
          <div>
            <Label>
              公开备注 <span className="font-normal text-meta">(public_note · 游客可见)</span>
            </Label>
            <Textarea
              value={form.public_note}
              onChange={(e) => setForm({ ...form, public_note: e.target.value })}
              placeholder="对外展示，支持 Markdown"
            />
          </div>
          <div>
            <Label>
              排序权重 <span className="font-normal text-meta">(display_index · 越大越靠前)</span>
            </Label>
            <Input
              type="number"
              value={form.display_index}
              onChange={(e) => setForm({ ...form, display_index: Number(e.target.value) })}
              className="w-32"
            />
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-[13px] text-fg">对游客隐藏</div>
              <div className="text-[11.5px] text-meta">开启后该服务器不在公开状态页展示</div>
            </div>
            <Switch
              checked={form.hide_for_guest}
              onCheckedChange={(v) => setForm({ ...form, hide_for_guest: v })}
            />
          </div>
        </div>
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
