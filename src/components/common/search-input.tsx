import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// 统一列表搜索框：左侧图标固定居中、不遮挡文字（with-icon），
// 固定宽度避免在 flex 工具栏里被 ml-auto 挤压坍缩。
export function SearchInput({
  value,
  onChange,
  placeholder = "搜索…",
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn("relative w-72 shrink-0", className)}>
      <Search className="ic-sm pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-meta" />
      <Input
        className="with-icon"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
