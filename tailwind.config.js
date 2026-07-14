module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--adc-color-primary)',
          hover: 'var(--el-color-primary-dark-2)',
          subtle: 'var(--adc-color-primary-subtle)'
        },
        surface: {
          canvas: 'var(--adc-color-surface-page)',
          DEFAULT: 'var(--adc-color-surface)',
          overlay: 'var(--adc-color-surface-overlay)'
        }
      },
      fontFamily: {
        sans: ['var(--adc-font-family-sans)'],
        display: ['var(--adc-font-family-sans)']
      },
      boxShadow: {
        glow: 'var(--app-glow-primary)',
        'glow-lg': 'var(--app-glow-primary-lg)',
        'glow-sm': '0 0 10px rgba(var(--app-brand-rgb), 0.1)',
        card: 'var(--app-shadow-md)',
        'card-hover': 'var(--app-shadow-lg)'
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      spacing: {
        18: '4.5rem',
        88: '22rem'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite'
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: 'var(--app-glow-primary)' },
          '50%': { boxShadow: 'var(--app-glow-primary-lg)' }
        }
      },
      backdropBlur: {
        xs: '4px'
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
};
