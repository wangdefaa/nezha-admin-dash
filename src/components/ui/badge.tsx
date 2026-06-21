import * as React from "react"
import { cn } from "@/lib/utils"

export function Badge({
  className,
  soft,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { soft?: boolean }) {
  return <span className={cn("badge", soft && "badge-soft", className)} {...props} />
}

export function Chip({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "accent" | "more" }) {
  return (
    <span
      className={cn(
        "chip",
        variant === "accent" && "accent",
        variant === "more" && "more",
        className,
      )}
      {...props}
    />
  )
}

export function Dot({ status }: { status: "online" | "offline" | "warn" }) {
  return (
    <span
      className={cn(
        "dot",
        status === "online" && "dot-online",
        status === "offline" && "dot-offline",
        status === "warn" && "dot-warn",
      )}
    />
  )
}
