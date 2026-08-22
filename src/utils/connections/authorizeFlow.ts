import { Browser } from '@capacitor/browser';
import { isDesktop, isNative } from '../surface';
import { desktopBridge, type ConnectorCallbackResult } from '../desktop';
import { getBaseUrlAuth } from '../baseUrl';
import { isAuthFrontendUrl, withAuthFrontendSession } from '../authHandoff';
import { cancelConnectorCallbackWait, waitForConnectorCallback } from './connectorCallback';
import { openAuthorizePopup } from './authorizePopup';

export interface PreparedAuthorizeFlow {
  returnUrl: string;
  requestId?: string;
}

export type AuthorizeFlowResult = ConnectorCallbackResult | { status: 'unknown' };

export async function prepareAuthorizeFlow(
  connector: string,
  fallbackReturnUrl: string,
  flowKey?: string
): Promise<PreparedAuthorizeFlow> {
  if (isNative()) {
    const requestId = crypto.randomUUID();
    const callback = new URL('/connections/popup-return', getBaseUrlAuth());
    callback.searchParams.set('native_request_id', requestId);
    callback.searchParams.set('connector', connector);
    if (flowKey) callback.searchParams.set('flow_key', flowKey);
    return { returnUrl: callback.toString(), requestId };
  }
  if (!isDesktop()) return { returnUrl: fallbackReturnUrl };
  const bridge = desktopBridge();
  if (!bridge?.createConnectorCallback) throw new Error('desktop-authorize-unsupported');
  const prepared = await bridge.createConnectorCallback(connector, flowKey);
  if (!prepared) throw new Error('desktop-authorize-unsupported');
  return { returnUrl: prepared.returnUrl, requestId: prepared.requestId };
}

export async function openAuthorizeFlow(
  authorizationUrl: string,
  requestId?: string,
  waitForResult = true
): Promise<AuthorizeFlowResult> {
  if (isDesktop()) return openOnDesktop(authorizationUrl, requestId, waitForResult);
  if (isNative()) return openOnNative(authorizationUrl, requestId, waitForResult);
  return openOnWeb(authorizationUrl);
}

function authHandoffTarget(authorizationUrl: string): string | Promise<string> {
  return isAuthFrontendUrl(authorizationUrl) ? withAuthFrontendSession(authorizationUrl) : authorizationUrl;
}

async function openOnWeb(authorizationUrl: string): Promise<AuthorizeFlowResult> {
  const target = authHandoffTarget(authorizationUrl);
  const pending = openAuthorizePopup(target);
  if (!pending) {
    window.location.href = await target;
    return { status: 'unknown' };
  }
  await pending;
  return { status: 'unknown' };
}

async function openOnNative(
  authorizationUrl: string,
  requestId?: string,
  waitForResult = true
): Promise<AuthorizeFlowResult> {
  let handle: { remove: () => Promise<void> } | undefined;
  try {
    const finished = new Promise<{ status: 'unknown' }>((resolve) => {
      void Browser.addListener('browserFinished', () => resolve({ status: 'unknown' })).then((value) => {
        handle = value;
      });
    });
    await Browser.open({ url: await authHandoffTarget(authorizationUrl) });
    if (!requestId || !waitForResult) return await finished;
    return await Promise.race([waitForConnectorCallback(requestId), finished]);
  } catch (error) {
    if (requestId) cancelConnectorCallbackWait(requestId);
    console.warn('in-app browser failed for connector authorize', error);
    return { status: 'unknown' };
  } finally {
    await handle?.remove();
  }
}

async function openOnDesktop(
  authorizationUrl: string,
  requestId?: string,
  waitForResult = true
): Promise<AuthorizeFlowResult> {
  const bridge = desktopBridge();
  if (!bridge?.openAuthorizeConnector || !requestId) {
    throw new Error('desktop-authorize-unsupported');
  }
  const target = await authHandoffTarget(authorizationUrl);
  if (!waitForResult) {
    await bridge.openAuthorizeConnector(target);
    return { status: 'unknown' };
  }
  const completed = waitForConnectorCallback(requestId);
  let timer: number | undefined;
  const expired = new Promise<never>((_resolve, reject) => {
    timer = window.setTimeout(
      () => {
        cancelConnectorCallbackWait(requestId);
        reject(new Error('desktop-authorize-expired'));
      },
      10 * 60 * 1000
    );
  });
  try {
    await bridge.openAuthorizeConnector(target);
    return await Promise.race([completed, expired]);
  } catch (error) {
    cancelConnectorCallbackWait(requestId);
    throw error;
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
}
