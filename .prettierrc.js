module.exports = {
  trailingComma: 'none',
  tabWidth: 2,
  singleQuote: true,
  printWidth: 120,
  endOfLine: 'auto',
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200
      }
    }
  ],
  arrowParens: 'always'
};
