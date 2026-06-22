import { useEffect, useRef, useState } from "react"
import { FileArchive, UploadCloud, X } from "lucide-react"
import { Sheet, SheetBody, SheetContent, SheetFooter, SheetHeader } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/sonner"
import { themeApi } from "@/api/resources"
import { bytes } from "@/lib/format"
import { cn } from "@/lib/utils"

type Mode = "upload" | "github"

// 新增主题：上传 zip 包或从 GitHub release 拉取，可标记为管理端主题。同名上传会覆盖更新。
export function ThemeEditSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [mode, setMode] = useState<Mode>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [repo, setRepo] = useState("")
  const [asset, setAsset] = useState("")
  const [name, setName] = useState("")
  const [version, setVersion] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setMode("upload")
      setFile(null)
      setRepo("")
      setAsset("")
      setName("")
      setVersion("")
      setIsAdmin(false)
    }
  }, [open])

  // 校验失败抛错，由 save 的 catch 统一 toast，避免误报“已保存”。
  const submit = async () => {
    if (mode === "upload") {
      if (!file) throw new Error("请选择主题 zip 文件")
      await themeApi.uploadZip(file, { version: version.trim(), isAdmin })
    } else {
      if (!repo.trim() || !asset.trim()) throw new Error("请填写仓库地址与资产文件名")
      await themeApi.createGithub({
        github_repo: repo.trim(),
        release_asset: asset.trim(),
        name: name.trim() || undefined,
        is_admin: isAdmin,
      })
    }
  }

  const save = async () => {
    setBusy(true)
    try {
      await submit()
      toast.success("已保存主题")
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        <SheetHeader title="新增主题" desc="上传 zip 包或从 GitHub release 拉取" />
        <SheetBody>
          <div className="flex gap-2">
            <Button
              variant={mode === "upload" ? "primary" : "outline"}
              size="sm"
              onClick={() => setMode("upload")}
            >
              上传 ZIP
            </Button>
            <Button
              variant={mode === "github" ? "primary" : "outline"}
              size="sm"
              onClick={() => setMode("github")}
            >
              GitHub Release
            </Button>
          </div>

          {mode === "upload" ? (
            <>
              <div>
                <Label>主题 ZIP 包</Label>
                <FileDropzone file={file} onChange={setFile} />
                <p className="mt-1 text-[11.5px] text-meta">
                  主题名取压缩包文件名；同名上传将覆盖更新。
                </p>
              </div>
              <div>
                <Label>版本号（可选）</Label>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="例如 v1.0.0"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label>GitHub 仓库</Label>
                <Input
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder="owner/repo 或完整 URL"
                />
              </div>
              <div>
                <Label>Release 资产文件名</Label>
                <Input
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  placeholder="例如 dist.zip"
                />
              </div>
              <div>
                <Label>主题名称（可选）</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="留空则使用仓库名"
                />
              </div>
              <p className="text-[11.5px] text-meta">
                后台将拉取该仓库最新 release 的指定资产并解压入库。
              </p>
            </>
          )}

          <label className="flex items-center justify-between gap-3 pt-1">
            <span>
              <span className="block text-[13px] text-fg">管理端主题</span>
              <span className="block text-[11.5px] text-meta">
                开启表示后台管理界面主题，否则为访客状态页主题。
              </span>
            </span>
            <Switch checked={isAdmin} onCheckedChange={setIsAdmin} />
          </label>
        </SheetBody>
        <SheetFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button variant="primary" onClick={save} disabled={busy}>
            {busy ? "保存中…" : "保存"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

type DropAreaProps = {
  over: boolean
  setOver: (v: boolean) => void
  onPick: (f?: File | null) => void
  onOpen: () => void
}

// FileDropzone 拖拽/点击上传区：空态显示拖拽提示，选中后展示文件名与大小。
function FileDropzone({
  file,
  onChange,
}: {
  file: File | null
  onChange: (f: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const pick = (f?: File | null) => {
    if (f && !f.name.toLowerCase().endsWith(".zip")) return toast.error("仅支持 .zip 文件")
    onChange(f ?? null)
  }
  const clear = () => {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        hidden
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {file ? (
        <SelectedFile file={file} onClear={clear} />
      ) : (
        <DropArea
          over={over}
          setOver={setOver}
          onPick={pick}
          onOpen={() => inputRef.current?.click()}
        />
      )}
    </div>
  )
}

// DropArea 空态拖拽区：拖拽悬停时靛紫高亮。
function DropArea({ over, setOver, onPick, onOpen }: DropAreaProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onPick(e.dataTransfer.files?.[0])
      }}
      className={cn(
        "flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed px-4 py-6 text-center transition-colors",
        over
          ? "border-accent bg-accent-subtle"
          : "border-border hover:border-accent hover:bg-surface-2",
      )}
    >
      <UploadCloud className="h-6 w-6 text-meta" />
      <span className="text-[13px] text-fg">点击选择，或拖拽 ZIP 到此</span>
      <span className="text-[11.5px] text-meta">.zip · 最大 300MB</span>
    </button>
  )
}

// SelectedFile 已选文件卡片：文件名 + 大小 + 清除。
function SelectedFile({ file, onClear }: { file: File; onClear: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-surface-2 px-3 py-2.5">
      <FileArchive className="h-5 w-5 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] text-fg">{file.name}</div>
        <div className="text-[11.5px] text-meta">{bytes(file.size)}</div>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="btn btn-ghost btn-icon btn-sm shrink-0"
        aria-label="清除"
      >
        <X className="ic-sm" />
      </button>
    </div>
  )
}
