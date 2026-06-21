import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PickOption {
  value: number
  label: string
  desc?: string
}

// 带搜索的多选列表（设计稿 .pick-list / .pick）。
export function MultiSelect({
  options,
  selected,
  onChange,
  searchable = true,
  placeholder = "搜索…",
  emptyText = "暂无可选项",
}: {
  options: PickOption[]
  selected: number[]
  onChange: (next: number[]) => void
  searchable?: boolean
  placeholder?: string
  emptyText?: string
}) {
  const [q, setQ] = useState("")
  const set = useMemo(() => new Set(selected), [selected])
  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase()
    if (!k) return options
    return options.filter(
      (o) => o.label.toLowerCase().includes(k) || o.desc?.toLowerCase().includes(k),
    )
  }, [options, q])

  const toggle = (v: number) => {
    onChange(set.has(v) ? selected.filter((x) => x !== v) : [...selected, v])
  }

  return (
    <div>
      {searchable && (
        <div className="relative mb-2">
          <Search className="ic-sm pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-meta" />
          <input
            className="input with-icon"
            placeholder={placeholder}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}
      <div className="pick-list">
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-[12.5px] text-meta">{emptyText}</div>
        ) : (
          filtered.map((o) => {
            const on = set.has(o.value)
            return (
              <div key={o.value} className={cn("pick", on && "on")} onClick={() => toggle(o.value)}>
                <span
                  className={cn("checkbox")}
                  data-state={on ? "checked" : "unchecked"}
                  aria-checked={on}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="flex-1 truncate text-[13px] text-fg">{o.label}</span>
                {o.desc && <span className="mono text-[12px] text-meta">{o.desc}</span>}
              </div>
            )
          })
        )}
      </div>
      <div className="hint">
        已选 {selected.length} 项{selected.length === 0 && "（不限）"}
      </div>
    </div>
  )
}
