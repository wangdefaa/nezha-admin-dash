import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { MultiSelect, type PickOption } from "@/components/common/multi-select"
import { toast } from "@/components/ui/sonner"
import { alertRulesApi } from "@/api/resources"
import { CYCLE_UNITS, METRIC_TYPES, RULE_COVER, TRIGGER_MODES } from "@/lib/constants"
import type { AlertRule, AlertRuleForm, Rule } from "@/types"

// 表单内规则行：ignore 用 number[] 维护，提交时转 Record<number,boolean>。
type RuleRow = Omit<Rule, "ignore"> & { ignore: number[] }

const newRow = (): RuleRow => ({ type: "cpu", cover: 0, ignore: [] })

function isCycleMetric(type: string) {
  return METRIC_TYPES.find((m) => m.value === type)?.cycle === true
}

// AlertRule.rules ?? JSON.parse(rules_raw)，容错。
function readRules(rule: AlertRule): Rule[] {
  if (rule.rules) return rule.rules
  if (!rule.rules_raw) return []
  try {
    const v = JSON.parse(rule.rules_raw)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function toRow(r: Rule): RuleRow {
  return { ...r, cover: r.cover ?? 0, ignore: Object.keys(r.ignore ?? {}).map(Number) }
}

export default function RuleBuilderDialog({
  open,
  onOpenChange,
  rule,
  servers,
  groups,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  rule: AlertRule | null
  servers: PickOption[]
  groups: { value: number; label: string }[]
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [rows, setRows] = useState<RuleRow[]>([newRow()])
  const [groupId, setGroupId] = useState(0)
  const [triggerMode, setTriggerMode] = useState(0)
  const [enable, setEnable] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    if (rule) {
      const parsed = readRules(rule)
      setName(rule.name)
      setRows(parsed.length ? parsed.map(toRow) : [newRow()])
      setGroupId(rule.notification_group_id ?? 0)
      setTriggerMode(rule.trigger_mode ?? 0)
      setEnable(rule.enable ?? true)
    } else {
      setName("")
      setRows([newRow()])
      setGroupId(groups[0]?.value ?? 0)
      setTriggerMode(0)
      setEnable(true)
    }
  }, [open, rule, groups])

  const patchRow = (i: number, patch: Partial<RuleRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const addRow = () => setRows((prev) => [...prev, newRow()])
  const removeRow = (i: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  const buildForm = (): AlertRuleForm => ({
    name: name.trim(),
    notification_group_id: groupId,
    trigger_mode: triggerMode,
    enable,
    rules: rows.map(serializeRow),
  })

  const save = async () => {
    if (!name.trim()) return toast.error("请填写规则名称")
    setBusy(true)
    try {
      const form = buildForm()
      if (rule) await alertRulesApi.update(rule.id, form)
      else await alertRulesApi.create(form)
      toast.success(rule ? "已保存规则" : "已创建规则")
      onSaved()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="wide" flexcol>
        <DialogHeader className="border-b border-border-soft">
          <DialogTitle>{rule ? "编辑告警规则" : "新建告警规则"}</DialogTitle>
          <DialogDescription>设置触发条件与作用范围，命中后向通知组发送告警。</DialogDescription>
        </DialogHeader>

        <div className="dialog-scroll space-y-5 px-5 py-4">
          <div>
            <Label>规则名称</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：CPU 过载告警"
              autoFocus
            />
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-fg">触发条件</div>
                <div className="mt-0.5 text-[11.5px] text-meta">任一规则命中即触发（OR 关系）</div>
              </div>
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="ic-sm" /> 添加规则
              </Button>
            </div>
            <div className="space-y-2.5">
              {rows.map((row, i) => (
                <RuleRowEditor
                  key={i}
                  row={row}
                  servers={servers}
                  canRemove={rows.length > 1}
                  onChange={(p) => patchRow(i, p)}
                  onRemove={() => removeRow(i)}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <Label>通知组</Label>
              <Select value={groupId} onChange={(e) => setGroupId(Number(e.target.value))}>
                <option value={0}>不发送通知</option>
                {groups.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>触发模式</Label>
              <div className="seg-tabs">
                {TRIGGER_MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={triggerMode === m.value ? "active" : ""}
                    onClick={() => setTriggerMode(m.value)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="mr-auto flex items-center gap-2.5">
            <Switch checked={enable} onCheckedChange={setEnable} />
            <span className="text-[13px] text-fg-2">启用规则</span>
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            取消
          </Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? "保存中…" : "保存规则"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 行 → Rule：剔除空数值字段，ignore 转 Record。
function serializeRow(row: RuleRow): Rule {
  const ignore: Record<number, boolean> = {}
  row.ignore.forEach((id) => (ignore[id] = true))
  const r: Rule = { type: row.type, cover: row.cover, ignore }
  if (row.min !== undefined) r.min = row.min
  if (row.max !== undefined) r.max = row.max
  if (row.duration !== undefined) r.duration = row.duration
  if (isCycleMetric(row.type)) {
    if (row.cycle_start) r.cycle_start = new Date(row.cycle_start).toISOString()
    if (row.cycle_interval !== undefined) r.cycle_interval = row.cycle_interval
    if (row.cycle_unit) r.cycle_unit = row.cycle_unit
  }
  return r
}

const numOrUndef = (v: string) => (v === "" ? undefined : Number(v))
// ISO 字符串 → input[type=date] 的 yyyy-MM-dd。
const toDateInput = (iso?: string) => {
  if (!iso) return ""
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10)
}

function RuleRowEditor({
  row,
  servers,
  canRemove,
  onChange,
  onRemove,
}: {
  row: RuleRow
  servers: PickOption[]
  canRemove: boolean
  onChange: (patch: Partial<RuleRow>) => void
  onRemove: () => void
}) {
  const cycle = isCycleMetric(row.type)
  return (
    <div className="rulerow space-y-3">
      <div className="flex items-end gap-2.5">
        <div className="min-w-0 flex-1">
          <Label className="!mb-1.5">监控指标</Label>
          <Select value={row.type} onChange={(e) => onChange({ type: e.target.value })}>
            {METRIC_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-24">
          <Label className="!mb-1.5">最小值</Label>
          <Input
            type="number"
            value={row.min ?? ""}
            onChange={(e) => onChange({ min: numOrUndef(e.target.value) })}
            placeholder="不限"
          />
        </div>
        <div className="w-24">
          <Label className="!mb-1.5">最大值</Label>
          <Input
            type="number"
            value={row.max ?? ""}
            onChange={(e) => onChange({ max: numOrUndef(e.target.value) })}
            placeholder="不限"
          />
        </div>
        <div className="w-24">
          <Label className="!mb-1.5">持续(秒)</Label>
          <Input
            type="number"
            value={row.duration ?? ""}
            onChange={(e) => onChange({ duration: numOrUndef(e.target.value) })}
            placeholder="0"
          />
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-icon shrink-0 text-danger"
          onClick={onRemove}
          disabled={!canRemove}
          title="删除规则"
        >
          <Trash2 className="ic-sm" />
        </button>
      </div>

      {cycle && (
        <div className="grid grid-cols-3 gap-2.5 border-t border-border-soft pt-1">
          <div className="pt-3">
            <Label className="!mb-1.5">周期起始</Label>
            <input
              type="date"
              className="input"
              value={toDateInput(row.cycle_start)}
              onChange={(e) => onChange({ cycle_start: e.target.value })}
            />
          </div>
          <div className="pt-3">
            <Label className="!mb-1.5">周期间隔</Label>
            <Input
              type="number"
              value={row.cycle_interval ?? ""}
              onChange={(e) => onChange({ cycle_interval: numOrUndef(e.target.value) })}
              placeholder="1"
            />
          </div>
          <div className="pt-3">
            <Label className="!mb-1.5">周期单位</Label>
            <Select
              value={row.cycle_unit ?? "hour"}
              onChange={(e) => onChange({ cycle_unit: e.target.value })}
            >
              {CYCLE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      )}

      <div className="border-t border-border-soft pt-3">
        <div className="mb-2 flex items-center gap-2.5">
          <span className="text-[12px] text-meta">覆盖范围</span>
          <Select
            value={row.cover}
            onChange={(e) => onChange({ cover: Number(e.target.value) })}
            className="!h-8 w-44 text-[12.5px]"
          >
            {RULE_COVER.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <MultiSelect
          options={servers}
          selected={row.ignore}
          onChange={(ids) => onChange({ ignore: ids })}
          placeholder="搜索要忽略的服务器…"
          emptyText="暂无服务器"
        />
      </div>
    </div>
  )
}
