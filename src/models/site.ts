import type { CapabilityKey } from '@/constants/capabilities';

export interface ISiteCapabilityFeature {
  enabled?: boolean;
  [key: string]: unknown;
}

export interface ISiteFeatures {
  chatgpt?: any;
  deepseek?: any;
  grok?: any;
  gemini?: any;
  claude?: any;
  midjourney?: any;
  flux?: any;
  qrart?: any;
  luma?: any;
  pika?: any;
  kling?: any;
  veo?: any;
  sora?: any;
  maestro?: any;
  poivelle?: any;
  digitalhuman?: any;
  pixverse?: any;
  hailuo?: any;
  minimax?: any;
  suno?: any;
  nanobanana?: any;
  openaiimage?: any;
  seedream?: any;
  qwenimage?: any;
  seedance?: any;
  grokvideo?: any;
  omni?: any;
  wan?: any;
  producer?: any;
  kimi?: any;
  serp?: any;
  fish?: any;
  webextrator?: any;
  codingBridge?: any;
  support?: any;
  referral?: ISiteCapabilityFeature;
  subsite?: ISiteSubsiteFeature;
}

export interface ISiteCapabilityPresentation {
  display_name?: string | null;
  icon_url?: string | null;
}

export interface ISiteSubsiteFeature {
  enabled?: boolean;
  max_subsites_per_user?: number;
  subdomain_zone?: string;
}

export interface ISiteDistribution {
  default_inviter_id?: string;
  force_inviter_id?: string;
}

// Per-provider auth toggle on a Site. Today the only structural key is
// ``enabled``; kept open-ended so future provider-specific config
// (``client_id``, ``scopes``, ``required_user_fields``, ...) can be
// added without breaking the wire format. Backend stores this as a
// JSONField (see ``PlatformBackend/app/models/site.py``).
export type SiteEmailTransportSecurity = 'starttls' | 'implicit_tls';
export type SiteAuthDeliveryType = 'platform' | 'smtp' | 'webhook';
export type SiteAuthVerificationSource = 'saved_config_test' | 'legacy_migration';

export interface ISiteAuthEmailSmtp {
  host: string;
  port: 465 | 587;
  security: SiteEmailTransportSecurity;
  username: string;
  password?: string;
  password_configured?: boolean;
  verified?: boolean;
  verified_at?: number | null;
  verification_source?: SiteAuthVerificationSource | null;
  test_proof?: string;
  from_email: string;
  from_name: string;
  reply_to: string;
}

export interface ISiteAuthPhoneWebhook {
  url: string;
  secret?: string;
  secret_configured?: boolean;
  verified?: boolean;
  verified_at?: number | null;
  verification_source?: SiteAuthVerificationSource | null;
  test_proof?: string;
}

export interface ISiteAuthDelivery {
  type: SiteAuthDeliveryType;
  smtp?: ISiteAuthEmailSmtp | null;
  webhook?: ISiteAuthPhoneWebhook | null;
}

export interface ISiteAuthProvider {
  enabled?: boolean;
  delivery?: ISiteAuthDelivery;
  [key: string]: unknown;
}

export interface ISiteAuthDeliveryProviders {
  email?: ISiteAuthProvider;
  phone?: ISiteAuthProvider;
  [key: string]: ISiteAuthProvider | undefined;
}

export interface ISiteAuth {
  default_provider?: string;
  login_mode?: 'iframe' | 'redirect';
  providers?: Record<string, ISiteAuthProvider>;
}

export interface ISiteAuthDeliveryTestResponse {
  success: boolean;
  test_proof?: string;
  code?: string;
}

export interface ISitePhoneDeliveryTestRequest {
  receiver: string;
  region: string;
  locale: string;
}

export interface ISiteTheme {
  primary_color?: string;
}

export interface ISitePricing {
  markup_ratio?: number;
  currency?: string;
  applies_to?: 'all';
}

