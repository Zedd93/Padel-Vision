import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        bg2: "rgb(var(--bg2) / <alpha-value>)",
        bg3: "rgb(var(--bg3) / <alpha-value>)",
        bg4: "rgb(var(--bg4) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        lime: {
          DEFAULT: "rgb(var(--lime) / <alpha-value>)",
          hover: "rgb(var(--lime2) / <alpha-value>)",
        },
        live: "rgb(var(--live) / <alpha-value>)",
        orange: "rgb(var(--orange) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
      },
      fontFamily: {
        display: ['"Bebas Neue"', "sans-serif"],
        sans: ['"DM Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        card: "12px",
        "card-lg": "16px",
      },
    },
  },
  plugins: [],
};

export default config;
