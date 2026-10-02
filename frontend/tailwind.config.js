/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#F5F6F8",
        surface: "#FFFFFF",
        ink: "#161B22",
        muted: "#5B6472",
        line: "#E4E7EC",
        navy: {
          DEFAULT: "#0F1729",
          light: "#1B2740",
        },
        signal: {
          DEFAULT: "#2F5FED",
          dark: "#2347C2",
          light: "#E8EDFD",
        },
        success: { DEFAULT: "#17915A", light: "#E5F6EE" },
        warning: { DEFAULT: "#B5680B", light: "#FCF0DE" },
        critical: { DEFAULT: "#C22B3A", light: "#FBE7E9" },
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 41, 0.06), 0 1px 1px rgba(15, 23, 41, 0.04)",
      },
      borderRadius: {
        md: "10px",
        lg: "14px",
      },
    },
  },
  plugins: [],
};
