# CLAUDE.md

哪吒探针**管理后台前端 v2**:React 19 + TypeScript + Vite 6 + TailwindCSS + shadcn/ui(Radix)。
作为单页应用挂在 `/dashboard` 路径下,对接后端 `/api/v1`,构建产物直接 embed 进 Go 后端二进制(替代旧版管理前端)。视觉对标 Linear:克制、紧凑、信息密度高,内置亮/暗双主题。

## 常用命令

```bash
npm install
npm run dev      # 本地开发(端口 5174),代理 /api 与 /ws → http://127.0.0.1:8008
npm run build    # tsc -b 类型检查 + vite build,产物输出到 dist/
npm run lint     # eslint .   (lint:fix 自动修;format 用 prettier)
```

构建产物 `dist/` 由后端通过 `go embed` 打包。后端期望嵌入目录为 `cmd/dashboard/admin-dist`,集成时把 `dist/` 内容拷贝/软链到该目录(`vite.config.ts` 当前 `base:"/dashboard/"`,未直接写 outDir 到后端目录,部署脚本负责搬运)。改动路由/导航后务必 `npm run build` 确认 tsc 通过。

## 技术栈

- **React 19** + **TypeScript**(strict + noUnusedLocals/Parameters)+ **Vite 6**,别名 `@` → `src/`
- **TailwindCSS 3** + **Radix UI**(shadcn/ui 模式,原语在 `src/components/ui`)
- **SWR** 数据请求 · **Zustand** 状态(auth 用 Context+SWR,theme 用 zustand)· **react-hook-form** + **zod** 表单
- **react-router-dom 6**(`createBrowserRouter`,basename `/dashboard`)· **lucide-react** 图标 · **sonner** toast · **@tanstack/react-table**
- 代码风格:Prettier(无分号、双引号、printWidth 100、trailingComma all、`prettier-plugin-tailwindcss` 自动排序 class)

## 目录结构与架构

```
src/
  main.tsx              # 路由表(createBrowserRouter) + Provider 挂载
  lib/
    api.ts              # 统一请求封装(API_BASE/CSRF/解包/fetcher)
    clock.ts            # 服务器时钟偏差校正(serverNow)
    nav.tsx             # 侧边栏导航菜单 NAV(路由须与后端 frontendPageUrlRegistry 对齐)
    format.ts           # bytes/speed/percent/uptime/isOnline/timeAgo/flag 等展示格式化
    constants.ts        # 业务枚举标签(METRIC_TYPES/SERVICE_TYPES/SCOPE_GROUPS…)
    utils.ts            # cn() / copyText() 等
  api/resources.ts      # 各资源的写操作 API(create/update/batchDelete…)
  types/index.ts        # 全部 TS 类型,与后端 model/*_api.go 对齐
  store/                # auth.tsx(AuthProvider/useAuth) · theme.ts(useTheme)
  components/
    ui/                 # shadcn 原语(button/input/sheet/dialog/select/badge…)
    layout/             # app-layout(鉴权守卫+Outlet) · sidebar · topbar
    common/             # page-header/TableCard · confirm-dialog · multi-select · empty-state…
    <domain>/           # 各业务域的编辑抽屉/对话框(servers/groups/services/…)
  pages/                # 每个路由一个页面文件(servers/services/alert-rules/settings…)
```

**分层职责**:`pages/` 用 SWR 读数据 + 编排;写操作调 `api/resources.ts`;表单 UI 放 `components/<domain>/*-sheet.tsx` 或 `*-dialog.tsx`;所有类型集中在 `types/index.ts`。

**新增一个 CRUD 页的范式**(按顺序):

