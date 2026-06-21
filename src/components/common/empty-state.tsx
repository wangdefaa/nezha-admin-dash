import type { ReactNode } from "react"
import { Inbox } from "lucide-react"

export function EmptyState({
  icon,
  title,
  desc,
}: {
  icon?: ReactNode
  title: string
  desc?: string
}) {
  return (
    <div className="empty-state">
      <div className="ico">{icon ?? <Inbox className="ic-lg" />}</div>
      <div className="text-[13.5px] font-medium text-fg-2">{title}</div>
      {desc && <div className="mt-1 max-w-sm text-[12.5px] text-meta">{desc}</div>}
    </div>
  )
}
