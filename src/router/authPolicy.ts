const AUTH_REQUIRED_PREFIXES = [
  '/console',
  '/distribution',
  '/settings',
  '/coding-bridge',
  '/poivelle',
  '/chatgpt/call',
  '/chatgpt/scheduled',
  '/chatgpt/artifacts'
];

export const requiresLogin = (path: string): boolean =>
  AUTH_REQUIRED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
