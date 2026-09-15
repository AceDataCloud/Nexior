export const SITE_OAUTH_PROVIDER_IDS = ['github', 'google', 'apple'] as const;

export type SiteOAuthProviderId = (typeof SITE_OAUTH_PROVIDER_IDS)[number];

export interface SiteOAuthProviderDescriptor {
  id: SiteOAuthProviderId;
  requiresSecret: boolean;
  callbackPath: string;
  titleKey: string;
  tipKey: string;
  disabledKey: string;
  usingPlatformKey: string;
  usingCustomKey: string;
  clientIdKey: string;
  clientSecretKey?: string;
  clientSecretPlaceholderKey?: string;
  secretConfiguredKey?: string;
  callbackUrlKey: string;
  callbackTipKey: string;
  savedKey: string;
  saveErrorKey: string;
  deleteTitleKey: string;
  deleteConfirmKey: string;
}

export const SITE_OAUTH_PROVIDERS: Record<SiteOAuthProviderId, SiteOAuthProviderDescriptor> = {
  github: {
    id: 'github',
    requiresSecret: true,
    callbackPath: '/oauth/callback/github',
    titleKey: 'site.field.authGithubOAuthApp',
    tipKey: 'site.message.authGithubOAuthAppTip',
    disabledKey: 'site.message.authGithubOAuthProviderDisabled',
    usingPlatformKey: 'site.message.authGithubOAuthUsingPlatform',
    usingCustomKey: 'site.message.authGithubOAuthUsingCustom',
    clientIdKey: 'site.field.authGithubOAuthClientId',
    clientSecretKey: 'site.field.authGithubOAuthClientSecret',
    clientSecretPlaceholderKey: 'site.placeholder.authGithubOAuthClientSecret',
    secretConfiguredKey: 'site.message.authGithubOAuthSecretConfigured',
    callbackUrlKey: 'site.field.authGithubOAuthCallbackUrl',
    callbackTipKey: 'site.message.authGithubOAuthCallbackTip',
    savedKey: 'site.message.authGithubOAuthSaved',
    saveErrorKey: 'site.error.authGithubOAuthSave',
    deleteTitleKey: 'site.field.authGithubOAuthDeleteTitle',
    deleteConfirmKey: 'site.message.authGithubOAuthDeleteConfirm'
  },
  google: {
    id: 'google',
    requiresSecret: true,
    callbackPath: '/oauth/callback/google',
    titleKey: 'site.field.authGoogleOAuthApp',
    tipKey: 'site.message.authGoogleOAuthAppTip',
    disabledKey: 'site.message.authGoogleOAuthProviderDisabled',
    usingPlatformKey: 'site.message.authGoogleOAuthUsingPlatform',
    usingCustomKey: 'site.message.authGoogleOAuthUsingCustom',
    clientIdKey: 'site.field.authGoogleOAuthClientId',
    clientSecretKey: 'site.field.authGoogleOAuthClientSecret',
    clientSecretPlaceholderKey: 'site.placeholder.authGoogleOAuthClientSecret',
    secretConfiguredKey: 'site.message.authGoogleOAuthSecretConfigured',
    callbackUrlKey: 'site.field.authGoogleOAuthCallbackUrl',
    callbackTipKey: 'site.message.authGoogleOAuthCallbackTip',
    savedKey: 'site.message.authGoogleOAuthSaved',
    saveErrorKey: 'site.error.authGoogleOAuthSave',
    deleteTitleKey: 'site.field.authGoogleOAuthDeleteTitle',
    deleteConfirmKey: 'site.message.authGoogleOAuthDeleteConfirm'
  },
  apple: {
    id: 'apple',
    requiresSecret: false,
    callbackPath: '/oauth/callback/apple',
    titleKey: 'site.field.authAppleOAuthApp',
    tipKey: 'site.message.authAppleOAuthAppTip',
    disabledKey: 'site.message.authAppleOAuthProviderDisabled',
    usingPlatformKey: 'site.message.authAppleOAuthUsingPlatform',
    usingCustomKey: 'site.message.authAppleOAuthUsingCustom',
    clientIdKey: 'site.field.authAppleOAuthServicesId',
    callbackUrlKey: 'site.field.authAppleOAuthCallbackUrl',
    callbackTipKey: 'site.message.authAppleOAuthCallbackTip',
    savedKey: 'site.message.authAppleOAuthSaved',
    saveErrorKey: 'site.error.authAppleOAuthSave',
    deleteTitleKey: 'site.field.authAppleOAuthDeleteTitle',
    deleteConfirmKey: 'site.message.authAppleOAuthDeleteConfirm'
  }
};
