import { useEffect, useState, type ReactNode } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Chip } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/page-header"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { Oauth2Editor } from "@/components/settings/oauth2-editor"
import { swrFetcher } from "@/lib/api"
import { settingApi } from "@/api/resources"
import { toast } from "@/components/ui/sonner"
import type { NotificationGroupResponseItem, SettingForm, SettingResponse } from "@/types"

const TABS = [
  { key: "site", label: "站点" },
  { key: "agent", label: "Agent 连接" },
  { key: "notify", label: "通知" },
  { key: "oauth2", label: "OAuth2" },
  { key: "maintain", label: "维护信息" },
] as const
type TabKey = (typeof TABS)[number]["key"]

const LANGUAGES = [
  { value: "zh_CN", label: "简体中文" },
  { value: "en_US", label: "English" },
  { value: "zh_TW", label: "繁體中文" },
]
const COVER_OPTIONS = [
  { value: 0, label: "覆盖全部（排除所选）" },
  { value: 1, label: "仅覆盖所选" },
]

// 单个字段：标签 + 控件，可占满整行。
function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string
  hint?: string
  full?: boolean
  children: ReactNode
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

// Switch 行：左文右开关。
function SwitchRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="row-line col-span-2">
      <div>
        <div className="text-[13px] text-fg">{label}</div>
        {desc && <div className="text-[11.5px] text-meta">{desc}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export default function SettingsPage() {
  const { data: setting, isLoading, mutate } = useSWR<SettingResponse>("/setting", swrFetcher)
  const { data: groups } = useSWR<NotificationGroupResponseItem[]>(
    "/notification-group",
    swrFetcher,
  )

  const [tab, setTab] = useState<TabKey>("site")
  const [form, setForm] = useState<SettingForm>({})
  const [busy, setBusy] = useState(false)
  const [maintainOpen, setMaintainOpen] = useState(false)

  useEffect(() => {
    if (setting?.config) setForm({ ...setting.config })
  }, [setting])

  const set = <K extends keyof SettingForm>(k: K, v: SettingForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }))

  const save = async () => {
    setBusy(true)
    try {
      await settingApi.update(form)
      toast.success("设置已保存")
      mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败")
    } finally {
      setBusy(false)
    }
  }

  const enterMaintenance = async () => {
    await settingApi.maintenance()
    toast.success("已进入维护模式")
  }

  return (
    <>
      <PageHeader
        title="系统设置"
        desc="面板全局配置 · 仅管理员可见"
        actions={
          <Button variant="primary" size="sm" onClick={save} disabled={busy || isLoading}>
            {busy ? "保存中…" : "保存"}
          </Button>
        }
      />

      <div className="tabs mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card-soft p-5">
        {tab === "site" && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="站点名称">
              <Input
                value={form.site_name ?? ""}
                onChange={(e) => set("site_name", e.target.value)}
              />
            </Field>
            <Field label="语言">
              <Select
                value={form.language ?? "zh_CN"}
                onChange={(e) => set("language", e.target.value)}
                options={LANGUAGES}
              />
            </Field>
            <Field label="自定义代码" hint="注入到状态页 <head>" full>
              <Textarea
                rows={4}
                value={form.custom_code ?? ""}
                onChange={(e) => set("custom_code", e.target.value)}
              />
            </Field>
            <Field label="管理面板自定义代码" hint="注入到管理后台 <head>" full>
              <Textarea
                rows={4}
                value={form.custom_code_dashboard ?? ""}
                onChange={(e) => set("custom_code_dashboard", e.target.value)}
              />
            </Field>
          </div>
        )}

        {tab === "agent" && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="安装域名 / IP" hint="install_host · 一键安装脚本连接地址">
              <Input
                value={form.install_host ?? ""}
                onChange={(e) => set("install_host", e.target.value)}
              />
            </Field>
            <Field label="面板域名 / IP" hint="dashboard_host · Agent 上报地址">
              <Input
                value={form.dashboard_host ?? ""}
                onChange={(e) => set("dashboard_host", e.target.value)}
              />
            </Field>
            <Field label="Web 真实 IP 头" hint="web_real_ip_header">
              <Input
                value={form.web_real_ip_header ?? ""}
                onChange={(e) => set("web_real_ip_header", e.target.value)}
              />
            </Field>
            <Field label="Agent 真实 IP 头" hint="agent_real_ip_header">
              <Input
                value={form.agent_real_ip_header ?? ""}
                onChange={(e) => set("agent_real_ip_header", e.target.value)}
              />
            </Field>
            <Field
              label="Linux / macOS 安装脚本地址"
              hint="install_script_linux · 留空使用默认脚本"
              full
            >
              <Input
                value={form.install_script_linux ?? ""}
                onChange={(e) => set("install_script_linux", e.target.value)}
                placeholder="https://…/install.sh"
              />
            </Field>
            <Field
              label="Windows 安装脚本地址"
              hint="install_script_windows · 留空使用默认脚本"
              full
            >
              <Input
                value={form.install_script_windows ?? ""}
                onChange={(e) => set("install_script_windows", e.target.value)}
                placeholder="https://…/install.ps1"
              />
            </Field>
            <SwitchRow
              label="启用 TLS"
              desc="Agent 通过 TLS 连接面板"
              checked={!!form.tls}
              onChange={(v) => set("tls", v)}
            />
          </div>
        )}

        {tab === "notify" && (
          <div className="grid grid-cols-2 gap-4">
            <SwitchRow
              label="启用 IP 变更通知"
              desc="服务器 IP 发生变化时推送通知"
              checked={!!form.enable_ip_change_notification}
              onChange={(v) => set("enable_ip_change_notification", v)}
            />
            <Field label="通知组">
              <Select
                value={form.ip_change_notification_group_id ?? 0}
                onChange={(e) => set("ip_change_notification_group_id", Number(e.target.value))}
              >
                <option value={0}>未指定</option>
                {groups?.map((g) => (
                  <option key={g.group.id} value={g.group.id}>
                    {g.group.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="覆盖范围">
              <Select
                value={form.cover ?? 0}
                onChange={(e) => set("cover", Number(e.target.value))}
                options={COVER_OPTIONS}
              />
            </Field>
            <Field label="忽略的 IP" hint="逗号分隔，这些 IP 变更不触发通知" full>
              <Textarea
                rows={2}
                value={form.ignored_ip_notification ?? ""}
                onChange={(e) => set("ignored_ip_notification", e.target.value)}
              />
            </Field>
            <SwitchRow
              label="通知中显示明文 IP"
              desc="关闭后通知内容中的 IP 将被打码"
              checked={!!form.enable_plain_ip_in_notification}
              onChange={(v) => set("enable_plain_ip_in_notification", v)}
            />
          </div>
        )}

        {tab === "oauth2" && (
          <Oauth2Editor value={form.oauth2 ?? {}} onChange={(v) => set("oauth2", v)} />
        )}

        {tab === "maintain" && (
          <div className="space-y-4">
            <div className="row-line">
              <div className="text-[13px] text-fg">面板版本</div>
              <span className="badge mono">{setting?.version ?? "—"}</span>
            </div>
            <div className="row-line">
              <div className="text-[13px] text-fg">时序数据库 (TSDB)</div>
              {setting?.tsdb_enabled ? (
                <Chip variant="accent">运行中</Chip>
              ) : (
                <Chip variant="more">未启用</Chip>
              )}
            </div>
            <div className="row-line">
              <div>
                <div className="text-[13px] text-fg">维护模式</div>
                <div className="text-[11.5px] text-meta">
                  进入后将停止接收新的 Agent 上报，请谨慎操作
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-danger"
                onClick={() => setMaintainOpen(true)}
              >
                进入维护模式
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={maintainOpen}
        onOpenChange={setMaintainOpen}
        title="进入维护模式"
        desc="确定进入维护模式？面板将暂停部分服务，可能影响数据采集。"
        destructive
        confirmText="进入维护"
        onConfirm={enterMaintenance}
      />
    </>
  )
}
