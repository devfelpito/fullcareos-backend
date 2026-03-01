import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3d3d3d",
        "primary-light": "#5c5c5c",
        accent: "#0066ff",
        "accent-hover": "#0052cc",
        "ice-white": "#f8f9fa",
        "ice-border": "#e9ecef",
      },
    },
  },
  plugins: [],
} satisfies Config;
