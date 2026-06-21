import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import useSWR from "swr"
import { Activity, Eye, EyeOff, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/sonner"
import { apiGet } from "@/lib/api"
import { profileApi } from "@/api/resources"
import { useAuth } from "@/store/auth"
import { useTheme } from "@/store/theme"
import type { SettingResponse } from "@/types"

export default function LoginPage() {
  const nav = useNavigate()
  const { login, profile } = useAuth()

  // 已登录(含 OAuth2 回调成功后 cookie 就绪、/profile 拉到资料)直接进入后台,
  // 避免回调重定向到 /login?oauth2=true 后停留在登录页。
  useEffect(() => {
    if (profile) nav("/", { replace: true })
  }, [profile, nav])
  const { theme, toggle } = useTheme()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)

  const { data: setting } = useSWR<SettingResponse>("/setting", apiGet, {
    shouldRetryOnError: false,
  })
  const siteName = setting?.config?.site_name || "Nezha"
  const providers = setting?.config?.oauth2_providers ?? []

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return
    setBusy(true)
    try {
      await login(username, password)
      nav("/", { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登录失败")
    } finally {
      setBusy(false)
    }
  }

  const oauth2 = async (provider: string) => {
    try {
      const r = await profileApi.oauth2Login(provider)
      if (r?.redirect) window.location.href = r.redirect
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "无法发起 OAuth2 登录")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <div className="flex h-[52px] items-center justify-between border-b border-border px-5">
        <div className="flex items-center gap-2 text-[13.5px] font-semibold text-fg">
          <img src="/dashboard/logo.svg" className="h-5 w-5" alt="" /> {siteName} 管理后台
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={toggle} title="切换主题">
          {theme === "dark" ? <Sun className="ic-sm" /> : <Moon className="ic-sm" />}
        </button>
      </div>

      <div className="grid flex-1 place-items-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-7 flex flex-col items-center">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-[10px] bg-accent text-accent-fg">
              <Activity className="ic-lg" />
            </div>
            <h1 className="text-[22px] font-semibold text-fg">登录到 {siteName}</h1>
            <p className="mt-1 text-[13px] text-muted">服务器监控 · 管理后台</p>
          </div>

          <form onSubmit={submit} className="card-soft space-y-4 p-6">
            <div>
              <Label htmlFor="u">用户名</Label>
              <Input
                id="u"
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>
            <div>
              <Label htmlFor="p">密码</Label>
              <div className="relative">
                <Input
                  id="p"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  className="pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={() => setShow((s) => !s)}
                  tabIndex={-1}
                >
                  {show ? <EyeOff className="ic-sm" /> : <Eye className="ic-sm" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              style={{ height: 38 }}
              disabled={busy}
            >
              {busy ? "登录中…" : "登录"}
            </Button>

            {providers.length > 0 && (
              <>
                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-border-soft" />
                  <span className="text-[12px] text-meta">或</span>
                  <span className="h-px flex-1 bg-border-soft" />
                </div>
                {providers.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant="outline"
                    className="w-full"
                    style={{ height: 38 }}
                    onClick={() => oauth2(p)}
                  >
                    使用 {p} 登录
                  </Button>
                ))}
              </>
            )}
          </form>
          <p className="mt-6 text-center text-[12px] text-meta">
            © {new Date().getFullYear()} {siteName} Monitoring
          </p>
        </div>
      </div>
    </div>
  )
}
