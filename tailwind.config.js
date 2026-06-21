/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: { DEFAULT: "var(--surface)", 2: "var(--surface-2)" },
        sidebar: "var(--sidebar)",
        fg: { DEFAULT: "var(--fg)", 2: "var(--fg-2)" },
        muted: "var(--muted)",
        meta: "var(--meta)",
        border: { DEFAULT: "var(--border)", soft: "var(--border-soft)" },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          fg: "var(--accent-fg)",
          subtle: "var(--accent-subtle)",
        },
        success: "var(--success)",
        danger: "var(--danger)",
        warn: "var(--warn)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Display",
          "-apple-system",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      borderColor: { DEFAULT: "var(--border)" },
      boxShadow: {
        md: "var(--shadow-md)",
        pop: "var(--shadow-pop)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
