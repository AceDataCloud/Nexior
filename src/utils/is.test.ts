// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { hasMeaningfulText, isMainOfficial, isOfficial, isSubOfficial } from './is';

function setHost(host: string) {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { host, hostname: host.split(':')[0] }
  });
}

describe('Studio host ownership', () => {
  it.each([
    ['studio.acedata.cloud', true, false],
    ['20260824.studio.acedata.cloud', true, true],
    ['tenant.studio.acedata.cloud', true, true],
    ['evil-studio.acedata.cloud', false, false],
    ['studio.acedata.cloud.evil.example', false, false],
    ['hub.acedata.cloud', false, false]
  ])('%s official=%s sub=%s', (host, official, sub) => {
    setHost(host);
    expect(isOfficial()).toBe(official);
    expect(isSubOfficial()).toBe(sub);
    expect(isMainOfficial()).toBe(host === 'studio.acedata.cloud');
  });
});

describe('meaningful text', () => {
  it.each([undefined, null, 0, false, '', ' ', '\t\n'])('rejects %j', (value) => {
    expect(hasMeaningfulText(value)).toBe(false);
  });

  it.each(['banana', '  banana  ', '香蕉提示词'])('accepts %j', (value) => {
    expect(hasMeaningfulText(value)).toBe(true);
  });
});
