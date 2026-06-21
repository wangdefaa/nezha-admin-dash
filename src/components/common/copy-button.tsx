import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CopyButton({
  text,
  className,
  size = "icon-sm",
  variant = "ghost",
  label,
}: {
  text: string
  className?: string
  size?: ButtonProps["size"]
  variant?: ButtonProps["variant"]
  label?: string
}) {
  const [done, setDone] = useState(false)
  return (
    <Button
      type="button"
      variant={variant}
      size={label ? "sm" : size}
      className={className}
      onClick={async (e) => {
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          const ta = document.createElement("textarea")
          ta.value = text
          document.body.appendChild(ta)
          ta.select()
          document.execCommand("copy")
          ta.remove()
        }
        setDone(true)
        setTimeout(() => setDone(false), 1400)
      }}
    >
      {done ? <Check className={cn("ic-sm", "text-success")} /> : <Copy className="ic-sm" />}
      {label && <span>{done ? "已复制" : label}</span>}
    </Button>
  )
}
