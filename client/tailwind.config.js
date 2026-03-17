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
        // Super Admin SaaS theme (Sky)
        "crm-bg": "#F0F9FF",
        "crm-surface": "#FFFFFF",
        "crm-border": "#E0F2FE",
        "crm-primary": "#38BDF8",
        "crm-primary-hover": "#0EA5E9",
        "crm-success": "#22C55E",
        "crm-warning": "#F59E0B",
        "crm-danger": "#EF4444",
        "crm-text": "#0F172A",
        "crm-text-muted": "#64748B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "page-title": ["1.75rem", { lineHeight: "2rem", fontWeight: "600" }],
        "section-title": ["1rem", { lineHeight: "1.5rem", fontWeight: "600" }],
        "meta": ["0.75rem", { lineHeight: "1rem", fontWeight: "500" }],
      },
      boxShadow: {
        "crm-soft": "0 1px 2px 0 rgb(15 23 42 / 0.04)",
        "crm-card": "0 6px 18px -8px rgb(15 23 42 / 0.12), 0 2px 6px -3px rgb(15 23 42 / 0.08)",
        "crm-glass": "0 8px 30px rgb(15 23 42 / 0.08)",
      },
      spacing: {
        "sidebar": "260px",
        "sidebar-collapsed": "84px",
        "topbar": "64px",
      },
      width: {
        "sidebar": "260px",
        "sidebar-collapsed": "84px",
      },
    },
  },
  plugins: [],
};
