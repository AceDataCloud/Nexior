// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock `connectorCatalogCache` so the card's mount-time
// `refreshCatalogs` (and the new `refreshConnectionStatuses`) don't
// hit the real `httpClient`. Tests opt into specific return values via
// the `mockResolvedValue` hooks below.
vi.mock('./connectorCatalogCache', () => ({
  getCatalogItem: vi.fn().mockResolvedValue(undefined),
  installFromCatalog: vi.fn(),
  listMyConnections: vi.fn().mockResolvedValue([])
}));

import ConnectorConsentCard from './ConnectorConsentCard.vue';
import { listMyConnections } from './connectorCatalogCache';
import type { IConsentRequestPayload } from '@/models';

const mockedListMyConnections = vi.mocked(listMyConnections);

// Minimal globals: stub $t to echo the key (+ list of params), and stub
// FontAwesomeIcon so the test environment doesn't need the icon registry.
const global = {
  mocks: {
    $t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        const list = Object.entries(params)
          .map(([k, v]) => `${k}=${String(v)}`)
          .join(',');
        return `${key}{${list}}`;
      }
      return key;
    }
  },
  stubs: {
    FontAwesomeIcon: { template: '<i />' }
  }
};

const PAYLOAD_TWO_OPTIONS: IConsentRequestPayload = {
  consent_request_id: 'req-1',
  rationale: 'Send your weekly digest',
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
          install_url: 'https://example.com/gmail'
        },
        {
          connector: 'acedatacloud/outlook',
          catalog_id: 'cat_outlook',
          status: 'unconnected',
          install_url: 'https://example.com/outlook'
        }
      ]
    }
  ]
};

const PAYLOAD_SATISFIED: IConsentRequestPayload = {
  consent_request_id: 'req-2',
  requirements: [
    {
      requirement_index: 0,
      match: 'any',
      satisfied: true,
      entries: [{ connector: 'acedatacloud/gmail', catalog_id: 'cat_gmail', status: 'connected' }]
    }
  ]
};

describe('ConnectorConsentCard', () => {
  it('renders the rationale and each entry row', () => {
    const wrapper = mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_TWO_OPTIONS },
      global
    });
    expect(wrapper.text()).toContain('Send your weekly digest');
    expect(wrapper.findAllComponents({ name: 'ConnectorEntryRow' }).length).toBe(2);
  });

  it('shows the matchAny label when 2+ unsatisfied entries are alternatives', () => {
    const wrapper = mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_TWO_OPTIONS },
      global
    });
    expect(wrapper.find('.ccc-req-match').exists()).toBe(true);
    expect(wrapper.find('.ccc-req-match').text()).toBe('chat.consent.matchAny');
  });

  it('hides the match label when the requirement is already satisfied', () => {
    const wrapper = mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_SATISFIED },
      global
    });
    expect(wrapper.find('.ccc-req-match').exists()).toBe(false);
  });

  it('Skip emits submit with the worker-contract output and all unsatisfied connectors marked skipped', async () => {
    const wrapper = mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_TWO_OPTIONS },
      global
    });
    await wrapper.find('.ccc-actions button').trigger('click');
    const emitted = wrapper.emitted('submit');
    expect(emitted).toBeTruthy();
    const evt = emitted![0][0] as { tool_use_id: string; output: string };
    expect(evt.tool_use_id).toBe('tu-1');
    expect(JSON.parse(evt.output)).toEqual({
      consent_request_id: 'req-1',
      authorized: [],
      skipped: ['acedatacloud/gmail', 'acedatacloud/outlook']
    });
  });

  it('does NOT render the Skip button when all requirements are already satisfied', () => {
    const wrapper = mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_SATISFIED },
      global
    });
    expect(wrapper.find('.ccc-actions').exists()).toBe(false);
  });

  it('does NOT render the Skip button in the resolved view', () => {
    const wrapper = mount(ConnectorConsentCard, {
      props: {
        toolUseId: 'tu-1',
        payload: PAYLOAD_TWO_OPTIONS,
        resolved: true,
        previousOutput: JSON.stringify({
          consent_request_id: 'req-1',
          authorized: ['acedatacloud/gmail'],
          skipped: ['acedatacloud/outlook']
        })
      },
      global
    });
    expect(wrapper.find('.ccc-actions').exists()).toBe(false);
  });

  it('renders the resolvedAuthorized banner when previous output authorized a connector', () => {
    const wrapper = mount(ConnectorConsentCard, {
      props: {
        toolUseId: 'tu-1',
        payload: PAYLOAD_TWO_OPTIONS,
        resolved: true,
        previousOutput: JSON.stringify({
          consent_request_id: 'req-1',
          authorized: ['acedatacloud/gmail'],
          skipped: []
        })
      },
      global
    });
    expect(wrapper.find('.ccc-resolved-banner').text()).toContain(
      'chat.consent.resolvedAuthorized{list=acedatacloud/gmail}'
    );
  });

  it('renders the resolvedSkipped banner when previous output was all-skip', () => {
    const wrapper = mount(ConnectorConsentCard, {
      props: {
        toolUseId: 'tu-1',
        payload: PAYLOAD_TWO_OPTIONS,
        resolved: true,
        previousOutput: JSON.stringify({
          consent_request_id: 'req-1',
          authorized: [],
          skipped: ['acedatacloud/gmail', 'acedatacloud/outlook']
        })
      },
      global
    });
    expect(wrapper.find('.ccc-resolved-banner').text()).toBe('chat.consent.resolvedSkipped');
  });

  it('forwards the authorize event from a child row with the entry payload', async () => {
    const wrapper = mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_TWO_OPTIONS },
      global
    });
    const rows = wrapper.findAllComponents({ name: 'ConnectorEntryRow' });
    rows[0].vm.$emit('authorize', PAYLOAD_TWO_OPTIONS.requirements[0].entries[0]);
    const emitted = wrapper.emitted('authorize');
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toEqual({
      tool_use_id: 'tu-1',
      entry: PAYLOAD_TWO_OPTIONS.requirements[0].entries[0]
    });
  });
});

