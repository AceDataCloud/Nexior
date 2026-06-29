import { app, BrowserWindow, ipcMain, shell, Menu, Notification } from 'electron';
import path from 'node:path';
import { registerAppProtocol, APP_ORIGIN } from './protocol';
import { issueState, consumeState } from './auth-state';
import { initUpdater } from './updater';
import { registerLocalExec } from './local/ipc';
import { registry } from './local/registry';
import { setRoots } from './local/fs';
import { load as loadLocalConfig } from './local/config';

const DESKTOP_SCHEME = 'acedata-desktop';

// Host allowlists for IPC-driven external opens. A compromised renderer must
// not be able to launch arbitrary URLs or mint a state bound to a foreign auth
// host. `AUTH_HOSTS` is the only host that gets a fresh state appended.
const AUTH_HOSTS = new Set(['auth.acedata.cloud']);
// Payment redirects through third-party PSP hosts (NOT our domain) — they must
// be allow-listed or the user can never reach checkout. Verify against the real
// pay flow before shipping.
const PSP_HOSTS = ['alipay.com', 'stripe.com', 'wx.tenpay.com', 'paypal.com'];
const EXTERNAL_HOSTS = new Set(['acedata.cloud', ...PSP_HOSTS]);

// The signed-in site origin, added at runtime via `site:setOrigin` so
// white-label custom-domain tenants aren't denied. Auth host stays fixed.
const runtimeExternal = new Set<string>();

const allowedHost = (u: string, set: Set<string>): boolean => {
  try {
    const { protocol, hostname } = new URL(u);
    return protocol === 'https:' && [...set].some((h) => hostname === h || hostname.endsWith('.' + h));
  } catch {
    return false;
  }
};
const allowedExternal = (u: string): boolean => {
  if (allowedHost(u, EXTERNAL_HOSTS) || allowedHost(u, AUTH_HOSTS)) return true;
  try {
    const { protocol, origin } = new URL(u);
    return protocol === 'https:' && runtimeExternal.has(origin);
  } catch {
    return false;
  }
};

let mainWindow: BrowserWindow | null = null;
let rendererReady = false; // set by 'renderer:ready', re-armed on navigation
let pendingDeepLinks: Array<{ channel: string; payload: object }> = [];

