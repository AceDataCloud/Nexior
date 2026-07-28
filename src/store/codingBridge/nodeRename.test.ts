// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import createState from './state';
import { mergeNodeSnapshot, setNodeName } from './mutations';
import { renameNode, getNodes, applyNodeRenamed, resetAll } from './actions';
import type { ICodingBridgeNode } from '@/models';

// Stub the operators barrel: importing it for real pulls in the whole axios /
// endpoint stack, which this unit test has no need for.
const renameNodeMock = vi.fn();
const getNodesMock = vi.fn();
vi.mock('@/operators', () => ({
  codingBridgeOperator: {
    renameNode: (...args: unknown[]) => renameNodeMock(...args),
    getNodes: (...args: unknown[]) => getNodesMock(...args)
  }
}));

const node = (overrides: Partial<ICodingBridgeNode> = {}): ICodingBridgeNode => ({
  node_id: 'n1',
  name: 'old-host',
  status: 'offline',
  ...overrides
});

describe('node rename mutations', () => {
  it('setNodeName renames the matching node only', () => {
    const state = createState();
    state.nodes = [node(), node({ node_id: 'n2', name: 'other' })];

    setNodeName(state, { node_id: 'n1', name: '我的台式机' });

    expect(state.nodes[0].name).toBe('我的台式机');
    expect(state.nodes[1].name).toBe('other');
  });

  it('setNodeName ignores an unknown node', () => {
    const state = createState();
    state.nodes = [node()];
    setNodeName(state, { node_id: 'missing', name: 'x' });
    expect(state.nodes[0].name).toBe('old-host');
  });

  it('adopts the name from an online snapshot', () => {
    // The relay is authoritative: a client that was disconnected when the
    // `node.renamed` broadcast went out learns the new name from the snapshot.
    const state = createState();
    state.nodes = [node()];

    mergeNodeSnapshot(state, [node({ name: '我的台式机', status: 'online' })]);

    expect(state.nodes[0].name).toBe('我的台式机');
    expect(state.nodes[0].status).toBe('online');
  });

  it('keeps the local name when a snapshot omits it', () => {
    const state = createState();
    state.nodes = [node({ name: '我的台式机' })];

    mergeNodeSnapshot(state, [{ node_id: 'n1', status: 'online' } as ICodingBridgeNode]);

    expect(state.nodes[0].name).toBe('我的台式机');
  });
});

describe('renameNode action', () => {
  beforeEach(() => {
    renameNodeMock.mockReset();
  });

  const context = (overrides: any = {}) => ({
    commit: vi.fn(),
    dispatch: vi.fn(),
    state: createState(),
    rootState: { token: { access: 'jwt' } },
    ...overrides
  });

  it('commits the name the SERVER stored, not the one typed', async () => {
    // The server is the source of truth every other client reads back.
    const ctx = context();
    renameNodeMock.mockResolvedValue({ data: { ok: true, node_id: 'n1', name: 'server-name' } });

    await renameNode(ctx as any, { nodeId: 'n1', name: 'typed-name' });

    expect(ctx.commit).toHaveBeenCalledWith('setNodeName', { node_id: 'n1', name: 'server-name' });
  });

  it('trims the name before sending it', async () => {
    const ctx = context();
    renameNodeMock.mockResolvedValue({ data: { ok: true, node_id: 'n1', name: 'padded' } });

    await renameNode(ctx as any, { nodeId: 'n1', name: '  padded  ' });

    expect(renameNodeMock).toHaveBeenCalledWith('n1', 'padded', { token: 'jwt' });
  });

  it('rejects a whitespace-only name without calling the API', async () => {
    const ctx = context();

    await expect(renameNode(ctx as any, { nodeId: 'n1', name: '   ' })).rejects.toThrow();
    expect(renameNodeMock).not.toHaveBeenCalled();
  });

  it('does not commit a name when the request fails', async () => {
    const ctx = context();
    renameNodeMock.mockRejectedValue(new Error('boom'));

    await expect(renameNode(ctx as any, { nodeId: 'n1', name: 'x' })).rejects.toThrow('boom');
    expect(ctx.commit).not.toHaveBeenCalledWith('setNodeName', expect.anything());
  });

  it('requires authentication', async () => {
    const ctx = context({ rootState: { token: undefined } });
    await expect(renameNode(ctx as any, { nodeId: 'n1', name: 'x' })).rejects.toThrow('not authenticated');
  });
});

