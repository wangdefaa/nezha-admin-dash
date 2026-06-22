# Nezha Admin Dash

[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev) [![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)](https://vitejs.dev) [![License: Apache 2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/wangdefaa/nezha/blob/master/LICENSE)

[精简版哪吒面板](https://github.com/wangdefaa/nezha) 的管理后台。React 19 + Vite 6 + Tailwind CSS + shadcn/ui,对标 Linear 的克制紧凑风格,内置亮 / 暗双主题。构建产物 embed 进后端二进制。

## 开发

```bash
npm install
npm run dev      # 本地开发(端口 5174,/api 代理到后端 8008)
npm run build    # tsc -b 类型检查 + vite build,产物输出到 dist/
```

## 对接

- API 基址 `/api/v1`,统一响应结构 `{ success, data, error }`
- 鉴权:JWT(Cookie `nz-jwt`)或 PAT(Bearer);写请求带 CSRF 双提交(`nz-csrf` Cookie ↔ `X-CSRF-Token` 头)
- 后端接口定义见 [wangdefaa/nezha](https://github.com/wangdefaa/nezha) 的 `cmd/dashboard/controller`

## 许可

[Apache-2.0](https://github.com/wangdefaa/nezha/blob/master/LICENSE),与主项目一致。
