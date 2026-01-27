/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-prompt)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
  darkMode: "class",
}

