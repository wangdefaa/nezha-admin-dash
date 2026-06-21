import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"
import prettier from "eslint-config-prettier"

export default tseslint.config(
  { ignores: ["dist", "node_modules"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // 仅启用经典 hooks 规则；不启用 react-hooks v7 的实验性 React Compiler 规则
      //（immutability / set-state-in-effect 对现有代码误报多、需重构，可日后单独开启）
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // 允许三元 / 短路表达式用于副作用，如 cond ? a() : b()
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  // shadcn/ui 组件与 store 的 context 文件常导出 variants / hook 等非组件成员，放宽 fast-refresh 约束
  {
    files: ["src/components/ui/**/*.{ts,tsx}", "src/store/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  // 关闭与 Prettier 冲突的格式类规则，放最后生效
  prettier,
)
