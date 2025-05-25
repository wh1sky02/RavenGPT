import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // ChatGPT-style dark theme colors
        dark: {
          50: '#f8f8f8',
          100: '#ececec',
          200: '#d1d1d1',
          300: '#b4b4b4',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          750: '#424242',
          800: '#454545',
          850: '#3a3a3a',
          900: '#2d2d2d',
          925: '#262626',
          950: '#212121',
          975: '#1a1a1a',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config;
