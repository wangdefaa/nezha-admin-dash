import * as React from "react"
import { cn } from "@/lib/utils"

// 原生 select，沿用设计稿 select.input 的样式（含自定义箭头）。
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: { value: string | number; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, children, ...props }, ref) => (
    <select ref={ref} className={cn("input", className)} {...props}>
      {options
        ? options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))
        : children}
    </select>
  ),
)
Select.displayName = "Select"