describe('getNodes vs a concurrent rename', () => {
  beforeEach(() => {
    renameNodeMock.mockReset();
    getNodesMock.mockReset();
    // The rename shadow map is module-level (it must outlive a single action),
    // so clear it between cases exactly as a logout would.
    resetAll({ commit: vi.fn() } as any);
  });

  const wire = (state: any) =>
    vi.fn((type: string, payload: any) => {
      if (type === 'setNodes') {
        state.nodes = payload;
      }
      if (type === 'setNodeName') {
        setNodeName(state, payload);
      }
    });

  it('an in-flight list fetched BEFORE a rename must not revert the new name', async () => {
    // Real ordering: getNodes is issued, the user renames, the stale list lands.
    const state = createState();
    state.nodes = [node()];
    const ctx = { commit: wire(state), dispatch: vi.fn(), state, rootState: { token: { access: 'jwt' } } };

    let release: (v: unknown) => void = () => undefined;
    getNodesMock.mockReturnValue(new Promise((r) => (release = r)));
    const pending = getNodes(ctx as any);

    renameNodeMock.mockResolvedValue({ data: { ok: true, node_id: 'n1', name: 'renamed' } });
    await renameNode(ctx as any, { nodeId: 'n1', name: 'renamed' });

    release({ data: { nodes: [node({ name: 'old-host' })] } });
    await pending;

    expect(state.nodes[0].name).toBe('renamed');
  });

  it('the shadow is scoped to nodes renamed DURING this request', async () => {
    // n2 was renamed here earlier and has already round-tripped; n1 is renamed
    // while this list is in flight. Only n1 may be shadowed — n2 must accept the
    // value another device just set.
    const state = createState();
    state.nodes = [node(), node({ node_id: 'n2', name: 'mine-earlier' })];
    const ctx = { commit: wire(state), dispatch: vi.fn(), state, rootState: { token: { access: 'jwt' } } };

    renameNodeMock.mockResolvedValue({ data: { ok: true, node_id: 'n2', name: 'mine-earlier' } });
    await renameNode(ctx as any, { nodeId: 'n2', name: 'mine-earlier' });

    let release: (v: unknown) => void = () => undefined;
    getNodesMock.mockReturnValue(new Promise((r) => (release = r)));
    const pending = getNodes(ctx as any);

    renameNodeMock.mockResolvedValue({ data: { ok: true, node_id: 'n1', name: 'renamed-now' } });
    await renameNode(ctx as any, { nodeId: 'n1', name: 'renamed-now' });

    release({ data: { nodes: [node({ name: 'old-host' }), node({ node_id: 'n2', name: 'from-other-device' })] } });
    await pending;

    expect(state.nodes[0].name).toBe('renamed-now');
    expect(state.nodes[1].name).toBe('from-other-device');
  });

  it('stops shadowing once the rename has round-tripped', async () => {
    // Without the cleanup the shadow is permanent: every later list would keep
    // being rewritten to our old value even mid-flight, so a rename made on
    // another device could never land.
    const state = createState();
    state.nodes = [node()];
    const ctx = { commit: wire(state), dispatch: vi.fn(), state, rootState: { token: { access: 'jwt' } } };

    renameNodeMock.mockResolvedValue({ data: { ok: true, node_id: 'n1', name: 'mine' } });
    await renameNode(ctx as any, { nodeId: 'n1', name: 'mine' });

    // One list round-trips, retiring the shadow.
    getNodesMock.mockResolvedValue({ data: { nodes: [node({ name: 'mine' })] } });
    await getNodes(ctx as any);

    // A LATER list is now in flight when nothing local is pending. Even though
    // the map would still hold 'mine' without the cleanup, the other device's
    // name must win.
    let release: (v: unknown) => void = () => undefined;
    getNodesMock.mockReturnValue(new Promise((r) => (release = r)));
    const pending = getNodes(ctx as any);
    release({ data: { nodes: [node({ name: 'from-other-device' })] } });
    await pending;

    expect(state.nodes[0].name).toBe('from-other-device');
  });

  it('a broadcast from another client clears the local shadow', async () => {
    const state = createState();
    state.nodes = [node()];
    const ctx = { commit: wire(state), dispatch: vi.fn(), state, rootState: { token: { access: 'jwt' } } };

    renameNodeMock.mockResolvedValue({ data: { ok: true, node_id: 'n1', name: 'mine' } });
    await renameNode(ctx as any, { nodeId: 'n1', name: 'mine' });
    applyNodeRenamed(ctx.commit, 'n1', 'theirs');

    getNodesMock.mockResolvedValue({ data: { nodes: [node({ name: 'theirs' })] } });
    await getNodes(ctx as any);

    expect(state.nodes[0].name).toBe('theirs');
  });

  it('a list with no rename in flight applies the server names as-is', async () => {
    const state = createState();
    const ctx = { commit: wire(state), dispatch: vi.fn(), state, rootState: { token: { access: 'jwt' } } };
    getNodesMock.mockResolvedValue({ data: { nodes: [node({ name: 'from-server' })] } });

    await getNodes(ctx as any);

    expect(state.nodes[0].name).toBe('from-server');
  });
});
