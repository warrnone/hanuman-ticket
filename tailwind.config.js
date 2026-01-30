/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-prompt)", "sans-serif"], // หรือ --font-inter
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
  darkMode: "class",
}