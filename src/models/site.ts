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
  pixverse?: any;
  hailuo?: any;
  headshots?: any;
  suno?: any;
  nanobanana?: any;
  openaiimage?: any;
  seedream?: any;
  seedance?: any;
  wan?: any;
  producer?: any;
  kimi?: any;
  serp?: any;
  fish?: any;
  webextrator?: any;
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
// entries with ``enabled: true`` are shown on the login screen. The
// platform defaults live in
// ``PlatformBackend/app/utils/site_defaults.py::DEFAULT_AUTH_PROVIDERS``
// (currently ``email`` enabled + ``google`` disabled).
export interface ISiteAuth {
  default_provider?: string;
  providers?: Record<string, ISiteAuthProvider>;
}

export interface ISiteTheme {
  // Hex colour like ``#277186`` (or shorthand ``#abc``). Drives the
  // Element Plus ``--el-color-primary`` CSS variable at runtime via
  // ``src/utils/initializer.ts``. Backend validator lives in
  // PlatformBackend ``app/utils/site_theme.py`` and rejects unknown
  // keys, so the shape here intentionally stays narrow.
  primary_color?: string;
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
  metadata?: any;
  theme?: ISiteTheme | null;
  tags?: string[];
}

export interface ISiteListResponse {
  count: number;
  items: ISite[];
}

export type ISiteDetailResponse = ISite;
