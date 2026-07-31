// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import Conversation from './Conversation.vue';
import { Status } from '@/models';
import type { LocalToolSpec } from '@/utils/desktop';

// Desktop surface: `supportsClientTools()` gates the whole injection.
vi.mock('@/utils/surface', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, supportsClientTools: () => true };
});

vi.mock('@/operators', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, chatOperator: { chatConversation: vi.fn(() => new Promise(() => undefined)) } };
});

const spec = (name: string, source: 'builtin' | 'mcp'): LocalToolSpec => ({
  name,
  description: `desc for ${name}`,
  input_schema: { type: 'object', properties: { a: { type: 'string' } } },
  source,
  mutates: false
});

const mountComponent = () =>
  shallowMount(Conversation, {
    global: {
      stubs: {
        Layout: { template: '<main><slot name="chat" /></main>' },
        ElSkeleton: { template: '<div><slot name="template" /></div>' },
        ElSkeletonItem: { template: '<span />' }
      },
      mocks: {
        $t: (key: string) => key,
        $route: { matched: [{ path: '/chatgpt' }], params: { id: 'c1' }, path: '/chatgpt/conversations/c1', query: {} },
        $router: { push: vi.fn(), replace: vi.fn() },
        $store: {
          commit: vi.fn(),
          dispatch: vi.fn(() => Promise.resolve(undefined)),
          getters: { authenticated: true },
          state: {
            chat: {
              application: undefined,
              applications: undefined,
              conversations: [],
              credential: { token: 't' },
              memoryEnabled: true,
              model: undefined,
              modelGroup: undefined,
              service: undefined,
              status: { getApplications: Status.None }
            }
          }
        }
      }
    }
  });

describe('Conversation._localToolInjection — local MCP is deferred', () => {
  let wrapper: ReturnType<typeof mountComponent>;

  beforeEach(() => {
    wrapper = mountComponent();
  });
  afterEach(() => wrapper?.unmount());

  // `supported` mirrors the /health probe: false until a worker confirms it
  // understands `local_mcp_servers`.
  const inject = (tools: LocalToolSpec[], supported = true) => {
    const vm = wrapper.vm as unknown as {
      localTools: LocalToolSpec[];
      localMcpDeferSupported: boolean;
      _localToolInjection(): {
        client_tools?: { name: string }[];
        local_mcp_servers?: { id: string; tools: { name: string }[] }[];
      };
    };
    vm.localTools = tools;
    vm.localMcpDeferSupported = supported;
    return vm._localToolInjection();
  };

  it('returns nothing when there are no local tools', () => {
    expect(inject([])).toEqual({});
  });

  it('sends builtin tools eagerly in client_tools', () => {
    const out = inject([spec('fs.read_file', 'builtin'), spec('shell.run_command', 'builtin')]);
    expect(out.client_tools?.map((t) => t.name)).toEqual(['fs_read_file', 'shell_run_command']);
    expect(out.local_mcp_servers).toBeUndefined();
  });

  it('sends MCP tools as per-server summaries, NOT in client_tools', () => {
    const out = inject([
      spec('fs.read_file', 'builtin'),
      spec('mcp.playwright.browser_click', 'mcp'),
      spec('mcp.playwright.browser_type', 'mcp'),
      spec('mcp.github.create_issue', 'mcp')
    ]);
    // The whole point: MCP schemas must not ride along on every turn.
    expect(out.client_tools?.map((t) => t.name)).toEqual(['fs_read_file']);
    expect(out.local_mcp_servers?.map((s) => s.id).sort()).toEqual(['github', 'playwright']);
    const pw = out.local_mcp_servers?.find((s) => s.id === 'playwright');
    expect(pw?.tools.map((t) => t.name)).toEqual(['mcp_playwright_browser_click', 'mcp_playwright_browser_type']);
  });

  it('omits client_tools entirely when only MCP tools exist', () => {
    const out = inject([spec('mcp.srv.a', 'mcp')]);
    expect(out.client_tools).toBeUndefined();
    expect(out.local_mcp_servers).toHaveLength(1);
  });

  it('keeps wire names unique and injective across BOTH buckets', () => {
    // A builtin and an MCP tool that sanitize to the same wire name must not
    // collide — _runClientTools maps the echoed wire name back to the dotted
    // one, so a duplicate would dispatch to the wrong tool.
    const out = inject([spec('mcp.a.b', 'mcp'), spec('mcp.a:b', 'mcp')]);
    const names = out.local_mcp_servers!.flatMap((s) => s.tools.map((t) => t.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('groups by server id even when the tool name itself contains dots', () => {
    const out = inject([spec('mcp.srv.deep.nested.tool', 'mcp')]);
    expect(out.local_mcp_servers?.[0].id).toBe('srv');
  });

  it('falls back to inlining MCP schemas when the worker has not confirmed support', () => {
    // An older worker ignores `local_mcp_servers` silently, so deferring
    // unconditionally would make local MCP tools disappear with no error.
    const out = inject([spec('fs.read_file', 'builtin'), spec('mcp.playwright.click', 'mcp')], false);
    expect(out.client_tools?.map((t) => t.name)).toEqual(['fs_read_file', 'mcp_playwright_click']);
    // Summaries still ride along so a NEW worker can defer from the first turn.
    expect(out.local_mcp_servers?.[0].id).toBe('playwright');
  });
});

describe('Conversation.onProbeWorkerFeatures', () => {
  let wrapper: ReturnType<typeof mountComponent>;
  beforeEach(() => {
    wrapper = mountComponent();
  });
  afterEach(() => {
    wrapper?.unmount();
    vi.unstubAllGlobals();
  });

  // The probe only runs when a local MCP tool exists to defer, so every case
  // seeds one first.
  const probe = async (tools: LocalToolSpec[] = [spec('mcp.srv.a', 'mcp')]) => {
    const vm = wrapper.vm as unknown as {
      localTools: LocalToolSpec[];
      localMcpDeferSupported: boolean;
      localMcpProbed: boolean;
      onProbeWorkerFeatures(): Promise<void>;
    };
    vm.localTools = tools;
    await vm.onProbeWorkerFeatures();
    return vm.localMcpDeferSupported;
  };

  it('enables deferral when the worker advertises the feature', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ features: ['local_mcp_servers'] }) }))
    );
    expect(await probe()).toBe(true);
  });

  it('stays off for a worker that does not advertise it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ status: 'ok' }) }))
    );
    expect(await probe()).toBe(false);
  });

  it('does not fire at all without a local MCP server to defer', async () => {
    // A pointless request shows up as a console error wherever the endpoint
    // isn't reachable — which broke the Local Tools E2E smoke test.
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    expect(await probe([spec('fs.read_file', 'builtin')])).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('probes at most once per session', async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({ features: [] }) }));
    vi.stubGlobal('fetch', fetchSpy);
    await probe();
    await probe();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('stays off when the probe fails (offline / blocked)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );
    expect(await probe()).toBe(false);
  });
});
