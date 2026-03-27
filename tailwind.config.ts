import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        accent: "var(--accent)",
        card: "var(--card)",
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        subtle: "0 0 0 1px rgba(255,255,255,0.08), 0 10px 40px rgba(0,0,0,0.3)",
      },
      borderRadius: {
        lg: "2px",
        md: "2px",
        sm: "2px",
      },
    },
  },
};

export default config;
