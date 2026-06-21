import { create } from "zustand"

type Theme = "light" | "dark"

function current(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

function apply(t: Theme) {
  document.documentElement.classList.toggle("dark", t === "dark")
  try {
    localStorage.setItem("nz-theme", t)
  } catch {
    /* ignore */
  }
}

interface ThemeState {
  theme: Theme
  toggle: () => void
  set: (t: Theme) => void
}

export const useTheme = create<ThemeState>((set, get) => ({
  theme: current(),
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark"
    apply(next)
    set({ theme: next })
  },
  set: (t) => {
    apply(t)
    set({ theme: t })
  },
}))
