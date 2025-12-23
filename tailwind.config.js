
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calm, learning‑focused palette
        surface: "#f8f9fb",          // main app background
        "surface-card": "#ffffff",   // card background (kept slightly brighter)
        "text-main": "#111827",      // primary text
        "text-muted": "#6b7280",     // secondary text

        // Softer brand colors (muted orange + blue)
        "brand-orange": "#f97316",         // primary accent
        "brand-orange-soft": "#fdba74",    // hover / subtle fills
        "brand-blue": "#2563eb",           // links / secondary actions
        "brand-blue-soft": "#bfdbfe",      // soft blue fills
      },
      boxShadow: {
        // Softer, more professional card shadow
        card: "0 8px 20px rgba(15, 23, 42, 0.04)",
      },
      borderRadius: {
        xl: "0.9rem",
      },
    },
  },
  plugins: [],
}
