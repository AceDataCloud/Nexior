/**
 * Tab keys for the user-settings dialog (`@/components/user/Setting.vue`).
 *
 * Centralised so children that need to ask the dialog to switch tabs
 * (e.g. About.vue's "Build same site" button) can refer to them by name
 * instead of repeating raw string literals across the codebase.
 */
export const SETTING_TAB_GENERAL = 'general';
export const SETTING_TAB_API_KEY = 'apiKey';
export const SETTING_TAB_SITE = 'site';
export const SETTING_TAB_SEO = 'seo';
export const SETTING_TAB_DISTRIBUTION = 'distribution';
export const SETTING_TAB_FUNCTION = 'function';
export const SETTING_TAB_SUBSITES = 'subsites';
export const SETTING_TAB_CUSTOM_DOMAIN = 'customDomain';
export const SETTING_TAB_ABOUT = 'about';

export type SettingTabKey =
  | typeof SETTING_TAB_GENERAL
  | typeof SETTING_TAB_API_KEY
  | typeof SETTING_TAB_SITE
  | typeof SETTING_TAB_SEO
  | typeof SETTING_TAB_DISTRIBUTION
  | typeof SETTING_TAB_FUNCTION
  | typeof SETTING_TAB_SUBSITES
  | typeof SETTING_TAB_CUSTOM_DOMAIN
  | typeof SETTING_TAB_ABOUT;
