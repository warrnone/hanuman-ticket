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
      keyframes: {
        indeterminate: {
          "0%":   { width: "0%",   marginLeft: "0%" },
          "50%":  { width: "60%",  marginLeft: "20%" },
          "100%": { width: "0%",   marginLeft: "100%" },
        },
      },
      animation: {
        indeterminate: "indeterminate 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
  darkMode: "class",
}