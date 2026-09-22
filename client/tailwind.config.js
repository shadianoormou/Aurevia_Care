/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#edf8f5",
          100: "#d2eee5",
          200: "#a7ddce",
          300: "#78c7b5",
          400: "#4dab96",
          500: "#2d8c79",
          600: "#1d6e61",
          700: "#16584e",
          800: "#123f3b",
          900: "#0a2828",
        },
        accent: {
          50: "#fdf8ec",
          100: "#f8edcf",
          200: "#eed8a0",
          300: "#dfbd6a",
          400: "#c99f43",
          500: "#ad812f",
          600: "#8d6422",
          700: "#72501c",
        },
      },
      fontFamily: {
        sans: ["Manrope", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
