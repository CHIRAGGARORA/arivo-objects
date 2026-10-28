import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: "#F5F1EA",
        bone: "#EDE7DD",
        sand: "#DCCFBB",
        charcoal: "#2B2A28",
        graphite: "#4A4844",
        terracotta: "#B5654A",
        ochre: "#C89B4A",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        container: "1440px",
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "3px",
      },
      letterSpacing: {
        wide2: "0.08em",
        luxe: "0.22em",
      },
      transitionDuration: {
        400: "400ms",
        1200: "1200ms",
      },
    },
  },
  plugins: [],
};

export default config;
