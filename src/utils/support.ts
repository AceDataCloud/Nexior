import type { ISite, ISiteContact } from '@/models';
import { getBrandContacts, getBrandSupportUrl } from './site';

export const supportHttpUrl = (value?: string): string => {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
};

export const supportContactHref = (contact: ISiteContact): string => {
  if (contact.url) return supportHttpUrl(contact.url);
  const value = contact.value?.trim();
  if (!value) return '';
  const type = contact.type.trim().toLowerCase();
  if (type === 'email' && /^[^@\s?&#]+@[^@\s?&#]+\.[^@\s?&#]+$/.test(value)) return `mailto:${value}`;
  if (type === 'phone' && /^[+()\-.\s0-9]{3,40}$/.test(value)) return `tel:${value.replace(/\s/g, '')}`;
  return '';
};

export const feedbackHref = (site?: ISite): string => {
  const contacts = getBrandContacts(site);
  const feedback = contacts.find((contact) => contact.type === 'feedback' && supportContactHref(contact));
  if (feedback) return supportContactHref(feedback);
  const support = supportHttpUrl(getBrandSupportUrl(site));
  if (support) return support;
  const email = contacts.find((contact) => contact.type === 'email' && supportContactHref(contact));
  return email ? supportContactHref(email) : '';
};