// Privileged scheme MUST be declared synchronously at module load, in every
// process, BEFORE app 'ready' — unconditionally, NOT inside the lock branch.
registerAppProtocol.declare();

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(DESKTOP_SCHEME, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(DESKTOP_SCHEME);
  }

  // Windows/Linux: a second launch (incl. protocol activation) lands here in
  // the EXISTING instance, with the URL in argv. Single-instance IS the
  // deep-link transport on Windows.
  app.on('second-instance', (_e, argv) => {
    const url = argv.find((a) => a.startsWith(`${DESKTOP_SCHEME}://`));
    if (url) handleDeepLink(url);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // macOS: protocol activation arrives as an event — and CAN fire before
  // whenReady on cold start. handleDeepLink queues if the renderer isn't ready.
  app.on('open-url', (e, url) => {
    e.preventDefault();
    handleDeepLink(url);
  });

  app.whenReady().then(() => {
    registerAppProtocol.serve();
    // Dev runs (`electron .`) show the default Electron icon in the Dock; the
    // packaged DMG uses build/icon.icns. Set the brand icon for dev too.
    if (!app.isPackaged && process.platform === 'darwin') {
      try {
        app.dock?.setIcon(path.join(__dirname, '..', '..', 'build', 'icon.png'));
      } catch {
        /* dev-only cosmetic; ignore if asset missing */
      }
    }
    createWindow();
    setupAppMenu();
    initUpdater(() => mainWindow);
    // Local tool execution: load authorized roots, boot MCP servers, wire IPC.
    const localCfg = loadLocalConfig();
    setRoots(localCfg.roots);
    void registry.boot(localCfg.mcp);
    registerLocalExec(() => mainWindow);
    // Windows cold-start protocol activation: URL is in this instance's argv.
    const coldUrl = process.argv.find((a) => a.startsWith(`${DESKTOP_SCHEME}://`));
    if (coldUrl) handleDeepLink(coldUrl);
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

function createWindow(): void {
  const isMac = process.platform === 'darwin';
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 992,
    minHeight: 600,
    backgroundColor: '#0b0b0f', // avoid white flash before the SPA paints
    // Frameless: macOS keeps inset traffic lights; Win/Linux use Window Controls
    // Overlay so min/max/close stay native. The web header draws into the bar.
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac ? { trafficLightPosition: { x: 16, y: 20 } } : { titleBarOverlay: { color: '#00000000', symbolColor: '#888888', height: 64 } }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Serve the SPA over the privileged custom scheme (NOT file://) so the origin
  // is real + whitelistable by AuthFrontend's frame-ancestors. Load the origin
  // root, not /index.html — Vue Router would match the literal /index.html path
  // to the catch-all and flash NotFound before redirecting.
  void mainWindow.loadURL(`${APP_ORIGIN}/`);

  // Re-arm the readiness handshake on every (re)navigation: the old renderer's
  // listeners detached; the new one hasn't subscribed yet. Without this,
  // rendererReady stays stale-true and a deep link in the gap is lost.
  mainWindow.webContents.on('did-start-navigation', (_e, _url, isInPlace, isMainFrame) => {
    if (isMainFrame && !isInPlace) rendererReady = false;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (allowedExternal(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  // Block top-frame AND sub-frame (iframe) navigation away from our origin.
  // will-navigate does NOT fire for iframe navigation — the AuthFrontend login
  // runs in an iframe — so will-frame-navigate (Electron 25+) is required.
  const guard = (event: Electron.Event, url: string) => {
    if (url.startsWith(APP_ORIGIN) || allowedHost(url, AUTH_HOSTS)) return;
    event.preventDefault();
    if (allowedExternal(url)) void shell.openExternal(url);
  };
  mainWindow.webContents.on('will-navigate', (event, url) => guard(event, url));
  mainWindow.webContents.on('will-frame-navigate', (event) => guard(event, event.url));
}

function handleDeepLink(rawUrl: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return;
  }
  // acedata-desktop://auth/callback?code=...&state=...
  if (url.host !== 'auth' || !url.pathname.startsWith('/callback')) return;
  const code = url.searchParams.get('code');
  if (!code) return;
  if (!consumeState(url.searchParams.get('state'))) {
    console.warn('[auth] deep link rejected: state mismatch/expired');
    deliverOrQueue('auth:expired', {});
    focusWindow();
    return;
  }
  deliverOrQueue('auth:callback', { code });
  focusWindow();
}

function focusWindow(): void {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.focus();
}

// Deliver only once the renderer has SUBSCRIBED (mounted + onAuthCallback
// attached), signalled via 'renderer:ready'. Queue everything else.
function deliverOrQueue(channel: string, payload: object): void {
  if (mainWindow && rendererReady) {
    mainWindow.webContents.send(channel, payload);
  } else {
    pendingDeepLinks.push({ channel, payload });
  }
}

ipcMain.on('renderer:ready', () => {
  rendererReady = true;
  if (!mainWindow) return;
  const queued = pendingDeepLinks;
  pendingDeepLinks = [];
  for (const { channel, payload } of queued) mainWindow.webContents.send(channel, payload);
});

ipcMain.on('site:setOrigin', (_e, origin: string) => {
  try {
    if (typeof origin === 'string') runtimeExternal.add(new URL(origin).origin);
  } catch {
    /* ignore malformed */
  }
});

// --- IPC (host-allowlisted) ---
ipcMain.handle('auth:openOAuth', (_e, authUrl: string) => {
  if (!allowedHost(authUrl, AUTH_HOSTS)) return; // only our auth host gets a fresh state
  const state = issueState();
  const joined = authUrl + (authUrl.includes('?') ? '&' : '?') + 'state=' + encodeURIComponent(state);
  return shell.openExternal(joined);
});

ipcMain.handle('shell:openExternal', (_e, url: string) => {
  if (allowedExternal(url)) return shell.openExternal(url);
});

// Main-process desktop notification (Web Notification is unreliable when the
// window is hidden/minimized). Clicking it refocuses the app.
ipcMain.handle('notify:show', (_e, { title, body }: { title: string; body: string }) => {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title: String(title || ''), body: String(body || '') });
  n.on('click', () => focusWindow());
  n.show();
});

// Cross-platform menu. The Edit role is REQUIRED for clipboard accelerators
// (Cmd/Ctrl+C/V/X/A, undo/redo) to work in inputs; without it they are dead.
function setupAppMenu(): void {
  const isMac = process.platform === 'darwin';
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(isMac ? [{ role: 'appMenu' as const }] : []),
      { role: 'editMenu' },
      { role: 'viewMenu' },
      { role: 'windowMenu' }
    ])
  );
}
