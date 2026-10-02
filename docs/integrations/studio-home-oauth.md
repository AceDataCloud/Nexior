# OAuth for an embedded Studio homepage application

A Studio administrator can enable OAuth on a **Website** homepage section. Each
visitor must explicitly approve access to their own ACE Data Cloud account.
The application receives an authorization code, exchanges it for an OAuth token,
and uses `credentials:read` to obtain the user's existing API Keys.

## Configure the application

1. Register a **public / PKCE** client at
   <https://auth.acedata.cloud/user/oauth-apps> with the scopes
   `profile:read credentials:read` and the exact HTTPS callback URL.
2. In Studio **Settings → Homepage → Website section**, enable OAuth and enter
   its client ID and callback. Do not enter a client secret. The website and
   callback must share an exact HTTPS origin, separate from Studio's origin.
3. Implement the bridge below in the third-party page. Replace `STUDIO_ORIGIN`
   with the exact Studio host. A configured iframe URL alone is not an OAuth
   integration.

The browser flow below is for a public client. A confidential client exchanges
its code on its own backend, keeping its client secret there, and must still
bind the exchange to the PKCE verifier generated for this request.

## Third-party browser integration

```js
const STUDIO_ORIGIN = 'https://studio.acedata.cloud';
const AUTH_ORIGIN = 'https://auth.acedata.cloud';
let config;
let transaction;

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function connect() {
  if (!config || transaction) return;
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const state = base64url(crypto.getRandomValues(new Uint8Array(24)));
  transaction = { verifier, state };
  const challenge = base64url(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)))
  );
  window.parent.postMessage(
    {
      type: 'acedatacloud:oauth:authorize',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    },
    STUDIO_ORIGIN
  );
}

window.addEventListener('message', async (event) => {
  if (event.origin !== STUDIO_ORIGIN || event.source !== window.parent) return;
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'acedatacloud:oauth:init') {
    config = { client_id: data.client_id, redirect_uri: data.redirect_uri };
    await connect();
    return;
  }
  if (data.type !== 'acedatacloud:oauth:result' || !transaction || data.state !== transaction.state) return;
  const current = transaction;
  transaction = undefined;
  if (data.error) {
    // access_denied, login_required, authorization_timeout: show a retry button.
    document.getElementById('status').textContent = data.error;
    return;
  }
  if (data.redirect_uri !== config.redirect_uri || typeof data.code !== 'string') return;
  try {
    const response = await fetch(`${AUTH_ORIGIN}/oauth2/token`, {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: data.code,
        client_id: config.client_id,
        redirect_uri: config.redirect_uri,
        code_verifier: current.verifier
      })
    });
    if (!response.ok) throw new Error('Token exchange failed');
    const token = await response.json();
    const profileResponse = await fetch(`${AUTH_ORIGIN}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    if (!profileResponse.ok) throw new Error('Profile access failed');
    const profile = await profileResponse.json();
    const keysUrl = new URL('https://platform.acedata.cloud/api/v1/credentials/');
    keysUrl.searchParams.set('user_id', profile.id);
    keysUrl.searchParams.set('limit', '100');
    const keysResponse = await fetch(keysUrl, {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    if (!keysResponse.ok) throw new Error('Credential access failed');
    const credentials = await keysResponse.json();
    // Consume credentials.items[*].token inside your application.
    // Do not put keys or tokens in URLs, analytics, or logs.
    window.dispatchEvent(new CustomEvent('ace-credentials', { detail: credentials.items }));
    document.getElementById('status').textContent = 'Connected';
  } catch {
    document.getElementById('status').textContent = 'Connection failed; please retry.';
  }
});

// Also bind connect() to a visible Retry / Connect button.
window.parent.postMessage({ type: 'acedatacloud:oauth:ready' }, STUDIO_ORIGIN);
```

Provide an element with ID `status` and a button that calls `connect()`. Listen for
`ace-credentials` to use the returned keys. Keep the PKCE verifier in this page's
memory until the exchange completes; Studio never receives it. Use the `id` returned
by UserInfo as the credential list's `user_id`; this endpoint does not accept `me`.

## Consent and isolation

Studio displays the official `auth.acedata.cloud` consent page in its own iframe
within the section. That page verifies the Studio parent against the registered
frame-ancestor policy and uses the current Studio session temporarily in memory.
Only AuthFrontend receives that session, using an exact origin and source-window
check. It is never sent to the third-party page or written to AuthFrontend's login
storage. The third party receives only its own code and state.

A guest gets `login_required`. Signing in or changing Studio accounts recreates
the application iframe and cancels pending consent. A request times out after five
minutes. Existing HTML and ordinary Website sections keep their existing sandbox.
This embedded bridge requires an HTTPS web Studio host; native/local hosts should
use the third-party application's normal external OAuth flow.

**Key access is disclosure:** the third party can keep and use the granted API Keys
outside Studio. Revoking OAuth access cannot invalidate copied keys. Users must
revoke or rotate those API Keys separately. This feature neither issues a new API
Key nor changes API Gateway authentication or billing.

## Rollout

Land the AuthBackend callback/PKCE checks and PlatformBackend configuration
migration first, then the AuthFrontend embedded consent bridge, then this Nexior
UI. This UI requires all three companion changes. Roll back the UI or disable the
section's OAuth configuration to stop new embedded authorizations; keys already
shared remain valid until individually revoked or rotated.
