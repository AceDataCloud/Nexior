module.exports = {
  purge: {
    enabled: process.env.NODE_ENV !== 'development',
    content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}']
  },
  darkMode: false,
  theme: {
    extend: {}
  },
  variants: {
    extend: {}
  },
  plugins: []
};
