// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConnectorConsentCard from './ConnectorConsentCard.vue';
import type { IConsentRequestPayload } from '@/models';

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
