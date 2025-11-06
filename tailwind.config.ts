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
        board: {
          light: '#f0d9b5',
          dark: '#b58863',
        },
        piece: {
          white: '#ffffff',
          black: '#2c2c2c',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};

export default config;
