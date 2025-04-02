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
          DEFAULT: '#3B8C6E',
          50: '#E8F5F1',
          100: '#C5E6D9',
          200: '#9AD3BE',
          300: '#70BEA3',
          400: '#4FA989',
          500: '#3B8C6E',
          600: '#2E6D55',
          700: '#214F3D',
          800: '#143024',
          900: '#07120C',
        },
        secondary: {
          DEFAULT: '#D9AF62',
          50: '#FAF5EC',
          100: '#F4E8D0',
          200: '#EDDA9F',
          300: '#E6C97E',
          400: '#D9AF62',
          500: '#CC944D',
          600: '#AF7A3E',
          700: '#865A30',
          800: '#5D3B22',
          900: '#331F13',
        },
        accent: {
          DEFAULT: '#E67E22',
          50: '#FDEEE4',
          100: '#FBDBC9',
          200: '#F6B690',
          300: '#F19265',
          400: '#EB6D3C',
          500: '#E67E22',
          600: '#BF661D',
          700: '#8F4F18',
          800: '#5F3712',
          900: '#2F1F0B',
        },
        neutral: {
          DEFAULT: '#7D5A50',
          50: '#F2EEEC',
          100: '#E5DDD9',
          200: '#CBBBB4',
          300: '#B19990',
          400: '#97776B',
          500: '#7D5A50',
          600: '#64483F',
          700: '#4B352F',
          800: '#32231F',
          900: '#19120F',
        }
      },
      backgroundImage: {
        'parallax-pattern': "url('/src/img/wallpaper.png')",
      },
      animation: {
        'gentle-pulse': 'gentle-pulse 3s infinite',
      },
      keyframes: {
        'gentle-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        }
      }
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        bichosolto: {
          "primary": "#3B8C6E",
          "primary-focus": "#2E6D55",
          "primary-content": "#FFFFFF",
          
          "secondary": "#D9AF62",
          "secondary-focus": "#CC944D",
          "secondary-content": "#FFFFFF",
          
          "accent": "#E67E22",
          "accent-focus": "#BF661D",
          "accent-content": "#FFFFFF",
          
          "neutral": "#7D5A50",
          "neutral-focus": "#64483F",
          "neutral-content": "#FFFFFF",
          
          "base-100": "#F8F9FA",
          "base-200": "#E9ECEF",
          "base-300": "#DEE2E6",
          "base-content": "#212529",
          
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",
        }
      },
      "light",
    ],
    darkTheme: "bichosolto",
  },
}