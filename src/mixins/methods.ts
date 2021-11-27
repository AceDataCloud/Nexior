interface IData {
  isEqual: (a: any, b: any) => boolean;
}

export default {
  name: 'Methods',
  data(): IData {
    return {
      isEqual(a: any, b: any): boolean {
        return a === b;
      }
    };
  }
};
