/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 文本颜色
        text: {
          primary: '#1A1A1A',
          secondary: '#4A4A4A',
          tertiary: '#6B6B6B',
        },
        // 背景颜色
        bg: {
          primary: '#FEFEFE',
          surface: '#F9F9F7',
          divider: '#E5E5E0',
        },
        // 强调色
        accent: {
          primary: '#D4A574',
          hover: '#B8935F',
          light: '#E8C9A0',
        },
        // 语义色
        semantic: {
          success: '#3A5A40',
          warning: '#B8860B',
          error: '#8F1C1C',
        },
      },
      fontFamily: {
        display: ['Noto Serif SC', 'Playfair Display', 'Georgia', 'serif'],
        body: ['Georgia', 'Noto Serif SC', 'Songti SC', 'serif'],
        ui: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      fontSize: {
        'display': '64px',
        'headline': '40px',
        'subhead': '28px',
        'body-large': '21px',
        'body': '18px',
        'small': '16px',
        'metadata': '14px',
      },
      lineHeight: {
        'tight': '1.1',
        'heading': '1.2',
        'body': '1.6',
        'relaxed': '1.7',
      },
      spacing: {
        'xs': '8px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        '2xl': '64px',
        '3xl': '96px',
        '4xl': '128px',
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'md': '8px',
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'modal': '0 16px 48px rgba(0, 0, 0, 0.16)',
      },
      transitionDuration: {
        'fast': '200ms',
        'standard': '300ms',
        'slow': '400ms',
      },
      maxWidth: {
        'article': '650px',
        'container': '1280px',
      },
    },
  },
  plugins: [],
}