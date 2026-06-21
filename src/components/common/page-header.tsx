import type { ReactNode } from "react"

export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: string
  desc?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-fg">{title}</h1>
        {desc && <p className="mt-1 text-[13px] text-muted">{desc}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

// 表格卡片外壳：工具条 + 内容。
export function TableCard({
  toolbar,
  children,
  footer,
}: {
  toolbar?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="card-soft overflow-hidden">
      {toolbar && (
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">{toolbar}</div>
      )}
      <div className="overflow-x-auto">{children}</div>
      {footer && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-[12.5px] text-muted">
          {footer}
        </div>
      )}
    </div>
  )
}
