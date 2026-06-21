// Agent 安装命令生成（Linux / macOS / Windows）。脚本默认来自 nezhahq/scripts，
// 也可由系统设置里的「安装脚本地址」覆盖；通过 NZ_ 环境变量把面板地址、TLS、密钥传给脚本。
const SH = "https://raw.githubusercontent.com/nezhahq/scripts/main/agent/install.sh"
const PS1 = "https://raw.githubusercontent.com/nezhahq/scripts/main/agent/install.ps1"

export interface InstallParams {
  host: string
  tls: boolean
  secret: string
  linuxScript?: string // 自定义 Linux/macOS 安装脚本地址，留空用默认
  windowsScript?: string // 自定义 Windows 安装脚本地址，留空用默认
}

// Linux：下载 install.sh，以 env 注入参数后用 root 执行。
export function linuxInstallCmd({ host, tls, secret, linuxScript }: InstallParams): string {
  const sh = linuxScript || SH
  return `curl -fsSL ${sh} -o nezha-agent.sh && \\\nsudo env NZ_SERVER=${host} NZ_TLS=${tls} NZ_CLIENT_SECRET=${secret} bash nezha-agent.sh`
}

// macOS：同一脚本会识别 darwin 并以 launchd 方式安装。
export function macInstallCmd(p: InstallParams): string {
  return linuxInstallCmd(p)
}

// Windows：PowerShell 5+，设置环境变量后拉取 install.ps1 执行。
export function windowsInstallCmd({ host, tls, secret, windowsScript }: InstallParams): string {
  const ps1 = windowsScript || PS1
  return `$env:NZ_SERVER='${host}';$env:NZ_TLS='${tls}';$env:NZ_CLIENT_SECRET='${secret}';irm ${ps1} | iex`
}

export type InstallOS = "linux" | "macos" | "windows"

// 按平台返回安装命令。
export function installCmd(os: InstallOS, p: InstallParams): string {
  if (os === "windows") return windowsInstallCmd(p)
  if (os === "macos") return macInstallCmd(p)
  return linuxInstallCmd(p)
}
