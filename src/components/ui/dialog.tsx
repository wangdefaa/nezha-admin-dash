import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: "default" | "mid" | "wide"
    flexcol?: boolean
    hideClose?: boolean
  }
>(({ className, children, size = "default", flexcol, hideClose, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="overlay" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "dialog",
        size === "mid" && "mid",
        size === "wide" && "wide",
        flexcol && "flexcol",
        className,
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          className="btn btn-ghost btn-icon btn-sm"
          style={{ position: "absolute", top: 12, right: 12 }}
          aria-label="关闭"
        >
          <X className="ic-sm" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
))
DialogContent.displayName = "DialogContent"

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 pb-4 pt-5", className)} {...props} />
}
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-border-soft px-5 py-4",
        className,
      )}
      {...props}
    />
  )
}
export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-[15px] font-semibold text-fg", className)}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"
export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("mt-1 text-[12.5px] text-muted", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"
