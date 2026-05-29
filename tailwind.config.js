/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E6F1FB',
          100: '#B5D4F4',
          400: '#85B7EB',
          500: '#378ADD',
          600: '#185FA5',
          700: '#0C447C',
        },
        annotation: {
          linear: '#378ADD',
          diameter: '#7F77DD',
          radius: '#1D9E75',
          angle: '#639922',
          thread: '#BA7517',
          tolerance: '#E24B4A',
          chamfer: '#D4537E',
          thickness: '#D85A30',
          arc: '#888780',
          other: '#378ADD',
        },
        status: {
          qualified: '#1D9E75',
          unqualified: '#E24B4A',
          pending: '#BA7517',
        }
      }
    },
  },
  plugins: [],
}
