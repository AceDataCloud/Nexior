export function applyTheme(theme: string) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  // Update color-scheme so native UI elements (scrollbars, inputs, etc.) match
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}
