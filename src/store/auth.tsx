import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react"
import useSWR from "swr"
import { apiGet, login as loginApi, setOnUnauthorized } from "@/lib/api"
import type { Profile } from "@/types"

interface AuthCtx {
  profile: Profile | undefined
  loading: boolean
  isAdmin: boolean
  error: unknown
  login: (u: string, p: string) => Promise<void>
  logout: () => void
  refresh: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR<Profile>("/profile", apiGet, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  const logout = useCallback(() => {
    // 清掉 cookie 由后端控制；前端跳转登录页即可。
    document.cookie = "nz-jwt=; Max-Age=0; path=/"
    mutate(undefined, { revalidate: false })
    if (!location.pathname.endsWith("/login")) {
      location.href = "/dashboard/login"
    }
  }, [mutate])

  useEffect(() => {
    setOnUnauthorized(() => {
      mutate(undefined, { revalidate: false })
      if (!location.pathname.endsWith("/login")) location.href = "/dashboard/login"
    })
  }, [mutate])

  const login = useCallback(
    async (u: string, p: string) => {
      await loginApi(u, p)
      await mutate()
    },
    [mutate],
  )

  const value = useMemo<AuthCtx>(
    () => ({
      profile: data,
      loading: isLoading,
      isAdmin: data?.role === 0,
      error,
      login,
      logout,
      refresh: () => mutate(),
    }),
    [data, isLoading, error, login, logout, mutate],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error("useAuth must be used within AuthProvider")
  return c
}
