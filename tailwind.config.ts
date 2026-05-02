import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep midnight palette — heartfelt, intimate, premium
        ink: {
          950: "#070416",
          900: "#0d0820",
          800: "#15102e",
          700: "#1f1742",
          600: "#2a2057",
        },
        // Warm gold — heritage, value, candlelight
        gold: {
          50: "#fdf8ec",
          100: "#fbefcf",
          200: "#f6dc97",
          300: "#eec362",
          400: "#e0a93f",
          500: "#c98e26",
          600: "#a76d1d",
          700: "#85541c",
          800: "#6d441e",
          900: "#5c391d",
        },
        // Cream / parchment — body text, soft hierarchy
        cream: {
          50: "#fefcf7",
          100: "#fbf6e8",
          200: "#f4ecd1",
          300: "#ebdbac",
          400: "#dfc585",
          500: "#d4af37",
        },
        // Rose — emotional accent
        rose: {
          400: "#f4a8a8",
          500: "#e88787",
          600: "#d96868",
        },
      },
      fontFamily: {
        serif: [
          "var(--font-serif)",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "ink-gradient":
          "radial-gradient(ellipse at top, #1f1742 0%, #0d0820 45%, #070416 100%)",
        "gold-shine":
          "linear-gradient(135deg, #f6dc97 0%, #e0a93f 50%, #c98e26 100%)",
        "candle-glow":
          "radial-gradient(circle at 30% 20%, rgba(224, 169, 63, 0.18) 0%, rgba(7, 4, 22, 0) 50%)",
      },
      animation: {
        "fade-up": "fadeUp 0.7s ease-out both",
        "fade-in": "fadeIn 1.2s ease-out both",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        "soft-pulse": "softPulse 4s ease-in-out infinite",
        "slow-drift": "slowDrift 16s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        softPulse: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
        slowDrift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-12px, 8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
