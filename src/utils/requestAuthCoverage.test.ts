import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = (path: string) => readFileSync(resolve(root, path), 'utf8');

const PROTECTED_RAW_REQUESTS: Record<string, string[]> = {
  'operators/chat.ts': ['requireServiceToken(options.token)'],
  'utils/speechRecognition.ts': ['requireServiceToken(token)'],
  'utils/realtimeClient.ts': ['requireServiceToken(this.token)'],
  'utils/codingBridgeSocket.ts': ['requireAccountToken()'],
  'components/common/ApiCodeDialog.vue': ['requireServiceToken(this.token)'],
  'pages/chat/Conversation.vue': ['requireAccountToken()'],
  'pages/console/usage/List.vue': ['requireAccountToken()'],
  'components/fish/model/Recorder.vue': ['requireAccountToken()'],
  'components/suno/config/UploadAudio.vue': ['requireAccountToken()']
};

const EXPLICIT_ANONYMOUS_RAW_REQUESTS: Record<string, string[]> = {
  'operators/chat.ts': [`fetch(\`${'${BASE_URL_API}'}/aichat2/shared\``],
  'pages/chat/Conversation.vue': [`fetch(\`${'${BASE_URL_API}'}/aichat2/health\`)`]
};

describe('request auth coverage', () => {
  it.each(Object.entries(PROTECTED_RAW_REQUESTS))('%s classifies protected raw requests', (path, markers) => {
    const content = source(path);
    for (const marker of markers) expect(content).toContain(marker);
  });

  it.each(Object.entries(EXPLICIT_ANONYMOUS_RAW_REQUESTS))(
    '%s keeps reviewed anonymous requests explicit',
    (path, markers) => {
      const content = source(path);
      for (const marker of markers) expect(content).toContain(marker);
    }
  );

  it('keeps anonymous and optional mutations on the reviewed bootstrap allowlist', () => {
    const operatorDir = resolve(root, 'operators');
    const found = readdirSync(operatorDir)
      .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
      .flatMap((name) => {
        const content = readFileSync(resolve(operatorDir, name), 'utf8');
        return [
          ...content.matchAll(/(anonymousHttpClient|optionalHttpClient)\.(post|put|patch|delete)\(([^\n]+)/g)
        ].map((match) => `${name}:${match[1]}.${match[2]}:${match[3].trim()}`);
      })
      .sort();
    expect(found).toEqual(
      [
        "attribution.ts:anonymousHttpClient.post:'/attribution/resolve/', payload);",
        "auth.ts:anonymousHttpClient.post:'/auth/refresh/', payload);",
        "auth.ts:anonymousHttpClient.post:'/token', payload, {",
        "exchange.ts:anonymousHttpClient.post:'/exchange-rate', payload);",
        'site.ts:optionalHttpClient.post:`/${this.key}/initialize/`, data);'
      ].sort()
    );
  });

  it('keeps every WebSocket constructor on the protected allowlist', () => {
    const utilsDir = resolve(root, 'utils');
    const found = readdirSync(utilsDir)
      .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
      .filter((name) => readFileSync(resolve(utilsDir, name), 'utf8').includes('new WebSocket'))
      .sort();
    expect(found).toEqual(['codingBridgeSocket.ts', 'realtimeClient.ts']);
  });

  it('installs the default Axios service guard before bootstrap requests', () => {
    const main = source('main.ts');
    expect(main.indexOf('configureRequestAuth({')).toBeGreaterThan(-1);
    expect(main.indexOf('installServiceRequestAuthGuard();')).toBeGreaterThan(-1);
    expect(main.indexOf('installServiceRequestAuthGuard();')).toBeLessThan(main.indexOf('resolveDeferredInviterId()'));
  });
});
