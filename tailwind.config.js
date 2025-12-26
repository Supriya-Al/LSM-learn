
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'hero': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '900' }],
        'hero-md': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '900' }],
        'section': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'section-md': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'card-title': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        'card-title-md': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
      },
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
      letterSpacing: {
        'tight': '-0.03em',
        'tighter': '-0.02em',
        'tightest': '-0.015em',
      },
    },
  },
  plugins: [],
}
