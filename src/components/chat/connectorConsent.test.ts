import { describe, expect, it } from 'vitest';
import { buildConsentOutput, isAllSatisfied, unsatisfiedConnectors } from './connectorConsent';
import type { IConsentRequestPayload } from '@/models';

const REQUIRE_GMAIL: IConsentRequestPayload = {
  consent_request_id: 'req-1',
  rationale: 'Send the email',
  requirements: [
    {
      requirement_index: 0,
      match: 'any',
      satisfied: false,
      entries: [
        {
          connector: 'acedatacloud/gmail',
          catalog_id: 'cat_gmail',
          status: 'unconnected',
          install_url: 'https://example.com/oauth/gmail'
        },
        {
          connector: 'acedatacloud/outlook',
          catalog_id: 'cat_outlook',
          status: 'unconnected',
          install_url: 'https://example.com/oauth/outlook'
        }
      ]
    }
  ]
};

const REQUIRE_GMAIL_AND_DRIVE: IConsentRequestPayload = {
  consent_request_id: 'req-2',
  requirements: [
    {
      requirement_index: 0,
      match: 'all',
      satisfied: false,
      entries: [
        { connector: 'acedatacloud/gmail', catalog_id: 'cat_gmail', status: 'connected' },
        {
          connector: 'acedatacloud/drive',
          catalog_id: 'cat_drive',
          status: 'unconnected',
          install_url: 'https://x/drive'
        }
      ]
    },
    {
      requirement_index: 1,
      match: 'any',
      satisfied: true,
      entries: [{ connector: 'acedatacloud/calendar', catalog_id: 'cat_calendar', status: 'connected' }]
    }
  ]
};

describe('unsatisfiedConnectors', () => {
  it('returns each unconnected connector once across unsatisfied requirements', () => {
    expect(unsatisfiedConnectors(REQUIRE_GMAIL)).toEqual(['acedatacloud/gmail', 'acedatacloud/outlook']);
  });

  it('skips connectors inside already-satisfied requirements', () => {
    // requirement_index=1 is satisfied so calendar must NOT appear; gmail is
    // connected so it must NOT appear; only drive (unconnected, unsatisfied
    // requirement) should be returned.
    expect(unsatisfiedConnectors(REQUIRE_GMAIL_AND_DRIVE)).toEqual(['acedatacloud/drive']);
  });

  it('deduplicates the same connector listed under multiple requirements', () => {
    const dup: IConsentRequestPayload = {
      consent_request_id: 'req-3',
      requirements: [
        {
          requirement_index: 0,
          match: 'any',
          satisfied: false,
          entries: [{ connector: 'acedatacloud/gmail', catalog_id: 'cat_gmail', status: 'unconnected' }]
        },
        {
          requirement_index: 1,
          match: 'any',
          satisfied: false,
          entries: [{ connector: 'acedatacloud/gmail', catalog_id: 'cat_gmail', status: 'unconnected' }]
        }
      ]
    };
    expect(unsatisfiedConnectors(dup)).toEqual(['acedatacloud/gmail']);
  });

  it('returns [] when there are no requirements', () => {
    expect(unsatisfiedConnectors({ consent_request_id: 'r', requirements: [] })).toEqual([]);
  });
});

describe('buildConsentOutput', () => {
  it('produces the worker-contract JSON shape', () => {
    const raw = buildConsentOutput(REQUIRE_GMAIL, ['acedatacloud/gmail'], []);
    expect(JSON.parse(raw)).toEqual({
      consent_request_id: 'req-1',
      authorized: ['acedatacloud/gmail'],
      skipped: []
    });
  });

  it('echoes the consent_request_id on Skip', () => {
    const raw = buildConsentOutput(REQUIRE_GMAIL, [], ['acedatacloud/gmail', 'acedatacloud/outlook']);
    expect(JSON.parse(raw)).toEqual({
      consent_request_id: 'req-1',
      authorized: [],
      skipped: ['acedatacloud/gmail', 'acedatacloud/outlook']
    });
  });
});

describe('isAllSatisfied', () => {
  it('is false when any requirement is unsatisfied', () => {
    expect(isAllSatisfied(REQUIRE_GMAIL)).toBe(false);
    expect(isAllSatisfied(REQUIRE_GMAIL_AND_DRIVE)).toBe(false);
  });

  it('is true when every requirement is satisfied', () => {
    const allOk: IConsentRequestPayload = {
      consent_request_id: 'r',
      requirements: [
        {
          requirement_index: 0,
          match: 'any',
          satisfied: true,
          entries: [{ connector: 'acedatacloud/x', catalog_id: 'cat_x', status: 'connected' }]
        }
      ]
    };
    expect(isAllSatisfied(allOk)).toBe(true);
  });

  it('is true when there are no requirements (nothing to satisfy)', () => {
    expect(isAllSatisfied({ consent_request_id: 'r', requirements: [] })).toBe(true);
  });
});
