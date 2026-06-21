// 与后端 model/*_api.go 对齐的类型定义。响应统一 {success,data,error}。

export interface CommonResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface Pagination {
  offset?: number
  limit?: number
  total?: number
}
export interface PaginatedValue<T> {
  value?: T
  pagination?: Pagination
}
export interface PaginatedResponse<T> {
  success: boolean
  data?: PaginatedValue<T>
  error?: string
}

export interface LoginRequest {
  username: string
  password: string
}
export interface LoginResponse {
  token?: string
  expire?: string
}

// ───────── 服务器 ─────────
export interface Host {
  platform?: string
  platform_version?: string
  cpu?: string[]
  mem_total?: number
  disk_total?: number
  swap_total?: number
  arch?: string
  virtualization?: string
  boot_time?: number
  version?: string
}
export interface HostState {
  cpu?: number
  mem_used?: number
  swap_used?: number
  disk_used?: number
  net_in_transfer?: number
  net_out_transfer?: number
  net_in_speed?: number
  net_out_speed?: number
  uptime?: number
  load_1?: number
  load_5?: number
  load_15?: number
  tcp_conn_count?: number
  udp_conn_count?: number
  process_count?: number
}
export interface GeoIP {
  ip?: { ipv4_addr?: string; ipv6_addr?: string }
  country_code?: string
}
export interface ServerOwner {
  id: number
  username?: string
}
export interface Server {
  id: number
  name: string
  uuid?: string
  note?: string
  public_note?: string
  display_index: number
  hide_for_guest?: boolean
  host?: Host
  state?: HostState
  geoip?: GeoIP
  country_code?: string
  last_active?: string
  owner?: ServerOwner
  created_at?: string
}
export interface ServerForm {
  name: string
  note?: string
  public_note?: string
  display_index?: number
  hide_for_guest?: boolean
}

// 来自 /ws/server 的实时推送
export interface StreamServer {
  id: number
  name: string
  public_note?: string
  display_index?: number
  host?: Host
  state?: HostState
  country_code?: string
  last_active?: string
}
export interface StreamServerData {
  now?: number
  online?: number
  servers?: StreamServer[]
}

// ───────── 服务器分组 ─────────
export interface ServerGroup {
  id: number
  name: string
}
export interface ServerGroupResponseItem {
  group: ServerGroup
  servers: number[]
}
export interface ServerGroupForm {
  name: string
  servers: number[]
}

// ───────── 服务拨测 ─────────
export const SERVICE_TYPE = { HTTP: 1, ICMP: 2, TCP: 3 } as const
export interface Service {
  id: number
  name: string
  type: number
  target: string
  duration: number
  display_index: number
  notify?: boolean
  notification_group_id: number
  cover: number
  hide_for_guest?: boolean
  min_latency: number
  max_latency: number
  latency_notify?: boolean
  skip_servers: Record<number, boolean>
  created_at?: string
}
export interface ServiceForm {
  name: string
  target: string
  type: number
  cover: number
  display_index?: number
  notify?: boolean
  duration: number
  min_latency?: number
  max_latency?: number
  latency_notify?: boolean
  hide_for_guest?: boolean
  skip_servers?: Record<number, boolean>
  notification_group_id?: number
}
export interface ServiceResponseItem {
  service_name?: string
  current_up: number
  current_down: number
  total_up: number
  total_down: number
  delay?: number[]
  up?: number[]
  down?: number[]
}
export interface ServiceResponse {
  services?: Record<number, ServiceResponseItem>
  cycle_transfer_stats?: Record<number, unknown>
}

// ───────── 告警规则 ─────────
export interface Rule {
  type: string
  min?: number
  max?: number
  cycle_start?: string
  cycle_interval?: number
  cycle_unit?: string
  duration?: number
  cover: number
  ignore?: Record<number, boolean>
}
export interface AlertRule {
  id: number
  name: string
  rules_raw?: string
  rules?: Rule[]
  notification_group_id: number
  trigger_mode: number
  enable?: boolean
  created_at?: string
}
export interface AlertRuleForm {
  name: string
  rules: Rule[]
  notification_group_id: number
  trigger_mode: number
  enable: boolean
}

