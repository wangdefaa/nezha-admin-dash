import { useEffect, useState } from "react"
import useSWR from "swr"
import { Link2, Link2Off } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/common/page-header"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { toast } from "@/components/ui/sonner"
import { swrFetcher } from "@/lib/api"
import { profileApi } from "@/api/resources"
import { useAuth } from "@/store/auth"
import { ROLES } from "@/lib/constants"
import type { SettingResponse } from "@/types"

function AccountCard({ onSaved }: { onSaved: () => void }) {
  const { profile } = useAuth()
  const [original, setOriginal] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rejectPassword, setRejectPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  // 至少绑定一个 OAuth2 才能开启「禁止密码登录」（后端 updateProfile 同样校验）。
  // 已开启时允许关闭，故 lock 仅在未开启且无绑定时生效。
  const bindCount = Object.keys(profile?.oauth2_bind ?? {}).length
  const lockReject = bindCount < 1 && !rejectPassword

  useEffect(() => {
    setRejectPassword(profile?.reject_password ?? false)
  }, [profile?.reject_password])

  const save = async () => {
    if (!original) return toast.error("请输入原密码")
    setBusy(true)
    try {
      await profileApi.update({
        original_password: original,
        new_username: username || undefined,
        new_password: password || undefined,
        reject_password: rejectPassword,
      })
      toast.success("账号已更新")
      setOriginal("")
      setPassword("")
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新失败")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card-soft p-5">
      <h2 className="mb-4 text-[15px] font-semibold text-fg">修改账号</h2>
      <div className="space-y-4">
        <div>
          <label className="label">原密码</label>
          <Input
            type="password"
            autoComplete="current-password"
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="label">新用户名</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="留空则不修改"
          />
        </div>
        <div>
          <label className="label">新密码</label>
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="留空则不修改"
          />
        </div>
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-fg">禁止密码登录</div>
            <p className="mt-0.5 text-[11.5px] text-meta">
              {lockReject ? "需先绑定至少一个 OAuth2 账号" : "启用后本账号仅可通过 OAuth2 登录"}
            </p>
          </div>
          <Switch
            checked={rejectPassword}
            onCheckedChange={setRejectPassword}
            disabled={lockReject}
          />
        </div>
        <Button variant="primary" onClick={save} disabled={busy}>
          {busy ? "保存中…" : "保存"}
        </Button>
      </div>
    </div>
  )
}

function OAuth2Card({ binds, providers }: { binds: Record<string, string>; providers: string[] }) {
  const { refresh } = useAuth()
  const [unbind, setUnbind] = useState<string | null>(null)
  // binds 的 key 是小写(回调存储时 ToLower),配置 provider 名可能含大写。
  // 以小写匹配、显示用配置原名,避免同一 provider 因大小写不一致而重复成两行。
  const all = [...providers]
  for (const k of Object.keys(binds)) {
    if (!providers.some((p) => p.toLowerCase() === k.toLowerCase())) all.push(k)
  }
  const bindKeyOf = (provider: string) =>
    Object.keys(binds).find((k) => k.toLowerCase() === provider.toLowerCase())

  const doUnbind = async (provider: string) => {
    await profileApi.oauth2Unbind(provider)
    toast.success(`已解绑 ${provider}`)
    refresh()
  }
  // 发起绑定:换取授权地址后整页跳转,回调用当前登录态把第三方身份绑到本账号
  const doBind = async (provider: string) => {
    try {
      const r = await profileApi.oauth2Bind(provider)
      if (r?.redirect) window.location.href = r.redirect
      else toast.error("未获取到跳转地址")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "发起绑定失败")
    }
  }

  return (
    <div className="card-soft p-5">
      <h2 className="mb-4 text-[15px] font-semibold text-fg">OAuth2 绑定</h2>
      {all.length === 0 ? (
        <p className="py-2 text-[13px] text-meta">管理员尚未配置任何 OAuth2 登录提供方。</p>
      ) : (
        <div className="space-y-1">
          {all.map((provider) => {
            const bindKey = bindKeyOf(provider)
            const openid = bindKey ? binds[bindKey] : undefined
            return (
              <div key={provider} className="row-line">
                <div className="flex min-w-0 items-center gap-2">
                  {openid ? (
                    <Link2 className="ic-sm shrink-0 text-accent" />
                  ) : (
                    <Link2Off className="ic-sm shrink-0 text-meta" />
                  )}
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium capitalize text-fg">{provider}</div>
                    <div className="mono truncate text-[11.5px] text-meta">
                      {openid || "未绑定"}
                    </div>
                  </div>
                </div>
                {openid ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-danger"
                    onClick={() => setUnbind(bindKey ?? provider)}
                  >
                    <Link2Off className="ic-sm" /> 解绑
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => doBind(provider)}>
                    <Link2 className="ic-sm" /> 绑定
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!unbind}
        onOpenChange={(o) => !o && setUnbind(null)}
        title="解绑 OAuth2"
        desc={`确定解绑 ${unbind} 账号？解绑后将无法用其登录。`}
        destructive
        confirmText="解绑"
        onConfirm={async () => {
          if (unbind) await doUnbind(unbind)
        }}
      />
    </div>
  )
}

export default function ProfilePage() {
  const { profile, refresh } = useAuth()
  const { data: setting } = useSWR<SettingResponse>("/setting", swrFetcher)
  const roleLabel = ROLES.find((r) => r.value === profile?.role)?.label ?? "—"

  return (
    <>
      <PageHeader
        title="个人资料"
        desc="管理你的账号信息与第三方登录绑定"
        actions={
          <span className="inline-flex items-center gap-2 text-[13px] text-fg-2">
            {profile?.username}
            <Badge soft>{roleLabel}</Badge>
          </span>
        }
      />
      <div className="grid gap-5 md:grid-cols-2">
        <AccountCard onSaved={refresh} />
        <OAuth2Card
          binds={profile?.oauth2_bind ?? {}}
          providers={setting?.config?.oauth2_providers ?? []}
        />
      </div>
    </>
  )
}
