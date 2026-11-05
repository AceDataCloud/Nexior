import { describe, expect, it } from 'vitest';
import { feedbackHref, supportContactHref } from './support';

describe('site support destinations', () => {
  it('uses only the current site and prefers its feedback link over support/email', () => {
    expect(feedbackHref()).toBe('');
    expect(feedbackHref({ branding: { contacts: [{ type: 'wechat', qr: 'https://tenant.test/qr.png' }] } })).toBe('');
    expect(
      feedbackHref({
        branding: {
          links: { support: 'https://tenant.test/help' },
          contacts: [
            { type: 'email', value: 'help@tenant.test' },
            { type: 'feedback', url: 'https://tenant.test/feedback' }
          ]
        }
      })
    ).toBe('https://tenant.test/feedback');
    expect(feedbackHref({ branding: { contacts: [{ type: 'email', value: 'help@tenant.test' }] } })).toBe(
      'mailto:help@tenant.test'
    );
  });

  it('rejects executable URLs and keeps phone/email links on their own schemes', () => {
    expect(supportContactHref({ type: 'feedback', url: 'javascript:alert(1)' })).toBe('');
    expect(supportContactHref({ type: 'phone', value: '+86 123 456' })).toBe('tel:+86123456');
    expect(supportContactHref({ type: 'email', value: 'help@tenant.test?bcc=other@tenant.test' })).toBe('');
    expect(supportContactHref({ type: 'hours', value: 'Mon–Fri 09:00–18:00' })).toBe('');
  });
});
