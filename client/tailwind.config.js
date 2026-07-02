/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Clean healthcare white/green/blue theme
        primary: {
          50: "#eefdf6",
          100: "#d6f9e7",
          200: "#aef1d1",
          300: "#78e3b5",
          400: "#3fce93",
          500: "#18b377",
          600: "#0e9260",
          700: "#0c744e",
          800: "#0d5c40",
          900: "#0b4c36",
        },
        accent: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
