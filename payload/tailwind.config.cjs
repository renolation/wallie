/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
      extend: {
          colors: {
              "primary": "#00ADB5",
              "primary-hover": "#008c93",
              "background-dark": "#222831",
              "surface": "#393E46",
              "text-main": "#EEEEEE",
              "text-muted": "#A0A0A0",
          },
          fontFamily: {
              "display": ["Inter", "sans-serif"]
          },
          borderRadius: {
              "DEFAULT": "0.25rem",
              "lg": "0.5rem",
              "xl": "0.75rem",
              "2xl": "1rem",
              "full": "9999px"
          },
      },
  },
  plugins: [],
}