describe('ConnectorConsentCard — post-OAuth status refresh', () => {
  // jsdom's default URL (``about:blank``) refuses ``replaceState`` to
  // any cross-origin target, so we stub ``window.location`` directly
  // via ``defineProperty``. The card only reads ``href`` so a URL
  // instance is sufficient — `.assign` / `.replace` are unused.
  const originalLocation = window.location;
  const setLocation = (href: string): void => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: new URL(href)
    });
  };

  beforeEach(() => {
    mockedListMyConnections.mockReset();
    mockedListMyConnections.mockResolvedValue([]);
  });
  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation
    });
  });

  it('does NOT refresh when the URL is missing the consent beacon', async () => {
    setLocation('http://localhost/chat');
    mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_TWO_OPTIONS },
      global
    });
    await flushPromises();
    expect(mockedListMyConnections).not.toHaveBeenCalled();
  });

  it('does NOT refresh when ?consent= belongs to a different consent_request_id', async () => {
    setLocation('http://localhost/chat?consent=req-other');
    mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_TWO_OPTIONS },
      global
    });
    await flushPromises();
    expect(mockedListMyConnections).not.toHaveBeenCalled();
  });

  it('flips the matching entry to Connected and shows Continue when the live API returns an active connection', async () => {
    setLocation('http://localhost/chat?consent=req-1');
    mockedListMyConnections.mockResolvedValue([
      { id: 'conn-1', connector_identifier: 'acedatacloud/gmail', status: 'active' }
    ]);
    const wrapper = mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_TWO_OPTIONS },
      global
    });
    await flushPromises();
    expect(mockedListMyConnections).toHaveBeenCalledTimes(1);
    const rows = wrapper.findAllComponents({ name: 'ConnectorEntryRow' });
    // First entry (gmail) is now connected, second (outlook) stays unconnected.
    expect((rows[0].props('entry') as { status: string }).status).toBe('connected');
    expect((rows[1].props('entry') as { status: string }).status).toBe('unconnected');
    // Requirement is `match: 'any'` so one connected entry satisfies it →
    // Continue button surfaces; Skip is hidden because nothing's left
    // to skip.
    const actionButtons = wrapper.findAll('.ccc-actions button');
    expect(actionButtons.length).toBe(1);
    expect(actionButtons[0].text()).toBe('chat.consent.continue');
  });

  it('keeps Skip + hides Continue when the live API still reports no active connection', async () => {
    setLocation('http://localhost/chat?consent=req-1');
    mockedListMyConnections.mockResolvedValue([
      // expired / revoked rows are ignored by the case-insensitive `active` check.
      { id: 'conn-1', connector_identifier: 'acedatacloud/gmail', status: 'expired' }
    ]);
    const wrapper = mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_TWO_OPTIONS },
      global
    });
    await flushPromises();
    const actionButtons = wrapper.findAll('.ccc-actions button');
    expect(actionButtons.length).toBe(1);
    expect(actionButtons[0].text()).toBe('chat.consent.skip');
  });

  it('Continue emits submit with all effectively-connected connectors marked authorized', async () => {
    setLocation('http://localhost/chat?consent=req-1');
    mockedListMyConnections.mockResolvedValue([
      { id: 'conn-1', connector_identifier: 'acedatacloud/gmail', status: 'ACTIVE' }
    ]);
    const wrapper = mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_TWO_OPTIONS },
      global
    });
    await flushPromises();
    await wrapper.find('.ccc-actions button').trigger('click');
    const emitted = wrapper.emitted('submit');
    expect(emitted).toBeTruthy();
    const evt = emitted![0][0] as { tool_use_id: string; output: string };
    expect(evt.tool_use_id).toBe('tu-1');
    expect(JSON.parse(evt.output)).toEqual({
      consent_request_id: 'req-1',
      authorized: ['acedatacloud/gmail'],
      skipped: []
    });
  });

  it('swallows refresh errors without surfacing Continue', async () => {
    setLocation('http://localhost/chat?consent=req-1');
    mockedListMyConnections.mockRejectedValue(new Error('network down'));
    // Silence the expected console.warn from `refreshConnectionStatuses`.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mount(ConnectorConsentCard, {
      props: { toolUseId: 'tu-1', payload: PAYLOAD_TWO_OPTIONS },
      global
    });
    await flushPromises();
    expect(mockedListMyConnections).toHaveBeenCalledTimes(1);
    // No Continue button — overlay never landed.
    const actionButtons = wrapper.findAll('.ccc-actions button');
    expect(actionButtons.length).toBe(1);
    expect(actionButtons[0].text()).toBe('chat.consent.skip');
    warnSpy.mockRestore();
  });
});
