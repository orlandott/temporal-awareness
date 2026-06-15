/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // New York Times-style stack: Franklin (open-sourced by NYT) for UI/kickers,
        // Caslon for display headlines, Georgia (NYT's web body) for running text.
        sans: ['"Libre Franklin"', "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ['"Libre Caslon Text"', "Georgia", "Cambria", "Times New Roman", "serif"],
        body: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
      colors: {
        paper: "#fbfaf7", // warm near-white newsprint
        ink: "#121212", // near-black headline/text
        "ink-soft": "#39342e", // warm body text
        rule: "#d8d3c8", // hairline rules
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};
