interface LocalizedBootstrapDependencies {
  initializeSite: () => Promise<void>;
  applySiteLocale: () => Promise<boolean>;
  initializeUser: () => Promise<void>;
  initializeConfig: () => Promise<void>;
}

export const initializeLocalizedBootstrap = async ({
  initializeSite,
  applySiteLocale,
  initializeUser,
  initializeConfig
}: LocalizedBootstrapDependencies) => {
  await initializeSite();
  if (await applySiteLocale()) {
    await initializeSite();
  }
  await Promise.all([initializeUser(), initializeConfig()]);
};
