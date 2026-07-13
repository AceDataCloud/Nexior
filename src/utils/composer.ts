import { getCookie } from 'typescript-cookie';

export type SendShortcut = 'enter' | 'mod-enter';

/** How pressing Enter behaves in the chat composer. Browser-local (cookie). */
export function getSendShortcut(): SendShortcut {
  return getCookie('SEND_SHORTCUT') === 'mod-enter' ? 'mod-enter' : 'enter';
}
