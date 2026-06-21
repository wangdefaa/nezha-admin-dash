import { useMemo, useState } from "react"
import useSWR from "swr"
import { MoreHorizontal, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { SearchInput } from "@/components/common/search-input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge, Chip, Dot } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PageHeader, TableCard } from "@/components/common/page-header"
import { EmptyState } from "@/components/common/empty-state"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import RuleBuilderDialog from "@/components/alert-rules/rule-builder-dialog"
import type { PickOption } from "@/components/common/multi-select"
import { swrFetcher } from "@/lib/api"
import { alertRulesApi } from "@/api/resources"
import { toast } from "@/components/ui/sonner"
import { TRIGGER_MODES } from "@/lib/constants"
import type { AlertRule, AlertRuleForm, NotificationGroupResponseItem, Rule, Server } from "@/types"

// AlertRule.rules ?? JSON.parse(rules_raw)，容错。
function ruleCount(rule: AlertRule): number {
  if (rule.rules) return rule.rules.length
  if (!rule.rules_raw) return 0
  try {
    const v = JSON.parse(rule.rules_raw) as Rule[]
    return Array.isArray(v) ? v.length : 0
  } catch {
    return 0
  }
}

const triggerLabel = (mode: number) => TRIGGER_MODES.find((m) => m.value === mode)?.label ?? "—"

// 即时切换 enable 需要回传完整 form。
function toForm(rule: AlertRule, enable: boolean): AlertRuleForm {
  let rules: Rule[] = rule.rules ?? []
  if (!rule.rules && rule.rules_raw) {
    try {
      const v = JSON.parse(rule.rules_raw)
      rules = Array.isArray(v) ? v : []
    } catch {
      rules = []
    }
  }
  return {
    name: rule.name,
    rules,
    notification_group_id: rule.notification_group_id,
    trigger_mode: rule.trigger_mode,
    enable,
  }
}

export default function AlertRulesPage() {
  const { data: rules, isLoading, mutate } = useSWR<AlertRule[]>("/alert-rule", swrFetcher)
  const { data: groups } = useSWR<NotificationGroupResponseItem[]>(
    "/notification-group",
    swrFetcher,
  )
  const { data: servers } = useSWR<Server[]>("/server", swrFetcher)

  const [q, setQ] = useState("")
  const [edit, setEdit] = useState<AlertRule | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [confirm, setConfirm] = useState<AlertRule | null>(null)

  const groupOptions = useMemo(
    () => (groups ?? []).map((g) => ({ value: g.group.id, label: g.group.name })),
    [groups],
  )
  const groupName = (id: number) => groupOptions.find((g) => g.value === id)?.label
  const serverOptions: PickOption[] = useMemo(
    () =>
      (servers ?? []).map((s) => ({
        value: s.id,
        label: s.name,
        desc: s.geoip?.ip?.ipv4_addr || s.geoip?.ip?.ipv6_addr || "",
      })),
    [servers],
  )

  const filtered = useMemo(() => {
    const list = rules ?? []
    const k = q.trim().toLowerCase()
    if (!k) return list
    return list.filter((r) => r.name.toLowerCase().includes(k))
  }, [rules, q])

  const openNew = () => {
    setEdit(null)
    setBuilderOpen(true)
  }
  const openEdit = (rule: AlertRule) => {
    setEdit(rule)
    setBuilderOpen(true)
  }

  const toggleEnable = async (rule: AlertRule, enable: boolean) => {
    try {
      await alertRulesApi.update(rule.id, toForm(rule, enable))
      toast.success(enable ? "已启用规则" : "已停用规则")
      mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败")
    }
  }

  const doDelete = async (rule: AlertRule) => {
    await alertRulesApi.batchDelete([rule.id])
    toast.success("已删除规则")
    mutate()
  }

  const enabledCount = (rules ?? []).filter((r) => r.enable).length

  return (
    <>
      <PageHeader
        title="告警规则"
        desc="按指标阈值触发告警，命中后推送到指定通知组"
        actions={
          <Button variant="primary" size="sm" onClick={openNew}>
            <Plus className="ic-sm" /> 新建规则
          </Button>
        }
      />

      <TableCard
        toolbar={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="按规则名称搜索" />
            <div className="ml-auto">
              <Button variant="ghost" size="icon-sm" onClick={() => mutate()} title="刷新">
                <RefreshCw className="ic-sm" />
              </Button>
            </div>
          </>
        }
        footer={
          <span>
            共 <b className="text-fg">{rules?.length ?? 0}</b> 条 ·{" "}
            <span className="text-success">{enabledCount} 启用</span> ·{" "}
            <span className="text-meta">{(rules?.length ?? 0) - enabledCount} 停用</span>
          </span>
        }
      >
        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-meta">加载中…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="暂无告警规则"
            desc="点击右上角「新建规则」，按 CPU、内存、流量等指标阈值配置告警。"
          />
        ) : (
          <table className="tbl" style={{ minWidth: 880 }}>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>名称</th>
                <th>触发模式</th>
                <th>规则</th>
                <th>通知组</th>
                <th style={{ width: 80 }}>启用</th>
                <th style={{ width: 48 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Dot status={r.enable ? "online" : "offline"} />
                  </td>
                  <td>
                    <div className="nm font-medium text-fg">{r.name}</div>
                  </td>
                  <td>
                    <Badge>{triggerLabel(r.trigger_mode)}</Badge>
                  </td>
                  <td>
                    <Chip>{ruleCount(r)} 条</Chip>
                  </td>
                  <td className="text-fg-2">
                    {groupName(r.notification_group_id) ?? (
                      <span className="text-meta">不发送</span>
                    )}
                  </td>
                  <td>
                    <Switch checked={!!r.enable} onCheckedChange={(v) => toggleEnable(r, v)} />
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="btn btn-ghost btn-icon btn-sm">
                          <MoreHorizontal className="ic-sm" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => openEdit(r)}>
                          <Pencil className="ic-sm" /> 编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem danger onSelect={() => setConfirm(r)}>
                          <Trash2 className="ic-sm" /> 删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      <RuleBuilderDialog
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        rule={edit}
        servers={serverOptions}
        groups={groupOptions}
        onSaved={() => mutate()}
      />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="删除告警规则"
        desc={`确定删除规则「${confirm?.name ?? ""}」？此操作不可恢复。`}
        destructive
        confirmText="删除"
        onConfirm={async () => {
          if (confirm) await doDelete(confirm)
        }}
      />
    </>
  )
}
