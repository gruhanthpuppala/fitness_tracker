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
        bg: {
          primary: "#0D0D0D",
          surface: "#1A1A1A",
          elevated: "#242424",
        },
        border: {
          DEFAULT: "#2A2A2A",
        },
        text: {
          primary: "#F5F0EB",
          secondary: "#8A8A8A",
          muted: "#5A5A5A",
        },
        accent: {
          primary: "#C9A96E",
          "primary-hover": "#D4B97E",
          secondary: "#8B9D77",
        },
        status: {
          success: "#8B9D77",
          warning: "#D4A843",
          error: "#B85C5C",
          info: "#6B8CA6",
        },
        toggle: {
          on: "#C9A96E",
          off: "#2A2A2A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "8px",
        input: "6px",
        pill: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
