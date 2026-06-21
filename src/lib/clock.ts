// 时钟偏差校正：以服务器时间为基准判定在线/新鲜度。
// 监控面板不能依赖用户本机时钟——本机若偏差数十秒，会把在线
// 服务器误判为离线。每次 API 响应用 HTTP Date 头校正偏差。
let skewMs = 0

// 用响应的 Date 头更新「服务器时间 − 本机时间」偏差。
export function updateClockSkew(dateHeader: string | null): void {
  if (!dateHeader) return
  const serverMs = new Date(dateHeader).getTime()
  if (!Number.isNaN(serverMs)) skewMs = serverMs - Date.now()
}

// 估算的服务器当前时刻（毫秒）。
export function serverNow(): number {
  return Date.now() + skewMs
}
