import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyCommand, bootstrap, cancelRun, confirmDryRun, rejectProposal } from './actions';
import { poivelleOperator } from '@/operators';
import { setCurrentProject } from './mutations';
import stateFactory from './state';

vi.mock('@/operators', () => ({
  poivelleOperator: {
    getWorkspaces: vi.fn(),
    applyGraphCommand: vi.fn(),
    getMembers: vi.fn(),
    getGraph: vi.fn(),
    getAssets: vi.fn(),
    getRevisions: vi.fn(),
    getProposals: vi.fn(),
    getRuns: vi.fn(),
    getTimeline: vi.fn(),
    confirmAction: vi.fn(),
    rejectProposal: vi.fn(),
    cancelRun: vi.fn()
  }
}));

const context = (access?: string) => ({
  state: stateFactory(),
  rootState: { token: { access } },
  commit: vi.fn(),
  dispatch: vi.fn()
});

describe('Poivelle Vuex actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fails bootstrap without sending an unauthenticated request', async () => {
    const ctx = context();
    await bootstrap(ctx as any);
    expect(poivelleOperator.getWorkspaces).not.toHaveBeenCalled();
    expect(ctx.commit).toHaveBeenCalledWith('setError', 'Poivelle requires an authenticated Ace Data Cloud session');
    expect(ctx.commit).toHaveBeenCalledWith('setStatus', { key: 'bootstrap', value: 'Error' });
  });

  it('sends the exact node, edge, and group versions in GraphCommand read sets', async () => {
    vi.mocked(poivelleOperator.applyGraphCommand).mockResolvedValue({
      data: { id: 'command', result_graph_version: 8 }
    } as any);
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.currentMembership = {
      id: 'membership',
      workspace_id: 'workspace',
      user_id: 'user',
      role: 'editor',
      capabilities: [],
      generation: 9,
      state: 'active'
    };
    ctx.state.graph = {
      project_id: 'project',
      graph_version: 7,
      nodes: [
        {
          id: 'node',
          project_id: 'project',
          version: 4,
          node_type: 'scene',
          title: 'Scene',
          payload: {},
          locked_paths: [],
          updated_at: 'now'
        }
      ],
      edges: [
        {
          id: 'edge',
          version: 3,
          source: { node_id: 'node', port: 'out' },
          target: { node_id: 'node', port: 'in' },
          edge_type: 'references'
        }
      ],
      groups: [{ id: 'group', version: 6, title: 'Act', kind: 'act', node_ids: ['node'] }],
      layouts: []
    };

    await applyCommand(ctx as any, [{ op: 'update_node', node_id: 'node', path: '/title', value: 'New' }]);

    expect(poivelleOperator.applyGraphCommand).toHaveBeenCalledWith(
      'project',
      expect.objectContaining({
        base_graph_version: 7,
        read_set: {
          nodes: [{ id: 'node', version: 4 }],
          edges: [{ id: 'edge', version: 3 }],
          groups: [{ id: 'group', version: 6 }],
          membership_generation: 9
        }
      }),
      { token: 'token' }
    );
  });

  it('keeps command status in Error when GraphCommand submission fails', async () => {
    vi.mocked(poivelleOperator.applyGraphCommand).mockRejectedValue(new Error('stale graph'));
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.currentMembership = {
      id: 'membership',
      workspace_id: 'workspace',
      user_id: 'user',
      role: 'editor',
      capabilities: [],
      generation: 2,
      state: 'active'
    };
    ctx.state.graph = {
      project_id: 'project',
      graph_version: 1,
      nodes: [],
      edges: [],
      groups: [],
      layouts: []
    };

    await expect(applyCommand(ctx as any, [])).rejects.toThrow('stale graph');
    expect(ctx.commit).toHaveBeenCalledWith('setStatus', { key: 'command', value: 'Error' });
  });

  it('clears project-owned state before switching project context', () => {
    const state = stateFactory();
    state.currentProjectId = 'project-one';
    state.graph = {
      project_id: 'project-one',
      graph_version: 3,
      nodes: [],
      edges: [],
      groups: [],
      layouts: []
    };
    state.assets = [{ id: 'asset' } as any];
    state.runs = [{ id: 'run' } as any];
    state.selectedNodeId = 'node';

    setCurrentProject(state, 'project-two');

    expect(state.currentProjectId).toBe('project-two');
    expect(state.graph).toBeUndefined();
    expect(state.assets).toEqual([]);
    expect(state.runs).toEqual([]);
    expect(state.selectedNodeId).toBeUndefined();
  });

  it('returns a reservation-pending run to the confirmation UI', async () => {
    const run = {
      id: 'run',
      project_id: 'project',
      revision_id: 'revision',
      state: 'reservation_pending',
      created_at: 'now'
    } as const;
    vi.mocked(poivelleOperator.confirmAction).mockResolvedValue({ data: { run, steps: [] } } as any);
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.dryRun = {
      id: 'dryrun',
      project_id: 'project',
      action_type: 'generate',
      target_ids: ['node'],
      revision_id: 'revision',
      dependency_closure: ['node'],
      max_cost_microcredits: 0,
      required_approval: 'batch',
      confirmation_nonce: 'nonce',
      expires_at: 'later'
    };

    await expect(confirmDryRun(ctx as any)).resolves.toEqual(run);
    expect(ctx.commit).toHaveBeenCalledWith('setRuns', [run]);
  });

  it('replaces the rejected proposal with the server result', async () => {
    const proposal = { id: 'proposal', state: 'awaiting_approval' } as const;
    const rejected = { ...proposal, state: 'rejected' as const };
    vi.mocked(poivelleOperator.rejectProposal).mockResolvedValue({ data: rejected } as any);
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.proposals = [proposal as any];

    await rejectProposal(ctx as any, proposal.id);

    expect(poivelleOperator.rejectProposal).toHaveBeenCalledWith('project', 'proposal', { token: 'token' });
    expect(ctx.commit).toHaveBeenCalledWith('setProposals', [rejected]);
    expect(ctx.commit).toHaveBeenCalledWith('setStatus', { key: 'action', value: 'Success' });
  });

  it('replaces a cancelling run with the server lifecycle state', async () => {
    const run = { id: 'run', state: 'running' } as const;
    const cancelling = { ...run, state: 'release_pending' as const };
    vi.mocked(poivelleOperator.cancelRun).mockResolvedValue({ data: cancelling } as any);
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.runs = [run as any];

    await cancelRun(ctx as any, run.id);

    expect(poivelleOperator.cancelRun).toHaveBeenCalledWith('project', 'run', { token: 'token' });
    expect(ctx.commit).toHaveBeenCalledWith('setRuns', [cancelling]);
  });
});
