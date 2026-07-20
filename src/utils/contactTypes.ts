// Shared metadata for site support-contact channels (Site.branding.contacts).
// Maps a contact `type` slug to its icon, link scheme and a locale-independent
// brand name, plus the preset list the editor offers. Adding a channel here is
// the only change needed to give a new `type` a nice icon everywhere.
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { Component } from 'vue';
import { EmailIcon, GlobeIcon, LinkIcon, PhoneIcon } from '@acedatacloud/core/icons/components';
import {
  faDiscord,
  faXTwitter,
  faWeixin,
  faTelegram,
  faWhatsapp,
  faFacebook,
  faInstagram,
  faYoutube,
  faLinkedin,
  faGithub,
  faQq,
  faLine,
  faTiktok
} from '@fortawesome/free-brands-svg-icons';

// How the entry's `value` becomes an href when no explicit `url` is set.
export type ContactScheme = 'tel' | 'mailto' | 'text';

interface ContactTypeMeta {
  icon: IconDefinition | Component;
  fontAwesome?: boolean;
  // Scheme used to build a link from `value` (ignored when `url` is present).
  scheme: ContactScheme;
  // Locale-independent display name for known brands ('' = derive/translate).
  brand?: string;
}

const TYPES: Record<string, ContactTypeMeta> = {
  discord: { icon: faDiscord, fontAwesome: true, scheme: 'text', brand: 'Discord' },
  x: { icon: faXTwitter, fontAwesome: true, scheme: 'text', brand: 'X' },
  twitter: { icon: faXTwitter, fontAwesome: true, scheme: 'text', brand: 'X' },
  wechat: { icon: faWeixin, fontAwesome: true, scheme: 'text' },
  telegram: { icon: faTelegram, fontAwesome: true, scheme: 'text', brand: 'Telegram' },
  whatsapp: { icon: faWhatsapp, fontAwesome: true, scheme: 'text', brand: 'WhatsApp' },
  facebook: { icon: faFacebook, fontAwesome: true, scheme: 'text', brand: 'Facebook' },
  instagram: { icon: faInstagram, fontAwesome: true, scheme: 'text', brand: 'Instagram' },
  youtube: { icon: faYoutube, fontAwesome: true, scheme: 'text', brand: 'YouTube' },
  tiktok: { icon: faTiktok, fontAwesome: true, scheme: 'text', brand: 'TikTok' },
  linkedin: { icon: faLinkedin, fontAwesome: true, scheme: 'text', brand: 'LinkedIn' },
  github: { icon: faGithub, fontAwesome: true, scheme: 'text', brand: 'GitHub' },
  qq: { icon: faQq, fontAwesome: true, scheme: 'text', brand: 'QQ' },
  line: { icon: faLine, fontAwesome: true, scheme: 'text', brand: 'LINE' },
  phone: { icon: PhoneIcon, scheme: 'tel' },
  email: { icon: EmailIcon, scheme: 'mailto' },
  website: { icon: GlobeIcon, scheme: 'text' }
};

const DEFAULT_META: ContactTypeMeta = { icon: LinkIcon, scheme: 'text' };

const normalize = (type?: string): string => (type || '').trim().toLowerCase();

export const contactMeta = (type?: string): ContactTypeMeta => TYPES[normalize(type)] || DEFAULT_META;

export const contactIcon = (type?: string): IconDefinition | Component => contactMeta(type).icon;

export const contactUsesFontAwesome = (type?: string): boolean => !!contactMeta(type).fontAwesome;

// Locale-independent brand name for known channels ('' when the caller should
// translate — phone/email/website — or fall back to the raw/capitalized slug).
export const contactBrand = (type?: string): string => contactMeta(type).brand || '';

// Channels whose display name is translatable via an i18n key
// `common.settings.contactType_<type>`. Returns that key, or '' when the type
// has no localized name (caller should fall back to brand / capitalized slug).
const I18N_TYPES = new Set(['phone', 'email', 'website', 'wechat']);
export const contactTypeI18nKey = (type?: string): string => {
  const t = normalize(type);
  return I18N_TYPES.has(t) ? `common.settings.contactType_${t}` : '';
};

// Presets offered in the editor's type picker (order = list order there).
export const CONTACT_TYPE_PRESETS = ['wechat', 'phone', 'email', 'discord', 'x', 'telegram', 'whatsapp', 'website'];
