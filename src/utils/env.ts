/**
 * Get env of App, return local, test, production
 * @returns
 */
export const getEnv = () => {
  return import.meta.env.VITE_APP_ENV;
};
