import type { IConnectionProfile } from '@/operators/connection';

function firstText(...values: unknown[]): string {
  return values.find((value): value is string => typeof value === 'string' && !!value.trim())?.trim() || '';
}

function publicUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.startsWith('//') ? `https:${value}` : value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

/** Display the same account identity for OAuth, cookies and personal tokens.
 * Providers retain their raw fields, so accept their common public aliases
 * without rendering arbitrary objects or treating an avatar hash as a URL. */
export function connectionProfile(profile: IConnectionProfile | null | undefined) {
  const data = profile || {};
  const login = firstText(data.login, data.username, data.screen_name);
  const email = firstText(data.email);
  const id = firstText(data.id, data.external_id, data.sub) || (typeof data.id === 'number' ? String(data.id) : '');
  const name = firstText(data.name, data.display_name, data.displayName, login, email, id);
  const avatarCandidates = [
    data.avatar,
    data.avatar_url,
    data.picture,
    data.avatarUrl,
    data.profile_image_url_https,
    data.profile_image_url
  ];
  const avatar =
    avatarCandidates
      .map((value) => {
        // Some providers are served through an authenticated image endpoint;
        // AuthBackend embeds those images instead of exposing credentials.
        if (typeof value === 'string' && /^data:image\/(?:png|jpe?g|gif|webp);base64,[a-z\d+/=\s]+$/i.test(value)) {
          return value;
        }
        return publicUrl(value);
      })
      .find(Boolean) || '';
  const url = [data.profile_url, data.html_url, data.web_url, data.url].map(publicUrl).find(Boolean) || '';
  const subtext = [email, login].find((value) => value && value !== name) || '';
  return { name, login, email, avatar, url, subtext };
}
