/**
 * Centralized OAuth connection management lives at AuthFrontend
 * (auth.acedata.cloud/user/connections). Nexior shows a read-only
 * list of the user's existing connections; any connect / disconnect
 * action redirects to AuthFrontend, which knows how to come back
 * via the `return_url` query parameter.
 */

const CONNECTIONS_MANAGER_URL = 'https://auth.acedata.cloud/user/connections';

/**
 * Open the centralized connections management page in a new tab.
 * Passes `return_url` so AuthFrontend can offer a "back to Nexior" link.
 *
 * Use a new tab (vs same-tab navigation) so the user does not lose
 * their current Nexior context (chat draft, scroll position, etc.).
 */
export function openConnectionsManager(provider?: string): void {
  const returnUrl = window.location.href;
  const url = new URL(CONNECTIONS_MANAGER_URL);
  url.searchParams.set('return_url', returnUrl);
  if (provider) {
    url.searchParams.set('provider', provider);
  }
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}
