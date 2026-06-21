import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Oauth2Config } from "@/types"

type Providers = Record<string, Oauth2Config>

// 纯函数：在不可变前提下更新 provider 集合
const withPatch = (v: Providers, name: string, p: Partial<Oauth2Config>): Providers => ({
  ...v,
  [name]: { ...v[name], ...p },
})
const removed = (v: Providers, name: string): Providers => {
  const rest = { ...v }
  delete rest[name]
  return rest
}
const renamed = (v: Providers, oldName: string, next: string): Providers => {
  if (next === oldName || !next || v[next]) return v
  const rest = { ...v }
  const cfg = rest[oldName]
  delete rest[oldName]
  rest[next] = cfg
  return rest
}
const nextName = (v: Providers): string => {
  let n = "github"
  let i = 1
  while (v[n]) n = `provider${i++}`
  return n
}

// 单字段输入行
function F({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value?: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

// Scopes 用本地字符串缓冲：受控 value 不再由数组 join 实时回写，
// 否则手动输入的逗号会被 split/filter 立即吃掉；失焦时才解析为数组提交。
function ScopesField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(", "))
  return (
    <div className="col-span-2">
      <label className="label">Scopes（逗号分隔）</label>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() =>
          onChange(
            text
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        placeholder="read:user, user:email"
      />
    </div>
  )
}

// 单个 provider 卡片；name 用本地 state + onBlur 提交，避免边输入边改 key 失焦
function ProviderCard({
  name,
  config,
  onRename,
  onPatch,
  onRemove,
}: {
  name: string
  config: Oauth2Config
  onRename: (v: string) => void
  onPatch: (p: Partial<Oauth2Config>) => void
  onRemove: () => void
}) {
  const [localName, setLocalName] = useState(name)
  const ep = config.endpoint ?? {}
  return (
    <div className="card-soft space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Input
          className="font-medium"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={() => onRename(localName)}
          placeholder="provider 名（如 github）"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-danger"
          onClick={onRemove}
          title="删除提供方"
        >
          <Trash2 className="ic-sm" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <F label="Client ID" value={config.client_id} onChange={(v) => onPatch({ client_id: v })} />
        <F
          label="Client Secret"
          value={config.client_secret}
          onChange={(v) => onPatch({ client_secret: v })}
        />
        <F
          label="Auth URL"
          value={ep.auth_url}
          onChange={(v) => onPatch({ endpoint: { ...ep, auth_url: v } })}
        />
        <F
          label="Token URL"
          value={ep.token_url}
          onChange={(v) => onPatch({ endpoint: { ...ep, token_url: v } })}
        />
        <F
          label="User Info URL"
          value={config.user_info_url}
          onChange={(v) => onPatch({ user_info_url: v })}
        />
        <F
          label="User ID Path"
          value={config.user_id_path}
          onChange={(v) => onPatch({ user_id_path: v })}
          placeholder="如 id / sub"
        />
        <ScopesField value={config.scopes ?? []} onChange={(v) => onPatch({ scopes: v })} />
      </div>
    </div>
  )
}

export function Oauth2Editor({
  value,
  onChange,
}: {
  value: Providers
  onChange: (v: Providers) => void
}) {
  const entries = Object.entries(value)
  return (
    <div className="space-y-3">
      <p className="hint">
        配置 OAuth2 登录提供方。client_secret 仅管理员可见，修改后点右上角「保存」生效。
      </p>
      {entries.length === 0 && (
        <p className="py-4 text-center text-[13px] text-meta">
          暂无提供方，点击下方「添加提供方」。
        </p>
      )}
      {entries.map(([name, config]) => (
        <ProviderCard
          key={name}
          name={name}
          config={config}
          onRename={(v) => onChange(renamed(value, name, v))}
          onPatch={(p) => onChange(withPatch(value, name, p))}
          onRemove={() => onChange(removed(value, name))}
        />
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange({ ...value, [nextName(value)]: {} })}
      >
        <Plus className="ic-sm" /> 添加提供方
      </Button>
    </div>
  )
}
