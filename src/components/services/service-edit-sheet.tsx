import { useEffect, useMemo, useState, type ReactNode } from "react"
import useSWR from "swr"
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select } from "@/components/ui/select"
import { MultiSelect, type PickOption } from "@/components/common/multi-select"
import { toast } from "@/components/ui/sonner"
import { swrFetcher } from "@/lib/api"
import { servicesApi } from "@/api/resources"
import { SERVICE_TYPES, SERVICE_COVER } from "@/lib/constants"
import type { Server, Service, ServiceForm, NotificationGroupResponseItem } from "@/types"

type State = Required<
  Pick<
    ServiceForm,
    | "name"
    | "target"
    | "type"
    | "cover"
    | "duration"
    | "notify"
    | "latency_notify"
    | "hide_for_guest"
    | "notification_group_id"
    | "min_latency"
    | "max_latency"
  >
> & { skip: number[] }

const EMPTY: State = {
  name: "",
  target: "",
  type: 1,
  cover: 0,
  duration: 30,
  notify: false,
  latency_notify: false,
  hide_for_guest: false,
  notification_group_id: 0,
  min_latency: 0,
  max_latency: 0,
  skip: [],
}

function fromService(s: Service): State {
  return {
    name: s.name,
    target: s.target,
    type: s.type,
    cover: s.cover,
    duration: s.duration,
    notify: s.notify ?? false,
    latency_notify: s.latency_notify ?? false,
    hide_for_guest: s.hide_for_guest ?? false,
    notification_group_id: s.notification_group_id ?? 0,
    min_latency: s.min_latency ?? 0,
    max_latency: s.max_latency ?? 0,
    skip: Object.entries(s.skip_servers ?? {})
      .filter(([, v]) => v)
      .map(([k]) => Number(k)),
  }
}

function toForm(s: State): ServiceForm {
  return {
    name: s.name.trim(),
    target: s.target.trim(),
    type: s.type,
    cover: s.cover,
    duration: s.duration,
    notify: s.notify,
    latency_notify: s.latency_notify,
    hide_for_guest: s.hide_for_guest,
    notification_group_id: s.notification_group_id,
    min_latency: s.min_latency,
    max_latency: s.max_latency,
    skip_servers: Object.fromEntries(s.skip.map((id) => [id, true])),
  }
}

export function ServiceEditSheet({
  service,
  open,
  onClose,
  onSaved,
}: {
  service: Service | null
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const { data: groups } = useSWR<NotificationGroupResponseItem[]>(
    open ? "/notification-group" : null,
    swrFetcher,
  )
  const { data: servers } = useSWR<Server[]>(open ? "/server" : null, swrFetcher)
  const [form, setForm] = useState<State>(EMPTY)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) setForm(service ? fromService(service) : EMPTY)
  }, [open, service])

  const set = <K extends keyof State>(k: K, v: State[K]) => setForm((f) => ({ ...f, [k]: v }))

  const groupOptions = useMemo(
    () => [
      { value: 0, label: "不通知" },
      ...(groups ?? []).map((g) => ({ value: g.group.id, label: g.group.name })),
    ],
    [groups],
  )
  const serverOptions: PickOption[] = useMemo(
    () =>
      (servers ?? []).map((s) => ({
        value: s.id,
        label: s.name,
        desc: s.geoip?.ip?.ipv4_addr || s.geoip?.ip?.ipv6_addr || "",
      })),
    [servers],
  )

  const save = async () => {
    if (!form.name.trim() || !form.target.trim()) {
      toast.error("名称和目标不能为空")
      return
    }
    setBusy(true)
    try {
      const payload = toForm(form)
      if (service) await servicesApi.update(service.id, payload)
      else await servicesApi.create(payload)
      toast.success(service ? "已保存" : "已添加监控")
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent width={480}>
        <SheetHeader
          title={service ? "编辑监控" : "添加监控"}
          desc={service ? service.name : "新建一条服务拨测任务"}
        />
        <SheetBody>
          <div>
            <Label>名称</Label>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="如：官网首页"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>类型</Label>
              <Select
                value={form.type}
                onChange={(e) => set("type", Number(e.target.value))}
                options={SERVICE_TYPES}
              />
            </div>
            <div>
              <Label>
                监控间隔 <span className="font-normal text-meta">(秒)</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={form.duration}
                onChange={(e) => set("duration", Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label>
              目标 <span className="font-normal text-meta">(target)</span>
            </Label>
            <Input
              className="mono"
              value={form.target}
              onChange={(e) => set("target", e.target.value)}
              placeholder="https://example.com 或 1.1.1.1:443"
            />
          </div>

          <div className="my-1 h-px bg-border" />

          <div>
            <Label>覆盖范围</Label>
            <Select
              value={form.cover}
              onChange={(e) => set("cover", Number(e.target.value))}
              options={SERVICE_COVER}
            />
          </div>
          <div>
            <Label>
              {form.cover === 1 ? "覆盖的服务器" : "排除的服务器"}{" "}
              <span className="font-normal text-meta">(skip_servers)</span>
            </Label>
            <MultiSelect
              options={serverOptions}
              selected={form.skip}
              onChange={(v) => set("skip", v)}
              placeholder="搜索服务器…"
              emptyText="暂无服务器"
            />
          </div>

          <div className="my-1 h-px bg-border" />

          <div>
            <Label>通知组</Label>
            <Select
              value={form.notification_group_id}
              onChange={(e) => set("notification_group_id", Number(e.target.value))}
              options={groupOptions}
            />
          </div>
          <Row title="触发通知" desc="状态变更时按通知组推送">
            <Switch checked={form.notify} onCheckedChange={(v) => set("notify", v)} />
          </Row>
          <Row title="延迟通知" desc="延迟超出范围时推送告警">
            <Switch
              checked={form.latency_notify}
              onCheckedChange={(v) => set("latency_notify", v)}
            />
          </Row>
          {form.latency_notify && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>
                  最小延迟 <span className="font-normal text-meta">(ms)</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_latency}
                  onChange={(e) => set("min_latency", Number(e.target.value))}
                />
              </div>
              <div>
                <Label>
                  最大延迟 <span className="font-normal text-meta">(ms)</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.max_latency}
                  onChange={(e) => set("max_latency", Number(e.target.value))}
                />
              </div>
            </div>
          )}
          <Row title="对游客隐藏" desc="开启后不在公开状态页展示">
            <Switch
              checked={form.hide_for_guest}
              onCheckedChange={(v) => set("hide_for_guest", v)}
            />
          </Row>
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

function Row({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <div>
        <div className="text-[13px] text-fg">{title}</div>
        <div className="text-[11.5px] text-meta">{desc}</div>
      </div>
      {children}
    </div>
  )
}
