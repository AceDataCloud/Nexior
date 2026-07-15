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
  digitalhuman?: any;
  pixverse?: any;
  hailuo?: any;
  headshots?: any;
  suno?: any;
  nanobanana?: any;
  openaiimage?: any;
  seedream?: any;
  seedance?: any;
  grokvideo?: any;
  wan?: any;
  producer?: any;
  kimi?: any;
  serp?: any;
  fish?: any;
  webextrator?: any;
  codingBridge?: any;
  support?: any;
  subsite?: ISiteSubsiteFeature;
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
export interface ISiteAuthProvider {
  enabled?: boolean;
  [key: string]: unknown;
}

// Site-level authentication configuration. ``default_provider`` is the
// provider key (``"email"`` / ``"google"`` / ...) the login page should
// pre-select. ``providers`` is a sparse map keyed by provider ID — only
// entries with ``enabled: true`` are shown on the login screen.
// ``login_mode`` is how the login UI is launched on the web surface —
// ``"redirect"`` (full-page redirect to the auth host, the default) or
// ``"iframe"`` (embedded popup); native/desktop always use the iframe
// regardless. The platform defaults live in
// ``PlatformBackend/app/utils/site_defaults.py`` (``DEFAULT_AUTH_*``).
export interface ISiteAuth {
  default_provider?: string;
  login_mode?: 'iframe' | 'redirect';
  providers?: Record<string, ISiteAuthProvider>;
  // Per-site white-label SMS delivery webhook. When ``webhook_url`` + a
  // signing ``webhook_secret`` are set, AuthBackend delivers phone verification
  // codes to the owner's endpoint (their signature) instead of the platform
  // default. ``webhook_secret`` is write-only: never returned by the API (blank on
  // read; blank on write keeps the stored value). See
  // ``plans/white-label/44-sms-delivery-webhook.md``.
  sms?: ISiteAuthSms;
}

export interface ISiteAuthSms {
  webhook_url?: string;
  webhook_secret?: string;
}

export interface ISiteTheme {
  // Hex colour like ``#277186`` (or shorthand ``#abc``). Drives the
  // Element Plus ``--el-color-primary`` CSS variable at runtime via
  // ``src/utils/initializer.ts``. Backend validator lives in
  // PlatformBackend ``app/utils/site_theme.py`` and rejects unknown
  // keys, so the shape here intentionally stays narrow.
  primary_color?: string;
}

/**
 * `metadata.pricing` — the site-wide markup a 站长/affiliate applies to the
 * platform's official price. Backend validates it in
 * `SiteDetailSerializer.validate_metadata` (`app/utils/site_pricing.py`):
 *   markup_ratio  number in [0, 5] (= +0..+500%)   default 0
 *   currency      ISO-4217 3-letter code           default 'USD'
 *   applies_to    'all' (v1 only)                  default 'all'
 * Markup only resizes what end users see/pay; the affiliate commission ratio
 * is unchanged (earnings still flow through DistributionLevel.percentage).
 */
export interface ISitePricing {
  markup_ratio?: number;
  currency?: string;
  applies_to?: 'all';
}

export interface ISiteMetadata {
  pricing?: ISitePricing;
  support_url?: string;
  icp?: string;
  proxy_cname?: string;
  // When true, hide every top-up / recharge entry on the site so end
  // users can't buy more credit. Default (unset / not exactly `true`)
  // keeps recharge enabled. Read via `isRechargeDisabled` in
  // `src/utils/site.ts`.
  disable_recharge?: boolean;
  [key: string]: unknown;
}

// White-label brand chrome (PlatformBackend ``Site.branding`` column,
// PR #919). All keys optional; an unset column means "use our default
// brand" — default behavior is intentionally unchanged. Only an explicit
// ``hide_* === true`` hides a surface. Backend validator lives in
// ``app/utils/site_branding.py`` (rejects unknown keys). Consumed via
// ``isBrandingHidden`` / ``getBrandSupportUrl`` in ``src/utils/site.ts``.
export interface ISiteBrandingLinks {
  support?: string;
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
  type: string;
  label?: string;
  value?: string;
  url?: string;
  qr?: string;
}

export interface ISiteBranding {
  company?: string;
  copyright?: string;
  hide_powered_by?: boolean;
  links?: ISiteBrandingLinks;
  contacts?: ISiteContact[];
}

export interface ISite {
  id?: string;
  origin?: string;
  title?: string;
  logo?: string;
  favicon?: string;
  keywords?: string[];
  admins?: string[];
  description?: string;
  features?: ISiteFeatures;
  distribution?: ISiteDistribution;
  auth?: ISiteAuth;
  created_at?: string;
  updated_at?: string;
  metadata?: ISiteMetadata;
  theme?: ISiteTheme | null;
  branding?: ISiteBranding;
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
}

export interface ISiteListResponse {
  count: number;
  items: ISite[];
}

export type ISiteDetailResponse = ISite;
