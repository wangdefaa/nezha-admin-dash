// 业务常量与枚举标签（与后端 model 对齐）。

// 告警规则可监控指标（model/rule.go）
export const METRIC_TYPES: { value: string; label: string; cycle?: boolean }[] = [
  { value: "cpu", label: "CPU 使用率" },
  { value: "memory", label: "内存使用率" },
  { value: "swap", label: "Swap 使用率" },
  { value: "disk", label: "磁盘使用率" },
  { value: "load1", label: "1 分钟负载" },
  { value: "load5", label: "5 分钟负载" },
  { value: "load15", label: "15 分钟负载" },
  { value: "tcp_conn_count", label: "TCP 连接数" },
  { value: "udp_conn_count", label: "UDP 连接数" },
  { value: "process_count", label: "进程数" },
  { value: "net_in_speed", label: "入站速度" },
  { value: "net_out_speed", label: "出站速度" },
  { value: "net_all_speed", label: "总网络速度" },
  { value: "transfer_in", label: "入站流量" },
  { value: "transfer_out", label: "出站流量" },
  { value: "transfer_all", label: "总流量" },
  { value: "offline", label: "离线" },
  { value: "transfer_in_cycle", label: "周期入站流量", cycle: true },
  { value: "transfer_out_cycle", label: "周期出站流量", cycle: true },
  { value: "transfer_all_cycle", label: "周期总流量", cycle: true },
]
export const CYCLE_UNITS = [
  { value: "hour", label: "小时" },
  { value: "day", label: "天" },
  { value: "week", label: "周" },
  { value: "month", label: "月" },
  { value: "year", label: "年" },
]
export const TRIGGER_MODES = [
  { value: 0, label: "单次触发" },
  { value: 1, label: "持续触发" },
]
export const RULE_COVER = [
  { value: 0, label: "覆盖全部服务器" },
  { value: 1, label: "忽略全部服务器" },
]

// 服务拨测
export const SERVICE_TYPES = [
  { value: 1, label: "HTTP" },
  { value: 3, label: "TCP" },
  { value: 2, label: "Ping" },
]
export const SERVICE_COVER = [
  { value: 0, label: "覆盖全部（排除所选）" },
  { value: 1, label: "仅覆盖所选" },
]

// 通知
export const NOTIFICATION_METHODS = [
  { value: 1, label: "GET" },
  { value: 2, label: "POST" },
]
export const NOTIFICATION_TYPES = [
  { value: 1, label: "JSON" },
  { value: 2, label: "Form" },
]
export const NOTIFICATION_PLACEHOLDERS = [
  "#NEZHA#",
  "#DATETIME#",
  "#SERVER.NAME#",
  "#SERVER.ID#",
  "#SERVER.IP#",
  "#SERVER.IPV4#",
  "#SERVER.IPV6#",
  "#SERVER.CPU#",
  "#SERVER.MEM#",
  "#SERVER.SWAP#",
  "#SERVER.DISK#",
  "#SERVER.SPEEDIN#",
  "#SERVER.SPEEDOUT#",
  "#SERVER.TRANSFERIN#",
  "#SERVER.TRANSFEROUT#",
  "#SERVER.LOAD1#",
  "#SERVER.LOAD5#",
  "#SERVER.LOAD15#",
  "#SERVER.TCPCONNCOUNT#",
  "#SERVER.UDPCONNCOUNT#",
]

// 用户角色
export const ROLES = [
  { value: 0, label: "管理员" },
  { value: 1, label: "普通成员" },
]

// WAF 封禁原因
export const WAF_REASONS: Record<number, string> = {
  1: "登录失败",
  2: "Token 暴破",
  3: "Agent 认证失败",
  4: "手动封禁",
  5: "OAuth2 暴破",
}

// PAT 权限范围分组（model/api_token.go AllScopes）
export const SCOPE_GROUPS: { key: string; label: string; verbs: string[] }[] = [
  { key: "inventory", label: "服务器清单", verbs: ["read", "delete"] },
  { key: "server", label: "服务器", verbs: ["read", "write", "delete"] },
  { key: "service", label: "服务拨测", verbs: ["read", "write", "delete"] },
  { key: "alertrule", label: "告警规则", verbs: ["read", "write", "delete"] },
  { key: "notification", label: "通知方式", verbs: ["read", "write", "delete"] },
  { key: "notification-group", label: "通知组", verbs: ["read", "write", "delete"] },
]
export const ADMIN_SCOPE = "nezha:admin:*"
export const scopeId = (resource: string, verb: string) => `nezha:${resource}:${verb}`
export const scopeWildcard = (resource: string) => `nezha:${resource}:*`

export const EXPIRY_OPTIONS = [
  { value: 0, label: "永不过期" },
  { value: 7, label: "7 天" },
  { value: 30, label: "30 天" },
  { value: 90, label: "90 天" },
  { value: 365, label: "365 天" },
]
