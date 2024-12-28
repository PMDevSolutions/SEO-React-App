import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background1)",
        background1: "var(--background1)",
        background2: "var(--background2)",
        background3: "var(--background3)",
        background4: "var(--background4)",
        background5: "var(--background5)",
        foreground: "var(--text1)",
        text1: "var(--text1)",
        text2: "var(--text2)",
        text3: "var(--text3)",
        border: "var(--border)",
        greenText: "var(--greenText)",
        redText: "var(--redText)",
        card: {
          DEFAULT: "var(--background2)",
          foreground: "var(--text1)",
        },
        popover: {
          DEFAULT: "var(--background2)",
          foreground: "var(--text1)",
        },
        primary: {
          DEFAULT: "var(--actionPrimaryBackground)",
          foreground: "var(--actionPrimaryText)",
        },
        secondary: {
          DEFAULT: "var(--background2)",
          foreground: "var(--text1)",
        },
        muted: {
          DEFAULT: "var(--background3)",
          foreground: "var(--text3)",
        },
        accent: {
          DEFAULT: "var(--background3)",
          foreground: "var(--text1)",
        },
        destructive: {
          DEFAULT: "var(--redBackground)",
          foreground: "var(--redText)",
        },
        input: "var(--backgroundInput)",
        ring: "var(--border)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;