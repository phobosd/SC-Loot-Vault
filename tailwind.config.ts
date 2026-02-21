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
        background: "var(--background)",
        foreground: "var(--foreground)",
        sc: {
          blue: "var(--sc-blue)",
          gold: "#E0B130",
          red: "#FF4D4D",
          green: "#00FFC2",
          surface: "var(--sc-surface)",
          border: "var(--sc-border)",
        }
      },
      backgroundImage: {
        "sc-gradient": "linear-gradient(180deg, #0A0A12 0%, #1A1A2A 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
