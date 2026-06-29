import { useMemo, useState } from "react"
import { ShieldAlert } from "lucide-react"
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
import { Select } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect } from "@/components/common/multi-select"
import { CopyButton } from "@/components/common/copy-button"
import { toast } from "@/components/ui/sonner"
import { tokensApi } from "@/api/resources"
import { ALL_SCOPE, EXPIRY_OPTIONS, SCOPE_GROUPS, scopeId, scopeWildcard } from "@/lib/constants"
import type { APITokenCreateResponse, Server } from "@/types"

// 单个权限分组：组标题 + 全选* + 各 verb 复选。
function ScopeGroup({
  group,
  scopes,
  toggle,
}: {
  group: { key: string; label: string; verbs: string[] }
  scopes: Set<string>
  toggle: (id: string, on: boolean) => void
}) {
  const wildcard = scopeWildcard(group.key)
  const all = scopes.has(wildcard)
  return (
    <div className="card-soft p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-medium text-fg">{group.label}</span>
        <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] text-meta">
          <Checkbox checked={all} onCheckedChange={(v) => toggle(wildcard, !!v)} /> 全选 *
        </label>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {group.verbs.map((verb) => {
          const id = scopeId(group.key, verb)
          return (
            <label
              key={id}
              className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-fg-2"
            >
              <Checkbox
                checked={all || scopes.has(id)}
                disabled={all}
                onCheckedChange={(v) => toggle(id, !!v)}
              />{" "}
              {verb}
            </label>
          )
        })}
      </div>
    </div>
  )
}

export function CreateTokenDialog({
  open,
  onOpenChange,
  servers,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  servers: Server[]
  onCreated: () => void
}) {
  const [name, setName] = useState("")
  const [scopes, setScopes] = useState<Set<string>>(new Set())
  const [serverIds, setServerIds] = useState<number[]>([])
  const [days, setDays] = useState(0)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<APITokenCreateResponse | null>(null)

  const options = useMemo(
    () =>
      servers.map((s) => ({
        value: s.id,
        label: s.name,
        desc: s.geoip?.ip?.ipv4_addr || s.geoip?.ip?.ipv6_addr,
      })),
    [servers],
  )

  const reset = () => {
    setName("")
    setScopes(new Set())
    setServerIds([])
    setDays(0)
    setCreated(null)
  }
  const close = (o: boolean) => {
    if (!o) reset()
    onOpenChange(o)
  }

  const toggle = (id: string, on: boolean) =>
    setScopes((prev) => {
      const next = new Set(prev)
      on ? next.add(id) : next.delete(id)
      return next
    })

  const submit = async () => {
    if (!name.trim()) return toast.error("请填写令牌名称")
    if (scopes.size === 0) return toast.error("请至少选择一个权限范围")
    setBusy(true)
    try {
      const res = await tokensApi.create({
        name: name.trim(),
        scopes: [...scopes],
        server_ids: serverIds.length ? serverIds : undefined,
        expires_in_days: days || undefined,
      })
      setCreated(res)
      onCreated()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建失败")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent size="mid" flexcol>
        <DialogHeader>
          <DialogTitle>{created ? "令牌已创建" : "新建 API 令牌"}</DialogTitle>
          <DialogDescription>
            {created
              ? "请立即复制并妥善保存，令牌明文仅此一次展示。"
              : "设置名称、权限范围与生效条件后创建。"}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-start gap-2 text-[12.5px] text-danger">
              <ShieldAlert className="ic-sm mt-0.5 shrink-0" />
              <span>请立即复制保存,令牌仅此一次展示,关闭后将无法再次查看。</span>
            </div>
            <div className="code mono flex items-center gap-2 break-all">
              <span className="flex-1">{created.token}</span>
              <CopyButton text={created.token} />
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div>
              <label className="label">名称</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：CI 部署令牌"
              />
            </div>

            <div>
              <label className="label">权限范围</label>
              <div className="space-y-2.5">
                <div className="card-soft p-3">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={scopes.has(ALL_SCOPE)}
                      onCheckedChange={(v) => toggle(ALL_SCOPE, !!v)}
                    />
                    <span className="text-[13px] font-medium text-danger">
                      管理员全权 {ALL_SCOPE}
                    </span>
                  </label>
                  <p className="hint">高权限：授予后该令牌可执行所有管理操作,请谨慎勾选。</p>
                </div>
                {SCOPE_GROUPS.map((g) => (
                  <ScopeGroup key={g.key} group={g} scopes={scopes} toggle={toggle} />
                ))}
              </div>
            </div>

            <div>
              <label className="label">
                服务器白名单 <span className="font-normal text-meta">(留空表示不限制)</span>
              </label>
              <MultiSelect
                options={options}
                selected={serverIds}
                onChange={setServerIds}
                placeholder="搜索服务器…"
              />
            </div>

            <div>
              <label className="label">有效期</label>
              <Select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {EXPIRY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          {created ? (
            <Button variant="primary" onClick={() => close(false)}>
              完成
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => close(false)} disabled={busy}>
                取消
              </Button>
              <Button variant="primary" onClick={submit} disabled={busy}>
                {busy ? "创建中…" : "创建"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
