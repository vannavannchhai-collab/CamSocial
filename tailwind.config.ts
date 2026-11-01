import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        khmer: ['"Kantumruy Pro"', '"Noto Sans Khmer"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          50: "#f4f6fb", 100: "#e6eaf4", 200: "#c8d1e6", 300: "#9daad1",
          400: "#6d7cb5", 500: "#4e5d9c", 600: "#3d4a80", 700: "#333d68",
          800: "#2b324f", 900: "#1b2038", 950: "#111527",
        },
        gold: {
          50: "#fdf8ec", 100: "#faedc9", 200: "#f5d98f", 300: "#efc055",
          400: "#eaa92e", 500: "#d98e18", 600: "#bc6c11", 700: "#954e12",
          800: "#7a3e16", 900: "#673416",
        },
        teal: {
          500: "#0f9b8e", 600: "#0b7d73", 700: "#0a635c",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,21,39,.06), 0 8px 24px -12px rgba(17,21,39,.18)",
        pop: "0 12px 48px -12px rgba(17,21,39,.35)",
      },
      borderRadius: { xl2: "1.125rem" },
    },
  },
  plugins: [],
};
export default config;
