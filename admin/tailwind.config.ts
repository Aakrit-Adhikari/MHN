import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#003366",
          deep: "#001A33",
          light: "#1E3A5F"
        },
        gold: {
          DEFAULT: "#B8860B",
          light: "#F2B632",
          pale: "#FAEDC4"
        },
        ink: "#0A1929",
        cream: "#FFFBF0"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        serif: ["var(--font-fraunces)", "Fraunces", "serif"]
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px 0 rgba(0,0,0,0.04)"
      }
    }
  },
  plugins: []
};

export default config;
