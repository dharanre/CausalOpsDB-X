/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          base: "#0B0E12",
          panel: "#12171D",
          surface: "#191F27",
          border: "#28313A",
          hover: "#222B36",
        },
        text: {
          primary: "#E9EEF2",
          secondary: "#98A5B3",
          muted: "#6B7A8A",
        },
        accent: {
          lime: "#C7F36B",
          limeHover: "#B3E055",
          cyan: "#64D8F5",
          cyanHover: "#4BC2E0",
          amber: "#F59E0B",
          red: "#EF4444",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "Consolas", "monospace"],
      }
    },
  },
  plugins: [],
}
