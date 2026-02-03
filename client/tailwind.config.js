export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          50: "#fffaf2",
          100: "#f3e6d4",
          200: "#e4d2b6",
          300: "#d3bf9f",
          800: "#2b241b"
        },
        arena: {
          pink: "#f05a6e",
          violet: "#4f6ef2",
          cyan: "#2bb3d4",
          gold: "#f2b244",
          green: "#4bbf7a",
          red: "#e45757",
          sand: "#f0d9b5",
          ink: "#2b241b"
        }
      },
      fontFamily: {
        display: ["'Fredoka'", "ui-sans-serif", "system-ui"],
        body: ["'Manrope'", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        paper: "0 20px 45px rgba(109, 88, 64, 0.12)",
        tile: "0 10px 20px rgba(109, 88, 64, 0.16)",
        glow: "0 14px 24px rgba(244, 139, 139, 0.35)"
      },
      borderRadius: {
        bubble: "26px",
        tile: "22px"
      }
    }
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")]
};
