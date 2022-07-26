/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        DEFAULT: "sans",
        sans: [
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
          "sans-serif",
        ],
        mono: [
          '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New"',
          "monospace",
        ],
      },
      colors: {
        white: "#FFFFFF",
        black: "#000000",
        gold: {
          800: "#322f23",
        },
        gray: {
          50: "#F8F9FC",
          100: "#EDEFF5",
          200: "#CFD3DD",
          300: "#9699A5",
          400: "#6B6F7D",
          500: "#5A5D6C",
          600: "#484C5A",
          700: "#363946",
          750: "#2A2D39",
          800: "#21242F",
          850: "#10131C",
          900: "#0A0E17",
        },
        green: {
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#56dd7f",
          500: "#16A34A",
          600: "#16A34A",
          700: "#15803D",
          500: "#166534",
          900: "#14532D",
        },
        blue: {
          50: "#EAF2FC",
          100: "#DBE9FD",
          200: "#C0D5FB",
          300: "#6999F8",
          400: "#2D64EF",
          500: "#1243F2",
          600: "#1933C6",
          700: "#082A98",
          500: "#011C67",
          900: "#010D3F",
        },
        orange: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
          500: "#9A3412",
          900: "#7C2D12",
        },
        red: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          500: "#991B1B",
          900: "#7F1D1D",
        },
        overlay: {
          800: "rgba(33, 36, 47, 0.8)",
          900: "rgba(10, 14, 23, 0.8)",
        },
      },
      boxShadow: {
        "inset-border": "inset 0px -1px 0px #21242F",
      },
      animation: {
        "fade-in": "fadeIn 150ms ease-out 1",
        "fade-in-up": "fadeInUp 200ms ease-out 1",
        "pulse-slow": "pulse 3s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(1%) scale(1)" },
          "100%": { opacity: "1", transform: "translateY(0%) scale(1)" },
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};