1. `types/index.ts` — 加 `Xxx`(响应)与 `XxxForm`(提交)接口
2. `api/resources.ts` — 加 `xxxApi = { create, update, batchDelete }`,走 `apiPost/apiPatch`
3. `components/<domain>/xxx-edit-sheet.tsx` — 用 `Sheet`+`SheetBody/Footer` 写编辑抽屉(参考 `groups/group-edit-sheet.tsx`)
4. `pages/xxx.tsx` — `useSWR(key, swrFetcher)` 读列表,用 `PageHeader`+`TableCard`+`.tbl` 渲染,行内 `DropdownMenu`(编辑/删除),`ConfirmDialog` 二次确认,`toast` 反馈,成功后 `mutate()`
5. `main.tsx` — 在 `/` 的 children 里加 `{ path: "xxx", element: <XxxPage /> }`
6. `lib/nav.tsx` — 在 `NAV` 加菜单项(`adminOnly` 控制仅管理员可见);**路由路径必须与后端注册的前端页面路由一致,否则硬刷新会 404**

## API 约定(`src/lib/api.ts`)

- `API_BASE = "/api/v1"`;`apiGet/apiPost/apiPatch/apiDelete<T>` 直接返回**解包后**的 `data`
- 统一响应 `{ success, data, error }`:`success=false` 时抛 `ApiError(error)`
- **CSRF 双提交**:POST/PATCH/PUT/DELETE 自动读 Cookie `nz-csrf` 写入请求头 `X-CSRF-Token`;请求带 `credentials:"include"`
- **鉴权**:JWT 走 Cookie `nz-jwt`(登录后端 set);PAT 走 Bearer(后端支持,前端主要用 Cookie 会话)。401/`ApiErrorUnauthorized` 触发 `setOnUnauthorized` → 跳 `/dashboard/login`
- **SWR**:`swrFetcher(path)` 作为 fetcher,SWR key 即接口路径字符串(如 `useSWR<Server[]>("/server", swrFetcher)`);列表页常配 `refreshInterval`(servers 页 4000ms 轮询)
- **分页端点**(waf / online-user)返回 `{ value, pagination }`,用 `listFetcher<T>` 自动取 `value`
- 鉴权状态用 `useAuth()`(`profile / isAdmin / login / logout`);主题用 `useTheme()`

## 设计风格约定

- **Linear 精准风**:克制、紧凑、信息密度高;**0 渐变、圆角 6–8px**;冷调中性灰 + 靛紫(`--accent`)克制强调
- 设计 token 全在 `src/index.css`(`:root` 亮色 / `.dark` 暗色 CSS 变量),Tailwind 颜色映射这些变量(`bg/surface/fg/muted/meta/border/accent/success/danger/warn`)。`darkMode:"class"`,切换由 `theme.ts` toggle `<html class="dark">` 并存 `localStorage`
- 复用 `index.css` 内的组件类:`.tbl`(表格)、`.btn`/`.btn-ghost`/`.btn-icon`、`.card-soft`、`.ic-sm`(图标尺寸)、`.text-fg/.text-muted/.text-meta` 等;字号偏小(13px 正文)。优先用这些约定类而非临时拼 class
- 字体:Inter(正文)/ JetBrains Mono(等宽)

## 关键坑

- **在线判定依赖服务器时钟**:不能用本机 `Date.now()`。`api.ts` 每次响应用 HTTP `Date` 头校正偏差(`updateClockSkew`),业务里判在线/相对时间一律用 `format.ts` 的 `isOnline()/timeAgo()`(内部用 `clock.ts` 的 `serverNow()`)。本机时钟偏差几十秒就会把在线机器误判离线
- **路由对齐后端**:`nav.tsx` 注释强调路由须与后端 `controller.go` 的 `frontendPageUrlRegistry` 对齐,否则深链/刷新 404
- **函数式编辑抽屉**:编辑/新建共用同一 Sheet,用 `state: {id:null}` 区分新建(`id===null`)与编辑;`useEffect([state])` 回填表单
- ESLint 只开经典 hooks 规则(未启用 react-hooks v7 实验规则);`components/ui/**` 与 `store/**` 放宽 `react-refresh/only-export-components`
