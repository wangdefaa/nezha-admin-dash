import { useState, type ReactNode } from "react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  applyPublicNotePatch,
  detectPublicNoteMode,
  parsePublicNote,
  serializePublicNote,
  toggleEndNoExpiry,
  type PublicNote,
} from "@/lib/public-note"

const NO_EXPIRY = "0000-00-00T23:59:59+08:00"
const YES_NO = [
  { value: "1", label: "是" },
  { value: "0", label: "否" },
]

type Mode = "structured" | "raw"
type Patch = (path: string, v: string) => void

interface FieldDef {
  path: string
  label: string
  type: "text" | "date" | "select"
  options?: { value: string; label: string }[]
  placeholder?: string
}

const BILLING_FIELDS: FieldDef[] = [
  { path: "billingDataMod.startDate", label: "开始日期", type: "date" },
  { path: "billingDataMod.autoRenewal", label: "自动续费", type: "select", options: YES_NO },
  {
    path: "billingDataMod.cycle",
    label: "周期",
    type: "select",
    options: [
      { value: "Day", label: "天" },
      { value: "Week", label: "周" },
      { value: "Month", label: "月" },
      { value: "Year", label: "年" },
    ],
  },
  { path: "billingDataMod.amount", label: "金额", type: "text", placeholder: "如 5 USD" },
]

const PLAN_FIELDS: FieldDef[] = [
  { path: "planDataMod.bandwidth", label: "带宽", type: "text", placeholder: "如 1 Gbps" },
  { path: "planDataMod.trafficVol", label: "流量额度", type: "text", placeholder: "如 1 TB" },
  {
    path: "planDataMod.trafficType",
    label: "流量类型",
    type: "select",
    options: [
      { value: "1", label: "单向" },
      { value: "2", label: "双向" },
    ],
  },
  { path: "planDataMod.IPv4", label: "IPv4", type: "select", options: YES_NO },
  { path: "planDataMod.IPv6", label: "IPv6", type: "select", options: YES_NO },
  { path: "planDataMod.networkRoute", label: "网络线路", type: "text", placeholder: "如 CN2 GIA" },
  { path: "planDataMod.extra", label: "其他", type: "text" },
]

const getPath = (obj: PublicNote, path: string): string => {
  const v = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj)
  return typeof v === "string" ? v : ""
}

const dateVal = (v: string) => (v && v !== NO_EXPIRY ? v.slice(0, 10) : "")

// 公开备注编辑器：结构化表单 / 原始文本双模式，对外 value 始终是字符串（JSON 或自由文本）。
export function PublicNoteEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [mode, setMode] = useState<Mode>(() => detectPublicNoteMode(value))
  return (
    <div className="space-y-3">
      <ModeTabs mode={mode} onMode={setMode} />
      {mode === "raw" ? (
        <Textarea
          rows={5}
          className="mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="结构化 JSON 或自由文本（支持 Markdown）"
        />
      ) : (
        <StructuredEditor value={value} onChange={onChange} />
      )}
    </div>
  )
}

function ModeTabs({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  return (
    <div className="flex items-center gap-1">
      {(["structured", "raw"] as const).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onMode(k)}
          className={cn("btn btn-sm", mode === k ? "btn-secondary" : "btn-ghost")}
        >
          {k === "structured" ? "表单" : "原始"}
        </button>
      ))}
    </div>
  )
}

function StructuredEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const note = parsePublicNote(value)
  const patch: Patch = (path, v) =>
    onChange(serializePublicNote(applyPublicNotePatch(note, path, v || undefined)))
  return (
    <div className="space-y-4">
      <FieldGroup title="账单" fields={BILLING_FIELDS} note={note} patch={patch}>
        <ExpiryField note={note} patch={patch} onChange={onChange} />
      </FieldGroup>
      <FieldGroup title="套餐" fields={PLAN_FIELDS} note={note} patch={patch} />
    </div>
  )
}

function FieldGroup({
  title,
  fields,
  note,
  patch,
  children,
}: {
  title: string
  fields: FieldDef[]
  note: PublicNote
  patch: Patch
  children?: ReactNode
}) {
  return (
    <div className="space-y-2.5">
      <div className="text-[12px] font-medium text-meta">{title}</div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <Field key={f.path} def={f} note={note} patch={patch} />
        ))}
      </div>
      {children}
    </div>
  )
}

function Field({ def, note, patch }: { def: FieldDef; note: PublicNote; patch: Patch }) {
  const v = getPath(note, def.path)
  return (
    <div>
      <label className="label">{def.label}</label>
      {def.type === "select" ? (
        <Select value={v} onChange={(e) => patch(def.path, e.target.value)}>
          <option value="">未设置</option>
          {(def.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          type={def.type === "date" ? "date" : "text"}
          value={def.type === "date" ? dateVal(v) : v}
          placeholder={def.placeholder}
          onChange={(e) => patch(def.path, e.target.value)}
        />
      )}
    </div>
  )
}

function ExpiryField({
  note,
  patch,
  onChange,
}: {
  note: PublicNote
  patch: Patch
  onChange: (v: string) => void
}) {
  const noExpiry = note.billingDataMod?.endDate === NO_EXPIRY
  return (
    <div>
      <label className="label">到期日期</label>
      <div className="flex items-center gap-3">
        <Input
          type="date"
          className="flex-1"
          disabled={noExpiry}
          value={dateVal(getPath(note, "billingDataMod.endDate"))}
          onChange={(e) => patch("billingDataMod.endDate", e.target.value)}
        />
        <label className="flex shrink-0 items-center gap-1.5 text-[12.5px] text-fg-2">
          <Switch
            checked={noExpiry}
            onCheckedChange={() => onChange(serializePublicNote(toggleEndNoExpiry(note)))}
          />
          永不过期
        </label>
      </div>
    </div>
  )
}
