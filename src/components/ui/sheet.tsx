import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// 已统一为居中对话框（复用 .dialog flexcol 样式）；组件名沿用 Sheet/SheetBody 等以减少改动面。
export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { width?: number }
>(({ className, children, width, style, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="overlay" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn("dialog flexcol", className)}
      style={{ ...(width ? { width } : {}), ...style }}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
SheetContent.displayName = "SheetContent"

export function SheetHeader({
  title,
  desc,
  className,
}: {
  title: React.ReactNode
  desc?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 border-b border-border px-5 py-4",
        className,
      )}
    >
      <div>
        <DialogPrimitive.Title className="text-[15px] font-semibold text-fg">
          {title}
        </DialogPrimitive.Title>
        {desc && (
          <DialogPrimitive.Description className="mono mt-0.5 text-[12px] text-meta">
            {desc}
          </DialogPrimitive.Description>
        )}
      </div>
      <DialogPrimitive.Close className="btn btn-ghost btn-icon btn-sm -mr-1.5" aria-label="关闭">
        <X className="ic-sm" />
      </DialogPrimitive.Close>
    </div>
  )
}

export function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 space-y-4 overflow-y-auto px-5 py-4", className)} {...props} />
}
export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border px-5 py-3.5",
        className,
      )}
      {...props}
    />
  )
}
