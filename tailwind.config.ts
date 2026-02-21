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
          blue: "#00D1FF",
          gold: "#E0B130",
          red: "#FF4D4D",
          green: "#00FFC2",
          surface: "rgba(10, 10, 20, 0.85)",
          border: "rgba(0, 209, 255, 0.2)",
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
