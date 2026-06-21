import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  // 滑块由 CSS .switch::after 绘制，无需渲染 Thumb。
  <SwitchPrimitive.Root ref={ref} className={cn("switch", className)} {...props} />
))
Switch.displayName = "Switch"
