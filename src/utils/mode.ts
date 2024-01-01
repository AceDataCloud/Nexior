/**
 * Get mode of app, return development or production
 * @returns
 */
export const getMode = () => {
  return import.meta.env.MODE;
};
