# Nezha Admin Dash

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev) [![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev) [![License: Apache 2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](../nezha/LICENSE)

哪吒监控的全新管理后台,为精简版面板 [wangdefaa/nezha](https://github.com/wangdefaa/nezha) 量身打造,替代旧版管理前端。界面对标 [Linear](https://linear.app) 的设计语言:克制、紧凑、信息密度高,内置亮 / 暗双主题。

## 技术栈

- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS** + **Radix UI**(shadcn/ui 模式)
- **SWR** 数据请求 · **Zustand** 状态管理 · **react-hook-form** + **zod** 表单校验
- **react-router-dom** 路由 · **lucide-react** 图标 · **sonner** 通知 · **@tanstack/react-table** 表格

## 功能

覆盖面板全部管理域:服务器、服务器分组、服务拨测、告警规则、通知方式 / 通知组、用户、WAF 防火墙、在线用户、API 令牌、OAuth2 登录、系统设置。

## 开发

```bash
npm install
npm run dev        # 本地开发服务器
npm run build      # 类型检查(tsc -b)+ 生产构建
npm run preview    # 预览生产产物
```

## 对接说明

- API 基址 `/api/v1`,统一响应结构 `{ success, data, error }`
- 鉴权:JWT(Cookie `nz-jwt`)或 PAT(Bearer);写请求带 CSRF 双提交(`nz-csrf` Cookie ↔ `X-CSRF-Token` 头)
- 接口定义见后端 [wangdefaa/nezha](https://github.com/wangdefaa/nezha) 的 `cmd/dashboard/controller`

## 许可

[Apache-2.0](https://github.com/wangdefaa/nezha/LICENSE),与主项目一致。
