export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        midnight: "#101820",
        ember: "#ef4444",
        aurora: "#0f766e",
        saffron: "#f59e0b"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(15, 118, 110, 0.18)"
      }
    }
  },
  plugins: []
};