export interface ISiteCommerce {
  pricing?: ISitePricing;
  recharge?: { enabled?: boolean };
}

export interface ISiteHomeSectionConfig {
  enabled?: boolean;
  disabled_item_ids?: string[];
}

export interface ISiteHome {
  sections?: {
    banner?: ISiteHomeSectionConfig;
    categories?: ISiteHomeSectionConfig;
    showcase?: Pick<ISiteHomeSectionConfig, 'enabled'>;
  };
}

// White-label brand chrome (PlatformBackend ``Site.branding`` column,
// PR #919). All keys optional; an unset column means "use our default
// brand" — default behavior is intentionally unchanged. Only an explicit
// ``hide_* === true`` hides a surface. Backend validator lives in
// ``app/utils/site_branding.py`` (rejects unknown keys). Consumed via
// ``isBrandingHidden`` / ``getBrandSupportUrl`` in ``src/utils/site.ts``.
export interface ISiteBrandingLinks {
  support?: string;
  studio?: string;
  docs?: string;
  tos?: string;
  privacy?: string;
}

// One customer-service entry shown on the About page (an ordered list
// lives at ``Site.branding.contacts``). ``type`` is a short slug
// (discord / x / wechat / telegram / phone / email / website / any
// custom channel) that drives the icon + link scheme; each item must
// carry at least one of ``value`` / ``url`` / ``qr``. This shape scales
// to multiple phones/emails, a QR on any channel, and new channel types
// with no schema change. Backend validator: ``app/utils/site_branding.py``.
export interface ISiteContact {
  id?: string;
  type: string;
  label?: string;
  value?: string;
  url?: string;
  qr?: string;
}

export interface ISiteBranding {
  company?: string;
  copyright?: string;
  icp?: string;
  hide_powered_by?: boolean;
  links?: ISiteBrandingLinks;
  contacts?: ISiteContact[];
}

export interface ISiteAnalytics {
  ga4?: { enabled: boolean; measurement_id: string };
  baidu?: { enabled: boolean; site_id: string };
  clarity?: { enabled: boolean; project_id: string };
  umami?: { enabled: boolean; website_id: string; server_url: string };
}

export interface ISite {
  id?: string;
  origin?: string;
  title?: string;
  logo?: string;
  logo_light?: string;
  logo_dark?: string;
  favicon?: string;
  language?: string;
  supported_locales?: string[] | null;
  /**
   * Pins the UI language for every visitor. Unset means auto-detect. Distinct
   * from `language`, which PlatformBackend backfills to "en" and so is never
   * empty — see PlatformBackend `app/utils/site_defaults.py`.
   */
  forced_locale?: string | null;
  keywords?: string[];
  admins?: string[];
  description?: string;
  features?: ISiteFeatures;
  distribution?: ISiteDistribution;
  auth?: ISiteAuth;
  created_at?: string;
  updated_at?: string;
  commerce?: ISiteCommerce | null;
  home?: ISiteHome | null;
  theme?: ISiteTheme | null;
  branding?: ISiteBranding;
  analytics?: ISiteAnalytics;
  // Verified Page-domain bindings where browser integrations may execute.
  active_page_hosts?: string[];
  tags?: string[];
  // Server-derived metadata for the per-field auto-translate toggle
  // (PlatformBackend PR #511/#513). When a field is in
  // ``auto_translated_fields``, the rendered column (``title`` /
  // ``description``) is JSONLocalizationRenderer-evaluated to the
  // viewer's language and the raw zh-cn source lives in the matching
  // ``<field>_source`` key. When the toggle is OFF, ``<field>_source``
  // mirrors the column. Read-only on the wire.
  title_source?: string;
  description_source?: string;
  auto_translated_fields?: string[];
  capability_overrides?: Partial<Record<CapabilityKey, ISiteCapabilityPresentation>>;
}

export interface ISiteListResponse {
  count: number;
  items: ISite[];
}

export type ISiteDetailResponse = ISite;
