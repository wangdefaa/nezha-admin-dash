import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 复制文本到剪贴板。HTTP(非安全上下文)下 navigator.clipboard 不可用,
// 回退到隐藏 textarea + execCommand;返回是否成功,便于调用方据实提示。
export async function copyText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 继续走下面的回退
    }
  }
  const ta = document.createElement("textarea")
  ta.value = text
  ta.setAttribute("readonly", "")
  ta.style.position = "fixed"
  ta.style.left = "-9999px"
  ta.style.top = "0"
  document.body.appendChild(ta)
  ta.focus()
  ta.select()
  ta.setSelectionRange(0, text.length)
  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    ta.remove()
  }
}
