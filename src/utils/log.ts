export const log = (func: Function, ...arg: any) => {
  console.debug(`${func.name}`, ...arg);
};
