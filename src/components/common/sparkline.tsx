// 极简 SVG 迷你折线图（服务拨测延迟趋势）。
export function Sparkline({
  data,
  width = 120,
  height = 28,
  className,
}: {
  data: number[]
  width?: number
  height?: number
  className?: string
}) {
  const pts = data.filter((d) => Number.isFinite(d))
  if (pts.length < 2) return <span className="text-[11px] text-meta">—</span>
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const span = max - min || 1
  const step = width / (pts.length - 1)
  const path = pts
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 4) - 2).toFixed(1)}`,
    )
    .join(" ")
  return (
    <svg width={width} height={height} className={className} style={{ display: "block" }}>
      <path
        d={path}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  )
}
