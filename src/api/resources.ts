// 各资源的 API 调用封装。GET 用 SWR key（见各页面 hook），变更走这里。
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload, listFetcher } from "@/lib/api"
import type {
  APITokenCreateRequest,
  APITokenCreateResponse,
  AlertRuleForm,
  NotificationForm,
  NotificationGroupForm,
  OnlineUser,
  ProfileForm,
  ServerForm,
  ServerGroupForm,
  ServiceForm,
  SettingForm,
  SettingResponse,
  Theme,
  ThemeGithubForm,
  UserForm,
  WAFItem,
} from "@/types"

// ───────── 服务器 ─────────
export const serversApi = {
  update: (id: number, f: ServerForm) => apiPatch(`/server/${id}`, f),
  batchDelete: (ids: number[]) => apiPost("/batch-delete/server", ids),
  forceUpdate: (ids: number[]) => apiPost("/force-update/server", ids),
}

// ───────── 服务器分组 ─────────
export const serverGroupsApi = {
  create: (f: ServerGroupForm) => apiPost("/server-group", f),
  update: (id: number, f: ServerGroupForm) => apiPatch(`/server-group/${id}`, f),
  batchDelete: (ids: number[]) => apiPost("/batch-delete/server-group", ids),
}

// ───────── 服务拨测 ─────────
export const servicesApi = {
  create: (f: ServiceForm) => apiPost("/service", f),
  update: (id: number, f: ServiceForm) => apiPatch(`/service/${id}`, f),
  batchDelete: (ids: number[]) => apiPost("/batch-delete/service", ids),
}

// ───────── 告警规则 ─────────
export const alertRulesApi = {
  create: (f: AlertRuleForm) => apiPost("/alert-rule", f),
  update: (id: number, f: AlertRuleForm) => apiPatch(`/alert-rule/${id}`, f),
  batchDelete: (ids: number[]) => apiPost("/batch-delete/alert-rule", ids),
}

// ───────── 通知方式 ─────────
export const notificationsApi = {
  create: (f: NotificationForm) => apiPost("/notification", f),
  update: (id: number, f: NotificationForm) => apiPatch(`/notification/${id}`, f),
  batchDelete: (ids: number[]) => apiPost("/batch-delete/notification", ids),
}

// ───────── 通知组 ─────────
export const notificationGroupsApi = {
  create: (f: NotificationGroupForm) => apiPost("/notification-group", f),
  update: (id: number, f: NotificationGroupForm) => apiPatch(`/notification-group/${id}`, f),
  batchDelete: (ids: number[]) => apiPost("/batch-delete/notification-group", ids),
}

// ───────── 用户 ─────────
export const usersApi = {
  create: (f: UserForm) => apiPost("/user", f),
  batchDelete: (ids: number[]) => apiPost("/batch-delete/user", ids),
}

// ───────── 在线用户 ─────────
export const onlineUsersApi = {
  list: () => listFetcher<OnlineUser>("/online-user"),
  batchBlock: (ips: string[]) => apiPost("/online-user/batch-block", ips),
}

// ───────── WAF ─────────
export const wafApi = {
  list: () => listFetcher<WAFItem>("/waf"),
  batchUnblock: (ips: string[]) => apiPost("/batch-delete/waf", ips),
}

// ───────── API 令牌 ─────────
export const tokensApi = {
  create: (f: APITokenCreateRequest) => apiPost<APITokenCreateResponse>("/api-tokens", f),
  delete: (id: number) => apiDelete(`/api-tokens/${id}`),
}

// ───────── 设置 / 维护 ─────────
export const settingApi = {
  get: () => apiGet<SettingResponse>("/setting"),
  update: (f: SettingForm) => apiPatch("/setting", f),
  maintenance: () => apiPost("/maintenance"),
}

// ───────── 个人资料 / OAuth2 ─────────
export const profileApi = {
  update: (f: ProfileForm) => apiPost("/profile", f),
  oauth2Login: (provider: string) => apiGet<{ redirect?: string }>(`/oauth2/${provider}`),
  oauth2Bind: (provider: string) => apiGet<{ redirect?: string }>(`/oauth2/${provider}?type=2`),
  oauth2Unbind: (provider: string) => apiPost(`/oauth2/${provider}/unbind`),
}

// ───────── 主题 ─────────
export const themeApi = {
  list: () => apiGet<Theme[]>("/theme"),
  uploadZip: (file: File, opts?: { version?: string; isAdmin?: boolean }) => {
    const form = new FormData()
    form.append("file", file)
    if (opts?.version) form.append("version", opts.version)
    if (opts?.isAdmin) form.append("is_admin", "true")
    return apiUpload<number>("/theme/upload", form)
  },
  createGithub: (f: ThemeGithubForm) => apiPost<number>("/theme/github", f),
  refresh: (id: number) => apiPost(`/theme/${id}/refresh`),
  apply: (id: number) => apiPost(`/theme/${id}/apply`),
  batchDelete: (ids: number[]) => apiPost("/batch-delete/theme", ids),
}
