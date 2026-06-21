import { Toaster as Sonner } from "sonner"

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        style: {
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--fg)",
          borderRadius: "8px",
          fontSize: "13px",
          boxShadow: "var(--shadow-pop)",
        },
      }}
    />
  )
}
export { toast } from "sonner"