// ───────── 通知 ─────────
export const NOTIFICATION_METHOD = { GET: 1, POST: 2 } as const
export const NOTIFICATION_TYPE = { JSON: 1, FORM: 2 } as const
export interface Notification {
  id: number
  name: string
  url: string
  request_method: number
  request_type: number
  request_header: string
  request_body: string
  verify_tls?: boolean
  format_metric_units?: boolean
  created_at?: string
}
export interface NotificationForm {
  name: string
  url: string
  request_method: number
  request_type: number
  request_header?: string
  request_body?: string
  verify_tls?: boolean
  skip_check?: boolean
  format_metric_units?: boolean
}
export interface NotificationGroup {
  id: number
  name: string
}
export interface NotificationGroupResponseItem {
  group: NotificationGroup
  notifications: number[]
}
export interface NotificationGroupForm {
  name: string
  notifications: number[]
}

// ───────── 用户 ─────────
export const ROLE = { ADMIN: 0, MEMBER: 1 } as const
export interface User {
  id: number
  username: string
  role: number
  agent_secret?: string
  reject_password?: boolean
  created_at?: string
}
export interface UserForm {
  username: string
  password: string
  role: number
}
export interface ProfileForm {
  original_password?: string
  new_username?: string
  new_password?: string
  reject_password?: boolean
}
export interface Profile extends User {
  login_ip?: string
  oauth2_bind?: Record<string, string>
}
export interface OnlineUser {
  user_id?: number
  connected_at?: string
  ip?: string
}

// ───────── WAF ─────────
export const WAF_REASON = {
  LOGIN_FAIL: 1,
  BRUTE_FORCE_TOKEN: 2,
  AGENT_AUTH_FAIL: 3,
  MANUAL: 4,
  BRUTE_FORCE_OAUTH2: 5,
} as const
export interface WAFItem {
  ip?: string
  block_identifier?: number
  block_reason?: number
  block_timestamp?: number
  count?: number
}

// ───────── API 令牌 / PAT ─────────
export interface APITokenView {
  id: number
  name: string
  scopes: string[]
  server_ids?: number[]
  expires_at?: string | null
  last_used_at?: string | null
  last_used_ip?: string
  created_at: string
}
export interface APITokenCreateRequest {
  name: string
  scopes: string[]
  server_ids?: number[]
  expires_in_days?: number
}
export interface APITokenCreateResponse {
  id: number
  name: string
  token: string
  scopes: string[]
  server_ids?: number[]
  expires_at?: string | null
}

// ───────── 设置 ─────────
export interface FrontendTemplate {
  path?: string
  name?: string
  repository?: string
  author?: string
  version?: string
  is_admin?: boolean
  is_official?: boolean
}
export interface Oauth2Config {
  client_id?: string
  client_secret?: string
  endpoint?: { auth_url?: string; token_url?: string }
  scopes?: string[]
  user_info_url?: string
  user_id_path?: string
}
export interface Setting {
  language?: string
  site_name?: string
  custom_code?: string
  custom_code_dashboard?: string
  install_host?: string
  dashboard_host?: string
  tls?: boolean
  web_real_ip_header?: string
  agent_real_ip_header?: string
  user_template?: string
  install_script_linux?: string
  install_script_windows?: string
  enable_plain_ip_in_notification?: boolean
  enable_ip_change_notification?: boolean
  ip_change_notification_group_id?: number
  cover?: number
  ignored_ip_notification?: string
  oauth2_providers?: string[]
  oauth2?: Record<string, Oauth2Config>
}
export interface SettingForm {
  ignored_ip_notification?: string
  ip_change_notification_group_id?: number
  cover?: number
  site_name?: string
  language?: string
  install_host?: string
  dashboard_host?: string
  custom_code?: string
  custom_code_dashboard?: string
  web_real_ip_header?: string
  agent_real_ip_header?: string
  user_template?: string
  install_script_linux?: string
  install_script_windows?: string
  tls?: boolean
  enable_ip_change_notification?: boolean
  enable_plain_ip_in_notification?: boolean
  oauth2?: Record<string, Oauth2Config>
}
export interface SettingResponse {
  config: Setting
  version?: string
  frontend_templates?: FrontendTemplate[]
  tsdb_enabled?: boolean
}
