import { useState } from "react"
import { useNavigate } from "react-router-dom"
import useSWR from "swr"
import { ServerCog } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/common/copy-button"
import { apiGet } from "@/lib/api"
import { useAuth } from "@/store/auth"
import { installCmd, type InstallOS } from "@/lib/install-cmd"
import { cn } from "@/lib/utils"
import type { SettingResponse } from "@/types"

const OS_TABS: { key: InstallOS; label: string }[] = [
  { key: "unix", label: "Linux / macOS" },
  { key: "windows", label: "Windows" },
]

export function AddServerDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const nav = useNavigate()
  const { profile } = useAuth()
  const { data: setting } = useSWR<SettingResponse>(open ? "/setting" : null, apiGet)
  const [os, setOs] = useState<InstallOS>("unix")

  const host = setting?.config?.install_host || "<面板域名:端口>"
  const tls = !!setting?.config?.tls
  const secret = profile?.agent_secret || "<在系统设置查看密钥>"
  const cmd = installCmd(os, {
    host,
    tls,
    secret,
    linuxScript: setting?.config?.install_script_linux,
    windowsScript: setting?.config?.install_script_windows,
  })
  const label = OS_TABS.find((t) => t.key === os)?.label ?? "Linux / macOS"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="mid">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent-subtle text-accent">
              <ServerCog className="ic" />
            </span>
            <div>
              <DialogTitle>添加服务器</DialogTitle>
              <DialogDescription>
                在被监控的机器上执行以下命令，安装并连接 Agent。
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-5 pb-5">
          <div className="mb-3 flex items-center gap-1">
            {OS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setOs(t.key)}
                className={cn("btn btn-sm", os === t.key ? "btn-secondary" : "btn-ghost")}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] text-meta">一键安装（{label}）</span>
            <CopyButton text={cmd} label="复制" variant="outline" />
          </div>
          <div className="code">{cmd}</div>
          <div className="mt-4 flex items-center justify-between border-t border-border-soft pt-4">
            <p className="text-[12px] text-meta">
              连接地址与密钥来自系统设置；Agent 上线后将自动出现在列表中。
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                nav("/settings")
              }}
            >
              前往系统设置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
