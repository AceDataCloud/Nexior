# OAuth for a website embedded in Studio

Choose how your website should connect the visitor's Ace Data Cloud account:

| Flow | Account used | How your website receives the result |
| --- | --- | --- |
| Standard OAuth redirect | The account signed into AuthFrontend | The iframe navigates back to your registered callback with `code` and `state` |
| Studio component bridge | The visitor's current Studio account | Studio sends the code back with `postMessage`; your page stays loaded |

The [OAuth integration guide](https://docs.acedata.cloud/zh-Hans/guides/oauth)
is the source for current scopes, endpoints, a runnable standard PKCE redirect
example, token lifecycle and troubleshooting. Standard OAuth redirects do not
require `embed=studio`, `embed_origin`, or the message bridge below.

For the standard flow, both your website and callback must allow the Studio
parent to embed them. Scripts, forms and the browser storage used for state/PKCE
must work in that iframe. AuthFrontend's session is separate from Studio's.
**The current ordinary iframe login flow has a gap resuming consent after a fresh
login.** Test signed-out and expired-session cases; use a standalone OAuth page
or the Studio bridge until that continuation is fixed and verified. Changing the
account icon alone does not establish a session or complete authorization.

## Configure the Studio component bridge

1. Register a **Public / PKCE** client at
   <https://auth.acedata.cloud/user/oauth-apps> with `profile:read credentials:read`
   and your exact HTTPS callback URL. The old `profile` scope is not accepted.
2. In Studio **Settings → Homepage → Website section**, enable OAuth and enter
   that client ID and callback. The website and callback must have the same
   HTTPS origin, different from Studio's origin. Never enter a client secret.
3. Implement the message protocol below in the third-party page. Set
   `STUDIO_ORIGIN` to the exact white-label host, such as `https://your-site.example`.
   Setting the iframe URL and client ID does not add the protocol to your website.

The component requests `profile:read credentials:read`; it does not request
`offline_access`, so do not expect a refresh token. A Public client can exchange
the code directly with AuthFrontend. A Confidential client must exchange it on
its own backend with its secret and the original PKCE verifier; never expose
that secret in frontend code.

The app list API's `available_scopes` is the ordinary application's scope
catalog. Discovery's `scopes_supported` also contains restricted permissions;
it is not a list of scopes every app can request. App registration, delegation
policy and the visitor's own permissions must all allow the requested scopes.

## Third-party browser example

This example connects only when the visitor clicks **Connect**. It keeps the
verifier and token in memory, handles denial and failed requests, and reports
how many credentials were returned without displaying their values. Reloading
the page starts a new connection; integrate successful results with your own
application session and credential selection.

```html
<button id="connect" type="button" disabled>Connect</button>
<p id="status" role="status">Waiting for Studio…</p>
<script type="module">
const STUDIO_ORIGIN = 'https://your-site.example';
const AUTH_ORIGIN = 'https://auth.acedata.cloud';
const button = document.querySelector('#connect');
const status = document.querySelector('#status');
let config;
let transaction;
let timeout;

function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function finish(message) {
  clearTimeout(timeout);
  transaction = undefined;
  button.disabled = !config;
  status.textContent = message;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

button.addEventListener('click', async () => {
  if (!config || transaction) return;
  button.disabled = true;
  const current = {
    verifier: base64url(crypto.getRandomValues(new Uint8Array(32))),
    state: base64url(crypto.getRandomValues(new Uint8Array(24))),
    config
  };
  transaction = current;
  try {
    const challenge = base64url(new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(current.verifier))
    ));
    status.textContent = 'Waiting for your approval…';
    timeout = setTimeout(() => finish('Authorization timed out. Connect again.'), 5 * 60 * 1000);
    window.parent.postMessage({
      type: 'acedatacloud:oauth:authorize', state: current.state,
      code_challenge: challenge, code_challenge_method: 'S256'
    }, STUDIO_ORIGIN);
  } catch {
    finish('Could not start authorization. Please retry.');
  }
});

window.addEventListener('message', async (event) => {
  if (event.origin !== STUDIO_ORIGIN || event.source !== window.parent) return;
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'acedatacloud:oauth:init') {
    try {
      if (typeof data.client_id !== 'string' || !data.client_id ||
          typeof data.redirect_uri !== 'string') return;
      const callback = new URL(data.redirect_uri);
      if (callback.protocol !== 'https:' || callback.origin !== window.location.origin ||
          callback.hash || callback.username || callback.password) return;
      config = { client_id: data.client_id, redirect_uri: data.redirect_uri };
      if (!transaction) finish('Ready to connect.');
    } catch {
      finish('Invalid component configuration.');
    }
    return;
  }
  if (data.type !== 'acedatacloud:oauth:result' || !transaction ||
      data.state !== transaction.state || transaction.exchanging) return;
  if (typeof data.error === 'string') {
    // login_required: sign into Studio first; access_denied: offer Connect again.
    finish(`Authorization not completed: ${data.error}`);
    return;
  }
  const current = transaction;
  if (data.redirect_uri !== current.config.redirect_uri ||
      typeof data.code !== 'string' || !data.code) return;
  current.exchanging = true;
  clearTimeout(timeout);
  status.textContent = 'Connecting…';
  try {
    const token = await requestJson(`${AUTH_ORIGIN}/oauth2/token`, {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'authorization_code', code: data.code,
        client_id: current.config.client_id,
        redirect_uri: current.config.redirect_uri, code_verifier: current.verifier
      })
    });
    if (!token.access_token) throw new Error('Missing access token');
    const headers = { Authorization: `Bearer ${token.access_token}` };
    const profile = await requestJson(`${AUTH_ORIGIN}/api/v1/users/me`, { headers });
    if (!profile.id) throw new Error('Missing user ID');
    const keysUrl = new URL('https://platform.acedata.cloud/api/v1/credentials/');
    keysUrl.search = new URLSearchParams({ user_id: profile.id, limit: '100' }).toString();
    const credentials = await requestJson(keysUrl, { headers });
    if (!Array.isArray(credentials.items)) throw new Error('Invalid credential response');
    const keyCount = credentials.items.filter(item => typeof item.token === 'string' && item.token).length;
    // Select appropriate credentials.items[*].token for your application here.
    // Do not put tokens or keys in URLs, logs or analytics.
    finish(`Connected. This page contains ${keyCount} API keys.`);
  } catch {
    finish('Connection failed. Please connect again.');
  }
});

window.parent.postMessage({ type: 'acedatacloud:oauth:ready' }, STUDIO_ORIGIN);
</script>
```

Use UserInfo's `id` as the credential list's `user_id`; `me` is not accepted.
The response is `count` plus `items`, and the API Key field is `token`, not
`data[0].value`. Follow `offset`/`limit` pagination when needed and choose a valid
credential for the required service. An empty list is a valid result, not a
failed OAuth grant. Network failures must not stop the rest of your page rendering.

## Consent, branding and return behavior

Studio displays `auth.acedata.cloud` in a separate consent iframe. Its session
bridge binds the exact parent origin, source window and state. Only AuthFrontend
receives the Studio session, temporarily in memory; your application receives
only its own authorization code and state. Studio manages `embed=studio` and
`embed_origin` for this flow. Your application does not need to construct them.

The application icon comes from OAuth registration. The account-side icon comes
from the verified parent Site when available, preferring its favicon, then logo.
Ordinary embedded consent can also discover the parent origin using the browser;
branding is independent of whether your application uses this message bridge.

A guest receives `login_required`; a denial returns `access_denied`; consent
expires after five minutes with `authorization_timeout`. Signing in or changing
Studio accounts recreates the application iframe and cancels pending consent.
The bridge requires an HTTPS web Studio host; local/native applications should
use the standard external OAuth flow. Keep the verifier until exchange completes
and never send it to Studio.

## Token and key lifecycle

Use `expires_in` from the OAuth response. Do not assume every response has a
refresh token or that refreshing immediately invalidates the previous one.
The current OAuth revocation endpoint acknowledges requests with HTTP 200 but
does not immediately invalidate issued JWTs. Clear your own saved connection
state when disconnecting; do not describe that response as proof of revocation.

Granting `credentials:read` allows your app to retain API Keys. Copied keys must
be revoked or rotated separately through credential management. The component
neither creates new API Keys nor changes service subscriptions, quota or billing.

## Acceptance checklist

- Button click opens consent for the current Studio account; no token/key is obtained before Allow.
- Denial, guest login, timeout, account changes and retries leave a usable page.
- Wrong-origin, wrong-window and wrong-state messages are ignored.
- The callback matches registration exactly; PKCE uses S256 and the original verifier.
- Token, UserInfo and credential requests handle HTTP, DNS and CORS failures.
- Credential parsing uses `items[*].token`, handles an empty list and pagination.
- Desktop/mobile iframe and a standalone standard flow are tested separately.
