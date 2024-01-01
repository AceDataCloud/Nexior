/**
 * Log function name and arguments
 * @param func
 * @param arg
 */
export const log = (func: Function, ...arg: any) => {
  console.debug(`${func.name}`, ...arg);
};
