// Agent 安装命令生成（Linux / macOS / Windows）。脚本默认来自 nezhahq/scripts，
// 也可由系统设置里的「安装脚本地址」覆盖；通过 NZ_ 环境变量把面板地址、TLS、密钥传给脚本。
const SH = "https://raw.githubusercontent.com/nezhahq/scripts/main/agent/install.sh"
const PS1 = "https://raw.githubusercontent.com/nezhahq/scripts/main/agent/install.ps1"

export interface InstallParams {
  host: string
  tls: boolean
  secret: string
  uuid?: string // 复用已有节点身份：填入则命令带 NZ_UUID，重装不产生新节点
  linuxScript?: string // 自定义 Linux/macOS 安装脚本地址，留空用默认
  windowsScript?: string // 自定义 Windows 安装脚本地址，留空用默认
}

// Linux / macOS：下载 install.sh，以 env 注入参数后用 root 执行（同一脚本识别 darwin 走 launchd）。
export function linuxInstallCmd({ host, tls, secret, uuid, linuxScript }: InstallParams): string {
  const sh = linuxScript || SH
  const uuidEnv = uuid ? `NZ_UUID=${uuid} ` : ""
  return `curl -fsSL ${sh} -o nezha-agent.sh && \\\nsudo env NZ_SERVER=${host} NZ_TLS=${tls} NZ_CLIENT_SECRET=${secret} ${uuidEnv}bash nezha-agent.sh`
}

// Windows：PowerShell 5+，设置环境变量后拉取 install.ps1 执行。
export function windowsInstallCmd({
  host,
  tls,
  secret,
  uuid,
  windowsScript,
}: InstallParams): string {
  const ps1 = windowsScript || PS1
  const uuidEnv = uuid ? `$env:NZ_UUID='${uuid}';` : ""
  return `$env:NZ_SERVER='${host}';$env:NZ_TLS='${tls}';$env:NZ_CLIENT_SECRET='${secret}';${uuidEnv}irm ${ps1} | iex`
}

export type InstallOS = "unix" | "windows"

// 按平台返回安装命令。
export function installCmd(os: InstallOS, p: InstallParams): string {
  return os === "windows" ? windowsInstallCmd(p) : linuxInstallCmd(p)
}
