/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    // Container centralizado e com padding diferente por breakpoint
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.25rem",
        md: "2rem",
        lg: "3rem",
        xl: "4rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },

    extend: {
      // Breakpoint extra para ecrãs muito pequenos
      screens: {
        xs: "375px",
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },

      colors: {
        brand: {
          purple: "#623aa2",       // roxo principal
          "purple-soft": "#f3e9ff",
          orange: "#e85d04",
          "orange-hover": "#d05000",
          dark: "#0f172a",
        },
      },

      boxShadow: {
        card: "0 12px 30px rgba(15, 23, 42, 0.08)",
        input: "0 1px 2px 0 rgba(15, 23, 42, 0.06)",
      },

      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
