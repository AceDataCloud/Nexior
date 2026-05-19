/**
 * Detection helpers for WeChat payment flows.
 *
 * WeChat Pay surfaces:
 *   - "pc"    -> Native QR-code pay (desktop browser scan).
 *   - "jsapi" -> In-WeChat browser JSAPI pay (requires openid).
 *
 * H5 ("wap") is intentionally NOT exposed here because our merchant
 * account does not have H5 pay enabled. For mobile browsers outside
 * WeChat, the UI should guide the user to open the link in WeChat.
 *
 * Note: do not conflate this with `src/utils/surface.ts`, which is a
 * Capacitor build-time surface flag (web/android/ios) — unrelated to
 * the runtime WeChat detection here.
 */

/** True when the current page is running inside the WeChat in-app browser. */
export function isInWeChat(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /MicroMessenger/i.test(navigator.userAgent || '');
}

/** True when the current user-agent looks like a mobile browser. */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /(iPhone|iPad|iPod|Android|HarmonyOS|Mobile|Windows Phone|BlackBerry|Opera Mini)/i.test(
    navigator.userAgent || ''
  );
}

/**
 * Returns the WeChat pay surface that the backend should use.
 *
 * - "jsapi" inside the WeChat in-app browser (will also require openid).
 * - "pc"    everywhere else, including mobile browsers outside WeChat —
 *           the frontend then renders a guide to open the link in WeChat
 *           rather than attempting H5 pay.
 */
export function getWechatPaySurface(): 'pc' | 'jsapi' {
  return isInWeChat() ? 'jsapi' : 'pc';
}

/** Payload returned by PayBackend when surface=jsapi (serialized in pay_url). */
export interface IWechatJsapiPayload {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA';
  paySign: string;
}

/**
 * Attempt to parse `pay_url` as a WeChat JSAPI payload. Returns null when the
 * value is not JSON (e.g. a Native `weixin://...` URL or empty).
 */
export function parseJsapiPayload(payUrl: string | null | undefined): IWechatJsapiPayload | null {
  if (!payUrl || typeof payUrl !== 'string') {
    return null;
  }
  const trimmed = payUrl.trim();
  if (!trimmed.startsWith('{')) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.appId === 'string' &&
      typeof parsed.timeStamp === 'string' &&
      typeof parsed.nonceStr === 'string' &&
      typeof parsed.package === 'string' &&
      typeof parsed.paySign === 'string'
    ) {
      return parsed as IWechatJsapiPayload;
    }
  } catch {
    return null;
  }
  return null;
}

interface IWeixinJSBridge {
  invoke(
    api: 'getBrandWCPayRequest',
    payload: IWechatJsapiPayload,
    callback: (res: { err_msg?: string; errMsg?: string }) => void
  ): void;
}

declare global {
  interface Window {
    WeixinJSBridge?: IWeixinJSBridge;
  }
}

export type WechatJsapiResult = 'ok' | 'cancel' | 'fail';

/**
 * Invoke the WeChat in-app JSAPI bridge to launch the pay UI.
 *
 * Resolves with:
 *   - "ok"     when the user successfully paid
 *   - "cancel" when the user dismissed the pay sheet
 *   - "fail"   for any other error
 *
 * Rejects only if the bridge is unavailable after waiting for ready.
 */
export function invokeWechatJsapi(payload: IWechatJsapiPayload): Promise<WechatJsapiResult> {
  return new Promise((resolve, reject) => {
    const run = () => {
      const bridge = window.WeixinJSBridge;
      if (!bridge) {
        reject(new Error('WeixinJSBridge unavailable'));
        return;
      }
      bridge.invoke('getBrandWCPayRequest', payload, (res) => {
        const msg = res?.err_msg ?? res?.errMsg ?? '';
        if (msg === 'get_brand_wcpay_request:ok') {
          resolve('ok');
        } else if (msg === 'get_brand_wcpay_request:cancel') {
          resolve('cancel');
        } else {
          resolve('fail');
        }
      });
    };

    if (window.WeixinJSBridge) {
      run();
    } else {
      const handler = () => {
        document.removeEventListener('WeixinJSBridgeReady', handler);
        run();
      };
      document.addEventListener('WeixinJSBridgeReady', handler, false);
    }
  });
}
