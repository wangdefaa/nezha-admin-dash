// 统一 API 客户端：响应封装解包、CSRF 双提交、鉴权失败回调。
import type { CommonResponse } from "@/types"
import { updateClockSkew } from "./clock"

export const API_BASE = "/api/v1"

export class ApiError extends Error {
  unauthorized: boolean
  constructor(message: string, unauthorized = false) {
    super(message)
    this.name = "ApiError"
    this.unauthorized = unauthorized
  }
}

let onUnauthorized: (() => void) | null = null
export function setOnUnauthorized(fn: () => void) {
  onUnauthorized = fn
}

function readCookie(name: string): string {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))
  return m ? decodeURIComponent(m[1]) : ""
}

const UNSAFE = new Set(["POST", "PATCH", "PUT", "DELETE"])

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (UNSAFE.has(method)) {
    const csrf = readCookie("nz-csrf")
    if (csrf) headers["X-CSRF-Token"] = csrf
  }

  let resp: Response
  try {
    resp = await fetch(API_BASE + path, {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError("网络错误，请检查连接")
  }

  updateClockSkew(resp.headers.get("date"))

  if (resp.status === 401 || resp.status === 403) {
    if (resp.status === 401) onUnauthorized?.()
  }

  let json: CommonResponse<T>
  try {
    json = (await resp.json()) as CommonResponse<T>
  } catch {
    throw new ApiError(`请求失败 (${resp.status})`)
  }

  if (!json.success) {
    const msg = json.error || `请求失败 (${resp.status})`
    const unauth = msg.includes("ApiErrorUnauthorized") || resp.status === 401
    if (unauth) onUnauthorized?.()
    throw new ApiError(unauth ? "登录已失效，请重新登录" : msg, unauth)
  }
  return json.data as T
}

export const apiGet = <T>(path: string) => request<T>("GET", path)
export const apiPost = <T>(path: string, body?: unknown) => request<T>("POST", path, body)
export const apiPatch = <T>(path: string, body?: unknown) => request<T>("PATCH", path, body)
export const apiDelete = <T>(path: string, body?: unknown) => request<T>("DELETE", path, body)

// SWR fetcher：直接返回解包后的 data。
export const swrFetcher = <T>(path: string) => apiGet<T>(path)

// 分页型端点（waf / online-user）返回 {value, pagination}，取 value。
export async function listFetcher<T>(path: string): Promise<T[]> {
  const d = await apiGet<{ value?: T[] } | T[]>(path)
  if (Array.isArray(d)) return d
  return d?.value ?? []
}

// 登录：返回后会自动设置 nz-jwt 与 nz-csrf cookie。
export async function login(username: string, password: string): Promise<void> {
  await apiPost("/login", { username, password })
}
