import { z } from "zod"

/**
 * 公开备注（public_note）的 zod schema —— 哪吒约定，后端存为纯字符串（JSON）。
 * - 所有字段为字符串、可为空
 * - autoRenewal / IPv4 / IPv6 取 "0" 或 "1"
 * - cycle 取 Day/Week/Month/Year
 * - 日期可为空、ISO 形式，或特殊值 "0000-00-00T23:59:59+08:00"（永不过期）
 */
export const PublicNoteSchema = z.object({
  billingDataMod: z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      autoRenewal: z.string().optional(),
      cycle: z.string().optional(),
      amount: z.string().optional(),
    })
    .optional(),
  planDataMod: z
    .object({
      bandwidth: z.string().optional(),
      trafficVol: z.string().optional(),
      trafficType: z.string().optional(),
      IPv4: z.string().optional(),
      IPv6: z.string().optional(),
      networkRoute: z.string().optional(),
      extra: z.string().optional(),
    })
    .optional(),
})

export type PublicNote = z.infer<typeof PublicNoteSchema>

export const defaultPublicNote: PublicNote = {}

// 解析字符串为 PublicNote；非合法 JSON 或校验失败时返回默认空对象。
export const parsePublicNote = (s?: string): PublicNote => {
  if (!s) return defaultPublicNote
  try {
    const parsed = PublicNoteSchema.safeParse(JSON.parse(s))
    return parsed.success ? parsed.data : defaultPublicNote
  } catch {
    return defaultPublicNote
  }
}

// 检测初始模式：空或严格匹配 schema 的 JSON → "structured"；否则（自由文本等）→ "raw"。
export const detectPublicNoteMode = (s?: string): "structured" | "raw" => {
  if (!s) return "structured"
  try {
    return PublicNoteSchema.strict().safeParse(JSON.parse(s)).success ? "structured" : "raw"
  } catch {
    return "raw"
  }
}

// 按路径不可变更新，路径形如 "billingDataMod.startDate"。
export const applyPublicNotePatch = (
  obj: PublicNote,
  path: string,
  value: string | undefined,
): PublicNote => {
  const keys = path.split(".")
  const draft = structuredClone(obj) as Record<string, unknown>
  let cur = draft
  for (let i = 0; i < keys.length - 1; i++) {
    const next = { ...((cur[keys[i]] as Record<string, unknown>) ?? {}) }
    cur[keys[i]] = next
    cur = next
  }
  cur[keys[keys.length - 1]] = value
  return draft as PublicNote
}

// 切换 endDate 的「永不过期」特殊值。
export const toggleEndNoExpiry = (obj: PublicNote): PublicNote => {
  const NO_EXPIRY = "0000-00-00T23:59:59+08:00"
  const current = obj.billingDataMod?.endDate
  return applyPublicNotePatch(obj, "billingDataMod.endDate", current === NO_EXPIRY ? "" : NO_EXPIRY)
}

// 序列化为字符串：账单与套餐均为空时返回空串，避免存入无意义的 "{}"。
export const serializePublicNote = (obj: PublicNote): string => {
  const hasBilling = obj.billingDataMod && Object.values(obj.billingDataMod).some(Boolean)
  const hasPlan = obj.planDataMod && Object.values(obj.planDataMod).some(Boolean)
  return hasBilling || hasPlan ? JSON.stringify(obj) : ""
}
