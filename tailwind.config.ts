import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        'senior-sm': '18px',
        'senior-base': '20px',
        'senior-lg': '24px',
        'senior-xl': '28px',
        'senior-2xl': '32px',
        'senior-3xl': '36px',
      },
    },
  },
  plugins: [],
};
export default config;
