import { useEffect, useState } from "react"
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select } from "@/components/ui/select"
import { CopyButton } from "@/components/common/copy-button"
import { toast } from "@/components/ui/sonner"
import { notificationsApi } from "@/api/resources"
import {
  NOTIFICATION_METHODS,
  NOTIFICATION_TYPES,
  NOTIFICATION_PLACEHOLDERS,
} from "@/lib/constants"
import { NOTIFICATION_METHOD, NOTIFICATION_TYPE } from "@/types"
import type { Notification, NotificationForm } from "@/types"

const EMPTY: NotificationForm = {
  name: "",
  url: "",
  request_method: NOTIFICATION_METHOD.GET,
  request_type: NOTIFICATION_TYPE.JSON,
  request_header: "",
  request_body: "",
  verify_tls: false,
  format_metric_units: false,
}

function toForm(n: Notification): NotificationForm {
  return {
    name: n.name,
    url: n.url,
    request_method: n.request_method,
    request_type: n.request_type,
    request_header: n.request_header ?? "",
    request_body: n.request_body ?? "",
    verify_tls: n.verify_tls ?? false,
    format_metric_units: n.format_metric_units ?? false,
  }
}

export function NotificationEditSheet({
  open,
  target,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  target: Notification | null
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<NotificationForm>(EMPTY)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setForm(target ? toForm(target) : EMPTY)
  }, [open, target])

  const isGet = form.request_method === NOTIFICATION_METHOD.GET
  const set = <K extends keyof NotificationForm>(k: K, v: NotificationForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name.trim() || !form.url.trim()) {
      toast.error("名称和 URL 不能为空")
      return
    }
    setBusy(true)
    try {
      if (target) await notificationsApi.update(target.id, form)
      else await notificationsApi.create(form)
      toast.success("已保存")
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader
          title={target ? "编辑通知方式" : "添加通知方式"}
          desc={target ? target.name : "新增一个 Webhook 通知渠道"}
        />
        <SheetBody>
          <div>
            <Label>名称</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="例如：Telegram Bot"
            />
          </div>
          <div>
            <Label>URL</Label>
            <Input
              className="mono"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://example.com/webhook"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>请求方式</Label>
              <Select
                value={form.request_method}
                onChange={(e) => set("request_method", Number(e.target.value))}
                options={NOTIFICATION_METHODS.map((m) => ({ value: m.value, label: m.label }))}
              />
            </div>
            <div>
              <Label>请求类型</Label>
              <Select
                value={form.request_type}
                onChange={(e) => set("request_type", Number(e.target.value))}
                options={NOTIFICATION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
            </div>
          </div>
          <div>
            <Label>请求 Header</Label>
            <Textarea
              rows={3}
              className="mono"
              value={form.request_header}
              onChange={(e) => set("request_header", e.target.value)}
              placeholder={'{"Authorization":"Bearer xxx"}'}
            />
          </div>
          <div>
            <Label>请求 Body</Label>
            <Textarea
              rows={4}
              className="mono"
              value={form.request_body}
              onChange={(e) => set("request_body", e.target.value)}
              placeholder={'{"text":"#NEZHA#"}'}
              disabled={isGet}
            />
            {isGet && <p className="hint">GET 请求不发送 Body</p>}
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-[13px] text-fg">校验 TLS 证书</div>
              <div className="text-[11.5px] text-meta">关闭后将跳过 HTTPS 证书校验</div>
            </div>
            <Switch checked={form.verify_tls} onCheckedChange={(v) => set("verify_tls", v)} />
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-[13px] text-fg">格式化指标单位</div>
              <div className="text-[11.5px] text-meta">将流量 / 速度等数值附带可读单位</div>
            </div>
            <Switch
              checked={form.format_metric_units}
              onCheckedChange={(v) => set("format_metric_units", v)}
            />
          </div>
          <PlaceholderRef />
        </SheetBody>
        <SheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
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

function PlaceholderRef() {
  const text = NOTIFICATION_PLACEHOLDERS.join(" ")
  return (
    <div className="pt-1">
      <div className="mb-1.5 flex items-center justify-between">
        <Label className="mb-0">可用占位符</Label>
        <CopyButton text={text} label="复制全部" />
      </div>
      <pre className="code">{NOTIFICATION_PLACEHOLDERS.join(" ")}</pre>
      <p className="hint">在 URL / Header / Body 中可使用上述占位符，发送时自动替换为对应字段。</p>
    </div>
  )
}
