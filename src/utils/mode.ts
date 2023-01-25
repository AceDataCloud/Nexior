/**
 * Get mode of App, return development or production
 * @returns
 */
export const getMode = () => {
  return import.meta.env.MODE;
};
