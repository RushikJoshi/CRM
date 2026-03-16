/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "crm-bg": "#F8FAFC",
        "crm-surface": "#FFFFFF",
        "crm-border": "#E5E7EB",
        "crm-primary": "#2563EB",
        "crm-primary-hover": "#1D4ED8",
        "crm-success": "#22C55E",
        "crm-warning": "#F59E0B",
        "crm-danger": "#EF4444",
        "crm-text": "#111827",
        "crm-text-muted": "#6B7280",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "page-title": ["1.75rem", { lineHeight: "2rem", fontWeight: "700" }],
        "section-title": ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        "meta": ["0.75rem", { lineHeight: "1rem", fontWeight: "500" }],
      },
      boxShadow: {
        "crm-soft": "0 1px 3px 0 rgb(0 0 0 / 0.04)",
        "crm-card": "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
      },
      spacing: {
        "sidebar": "240px",
        "sidebar-collapsed": "80px",
      },
      width: {
        "sidebar": "240px",
        "sidebar-collapsed": "80px",
      },
    },
  },
  plugins: [],
};
