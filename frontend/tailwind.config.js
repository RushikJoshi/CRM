/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'crm-primary': '#22c55e',
        'crm-primary-hover': '#16a34a',
        'crm-accent': '#f5d6c6',
        'crm-sidebar': '#ecfdf5',
        'crm-bg': '#f9fafb',
        'crm-text': '#1f2937',
      },
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}