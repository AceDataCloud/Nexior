export const startPostMountBoot = (task: () => Promise<void>, onError: (error: unknown) => void): void => {
  void task().catch(onError);
};
