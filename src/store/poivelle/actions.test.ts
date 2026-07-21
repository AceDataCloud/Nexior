import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyCommand,
  bootstrap,
  cancelRun,
  confirmDryRun,
  copyDiscoveryWork,
  createCommercialTVCProject,
  loadProject,
  loadRun,
  rejectProposal,
  retryStep,
  selectTake
} from './actions';
import { applicationOperator, credentialOperator, poivelleOperator } from '@/operators';
import { setCurrentProject } from './mutations';
import { addProject } from './mutations';
import stateFactory from './state';

vi.mock('@/operators', () => ({
  applicationOperator: {
    getAll: vi.fn()
  },
  credentialOperator: {
    getAll: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  },
  poivelleOperator: {
    getWorkspaces: vi.fn(),
    getDiscovery: vi.fn(),
    createWorkspace: vi.fn(),
    copyDiscoveryWork: vi.fn(),
    applyGraphCommand: vi.fn(),
    getMembers: vi.fn(),
    getGraph: vi.fn(),
    getAssets: vi.fn(),
    getRevisions: vi.fn(),
    getProposals: vi.fn(),
    getRuns: vi.fn(),
    getTimeline: vi.fn(),
    getArtifacts: vi.fn(),
    getTakes: vi.fn(),
    getSelections: vi.fn(),
    getStoryboard: vi.fn(),
    getEvaluations: vi.fn(),
    getForensicValidations: vi.fn(),
    getCosts: vi.fn(),
    getRun: vi.fn(),
    createRevision: vi.fn(),
    dryRunAction: vi.fn(),
    createCommercialTVCProject: vi.fn(),
    selectTake: vi.fn(),
    confirmAction: vi.fn(),
    rejectProposal: vi.fn(),
    cancelRun: vi.fn()
  }
}));

const context = (access?: string) => ({
  state: stateFactory(),
  rootState: { token: { access }, user: { id: 'user' }, applications: [] },
  commit: vi.fn(),
  dispatch: vi.fn()
});

describe('Poivelle Vuex actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(credentialOperator.getAll).mockResolvedValue({ data: { count: 0, items: [] } } as any);
  });

  it('fails bootstrap without sending an unauthenticated request', async () => {
    const ctx = context();
    await bootstrap(ctx as any);
    expect(poivelleOperator.getWorkspaces).not.toHaveBeenCalled();
    expect(ctx.commit).toHaveBeenCalledWith('setError', 'Poivelle requires an authenticated Ace Data Cloud session');
    expect(ctx.commit).toHaveBeenCalledWith('setStatus', { key: 'bootstrap', value: 'Error' });
  });

  it('loads discovery without opening a project graph on the creator home', async () => {
    const ctx = context('token');
    vi.mocked(poivelleOperator.getWorkspaces).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getDiscovery).mockResolvedValue({ data: [{ id: 'official:pulsecam' }] } as any);

    await bootstrap(ctx as any, { loadProject: false });

    expect(ctx.commit).toHaveBeenCalledWith('setDiscoveryWorks', [{ id: 'official:pulsecam' }]);
    expect(ctx.dispatch).not.toHaveBeenCalledWith('loadProject', expect.anything());
  });

  it('does not start a second discovery bootstrap while one is pending', async () => {
    const ctx = context('token');
    ctx.state.status.bootstrap = 'Request' as any;

    await bootstrap(ctx as any, { loadProject: false });

    expect(poivelleOperator.getWorkspaces).not.toHaveBeenCalled();
    expect(poivelleOperator.getDiscovery).not.toHaveBeenCalled();
  });

  it('creates a first workspace and copies a discovery work into the studio', async () => {
    const ctx = context('token');
    const workspace = { id: 'workspace', name: 'My Studio' };
    const project = { id: 'project', title: 'Alpine Camera' };
    vi.mocked(poivelleOperator.createWorkspace).mockResolvedValue({ data: workspace } as any);
    vi.mocked(poivelleOperator.getMembers).mockResolvedValue({
      data: [{ user_id: 'user', state: 'active', role: 'owner' }]
    } as any);
    vi.mocked(poivelleOperator.copyDiscoveryWork).mockResolvedValue({
      data: { project, source_work_id: 'official:pulsecam' }
    } as any);

    await expect(
      copyDiscoveryWork(ctx as any, {
        work_id: 'official:pulsecam',
        prompt: 'A climbing camera for rescue teams',
        title: 'Alpine Camera'
      })
    ).resolves.toEqual(project);

    expect(poivelleOperator.createWorkspace).toHaveBeenCalledWith({ name: 'My Studio' }, { token: 'token' });
    expect(poivelleOperator.copyDiscoveryWork).toHaveBeenCalledWith(
      'official:pulsecam',
      {
        workspace_id: 'workspace',
        prompt: 'A climbing camera for rescue teams',
        title: 'Alpine Camera',
        aspect_ratio: '16:9'
      },
      { token: 'token' }
    );
    expect(ctx.dispatch).toHaveBeenCalledWith('loadProject', 'project');
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

  it('moves an existing project to the front without duplicating it', () => {
    const state = stateFactory();
    state.projects = [{ id: 'project-one', title: 'One' } as any, { id: 'project-two', title: 'Two' } as any];

    addProject(state, { id: 'project-two', title: 'Updated Two' } as any);

    expect(state.projects.map((project) => project.id)).toEqual(['project-two', 'project-one']);
    expect(state.projects[0].title).toBe('Updated Two');
  });

  it('delegates a capped temporary Global credential to a provider run', async () => {
    const run = {
      id: 'run',
      project_id: 'project',
      revision_id: 'revision',
      state: 'pending',
      funding_mode: 'user_credential',
      created_at: 'now'
    } as const;
    vi.mocked(poivelleOperator.confirmAction).mockResolvedValue({ data: { run, steps: [] } } as any);
    vi.mocked(applicationOperator.getAll).mockResolvedValue({
      data: {
        items: [{ id: 'global-app', scope: 'Global', role: 'owner' }]
      }
    } as any);
    vi.mocked(credentialOperator.create).mockResolvedValue({
      data: { id: 'temporary-credential', token: 'temporary-global-credential-00000001' }
    } as any);
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.projects = [{ id: 'project', managed_execution: false } as any];
    ctx.state.dryRun = {
      id: 'dryrun',
      project_id: 'project',
      action_type: 'generate',
      target_ids: ['node'],
      revision_id: 'revision',
      dependency_closure: ['node'],
      max_cost_microcredits: 2_500_000,
      requires_credential: true,
      required_approval: 'batch',
      confirmation_nonce: 'nonce',
      expires_at: 'later'
    };

    await expect(confirmDryRun(ctx as any)).resolves.toEqual(run);
    expect(credentialOperator.create).toHaveBeenCalledWith(
      expect.objectContaining({
        application_id: 'global-app',
        limited_amount: 2.5,
        metadata: {
          purpose: 'poivelle_execution',
          project_id: 'project',
          dry_run_id: 'dryrun'
        }
      })
    );
    expect(poivelleOperator.confirmAction).toHaveBeenCalledWith(
      'project',
      expect.objectContaining({
        idempotency_key: 'confirm-dryrun',
        execution_credential: 'temporary-global-credential-00000001'
      }),
      { token: 'token' }
    );
    expect(ctx.commit).toHaveBeenCalledWith('setRuns', [run]);
  });

  it('reuses the temporary credential for an idempotent confirmation retry', async () => {
    const run = { id: 'run', project_id: 'project', revision_id: 'revision', state: 'pending', created_at: 'now' };
    vi.mocked(applicationOperator.getAll).mockResolvedValue({
      data: { items: [{ id: 'global-app', scope: 'Global', role: 'owner' }] }
    } as any);
    vi.mocked(credentialOperator.getAll).mockResolvedValue({
      data: {
        count: 1,
        items: [
          {
            id: 'existing-credential',
            token: 'existing-temporary-credential-000001',
            expired_at: new Date(Date.now() + 60_000).toISOString(),
            metadata: { purpose: 'poivelle_execution', dry_run_id: 'dryrun' }
          }
        ]
      }
    } as any);
    vi.mocked(poivelleOperator.confirmAction).mockResolvedValue({ data: { run, steps: [] } } as any);
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.projects = [{ id: 'project' } as any];
    ctx.state.dryRun = {
      id: 'dryrun',
      project_id: 'project',
      action_type: 'generate',
      target_ids: ['node'],
      revision_id: 'revision',
      dependency_closure: ['node'],
      max_cost_microcredits: 1_000_000,
      requires_credential: true,
      required_approval: 'batch',
      confirmation_nonce: 'nonce',
      expires_at: 'later'
    };

    await confirmDryRun(ctx as any);

    expect(credentialOperator.create).not.toHaveBeenCalled();
    expect(poivelleOperator.confirmAction).toHaveBeenCalledWith(
      'project',
      expect.objectContaining({ execution_credential: 'existing-temporary-credential-000001' }),
      { token: 'token' }
    );
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
    const cancelling = { ...run, state: 'cancelled' as const };
    vi.mocked(poivelleOperator.cancelRun).mockResolvedValue({ data: cancelling } as any);
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.runs = [run as any];

    await cancelRun(ctx as any, run.id);

    expect(poivelleOperator.cancelRun).toHaveBeenCalledWith('project', 'run', { token: 'token' });
    expect(ctx.commit).toHaveBeenCalledWith('setRuns', [cancelling]);
  });

  it('initializes a commercial TVC project from the typed blueprint response', async () => {
    const project = { id: 'project', blueprint_ref: 'commercial.tvc.action-imaging@1' };
    const graph = { project_id: 'project', graph_version: 1, nodes: [], edges: [], groups: [], layouts: [] };
    const revision = { id: 'revision', graph_version: 1 };
    const storyboard = { project_id: 'project', schema_ref: 'commercial.tvc.storyboard@1', sections: [] };
    vi.mocked(poivelleOperator.createCommercialTVCProject).mockResolvedValue({
      data: { project, graph, revision, storyboard }
    } as any);
    const ctx = context('token');

    await createCommercialTVCProject(ctx as any, {
      workspace_id: 'workspace',
      title: 'PulseCam TVC',
      product_name: 'PulseCam',
      product_category: 'action imaging device',
      brand_tone: 'precise and cinematic',
      aspect_ratio: '16:9'
    });

    expect(ctx.commit).toHaveBeenCalledWith('addProject', project);
    expect(ctx.commit).toHaveBeenCalledWith('setGraph', graph);
    expect(ctx.commit).toHaveBeenCalledWith('setRevisions', [revision]);
    expect(ctx.commit).toHaveBeenCalledWith('setStoryboard', storyboard);
  });

  it('loads TVC storyboard, artifacts, takes, and revision-scoped selections', async () => {
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.projects = [{ id: 'project', blueprint_ref: 'commercial.tvc.action-imaging@1' } as any];
    vi.mocked(poivelleOperator.getGraph).mockResolvedValue({ data: { nodes: [] } } as any);
    vi.mocked(poivelleOperator.getAssets).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getRevisions).mockResolvedValue({ data: [{ id: 'revision' }] } as any);
    vi.mocked(poivelleOperator.getProposals).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getRuns).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getTimeline).mockResolvedValue({ data: {} } as any);
    vi.mocked(poivelleOperator.getArtifacts).mockResolvedValue({ data: [{ id: 'artifact' }] } as any);
    vi.mocked(poivelleOperator.getTakes).mockResolvedValue({ data: [{ id: 'take' }] } as any);
    vi.mocked(poivelleOperator.getEvaluations).mockResolvedValue({ data: [{ id: 'evaluation' }] } as any);
    vi.mocked(poivelleOperator.getForensicValidations).mockResolvedValue({ data: [{ id: 'forensic' }] } as any);
    vi.mocked(poivelleOperator.getCosts).mockResolvedValue({ data: { totals_microcredits: { final: 5 } } } as any);
    vi.mocked(poivelleOperator.getSelections).mockResolvedValue({ data: [{ id: 'selection' }] } as any);
    vi.mocked(poivelleOperator.getStoryboard).mockResolvedValue({ data: { sections: [] } } as any);

    await loadProject(ctx as any, 'project');

    expect(poivelleOperator.getSelections).toHaveBeenCalledWith('project', 'revision', { token: 'token' });
    expect(poivelleOperator.getStoryboard).toHaveBeenCalledWith('project', { token: 'token' });
    expect(ctx.commit).toHaveBeenCalledWith('setArtifacts', [{ id: 'artifact' }]);
    expect(ctx.commit).toHaveBeenCalledWith('setTakes', [{ id: 'take' }]);
    expect(ctx.commit).toHaveBeenCalledWith('setSelections', [{ id: 'selection' }]);
    expect(ctx.commit).toHaveBeenCalledWith('setEvaluations', [{ id: 'evaluation' }]);
    expect(ctx.commit).toHaveBeenCalledWith('setForensicValidations', [{ id: 'forensic' }]);
    expect(ctx.commit).toHaveBeenCalledWith('setCosts', { totals_microcredits: { final: 5 } });
  });

  it('does not load project-wide selections when a project has no revision', async () => {
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.projects = [{ id: 'project' } as any];
    vi.mocked(poivelleOperator.getGraph).mockResolvedValue({ data: { nodes: [] } } as any);
    vi.mocked(poivelleOperator.getAssets).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getRevisions).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getProposals).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getRuns).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getTimeline).mockResolvedValue({ data: {} } as any);
    vi.mocked(poivelleOperator.getArtifacts).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getTakes).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getEvaluations).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getForensicValidations).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getCosts).mockResolvedValue({ data: {} } as any);

    await loadProject(ctx as any, 'project');

    expect(poivelleOperator.getSelections).not.toHaveBeenCalled();
    expect(ctx.commit).toHaveBeenCalledWith('setSelections', []);
  });

  it('does not let a stale project response overwrite the active project', async () => {
    let resolveGraph: (value: any) => void = () => undefined;
    const graphResponse = new Promise((resolve) => {
      resolveGraph = resolve;
    });
    const ctx = context('token');
    ctx.state.currentProjectId = 'project-one';
    ctx.state.projects = [{ id: 'project-one' } as any];
    vi.mocked(poivelleOperator.getGraph).mockReturnValue(graphResponse as any);
    vi.mocked(poivelleOperator.getAssets).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getRevisions).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getProposals).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getRuns).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getTimeline).mockResolvedValue({ data: {} } as any);
    vi.mocked(poivelleOperator.getArtifacts).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getTakes).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getEvaluations).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getForensicValidations).mockResolvedValue({ data: [] } as any);
    vi.mocked(poivelleOperator.getCosts).mockResolvedValue({ data: {} } as any);

    const loading = loadProject(ctx as any, 'project-one');
    ctx.state.currentProjectId = 'project-two';
    resolveGraph({ data: { project_id: 'project-one', nodes: [] } });
    await loading;

    expect(ctx.commit).not.toHaveBeenCalledWith('setGraph', expect.objectContaining({ project_id: 'project-one' }));
    expect(ctx.commit).not.toHaveBeenCalledWith('setStatus', { key: 'graph', value: 'Success' });
  });

  it('loads run steps and attempts for recovery inspection', async () => {
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    const detail = { run: { id: 'run' }, steps: [{ id: 'step' }], attempts: [{ id: 'attempt' }] };
    vi.mocked(poivelleOperator.getRun).mockResolvedValue({ data: detail } as any);

    await loadRun(ctx as any, 'run');

    expect(poivelleOperator.getRun).toHaveBeenCalledWith('project', 'run', { token: 'token' });
    expect(ctx.commit).toHaveBeenCalledWith('setActiveRun', detail);
  });

  it('creates a new dry run for the failed step node', async () => {
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.graph = {
      project_id: 'project',
      graph_version: 4,
      nodes: [{ id: 'video-node', node_type: 'video' }],
      edges: [],
      groups: [],
      layouts: []
    } as any;
    ctx.state.revisions = [{ id: 'revision', graph_version: 4 } as any];
    ctx.state.activeRun = { run: { id: 'failed-run' }, steps: [], attempts: [] } as any;
    const dryRun = { id: 'retry-dry-run', target_ids: ['video-node'] };
    vi.mocked(poivelleOperator.dryRunAction).mockResolvedValue({ data: dryRun } as any);

    await expect(retryStep(ctx as any, { node_id: 'video-node', operation: 'video.shot@1' })).resolves.toEqual(dryRun);

    expect(poivelleOperator.dryRunAction).toHaveBeenCalledWith(
      'project',
      expect.objectContaining({
        action_type: 'generate',
        target_ids: ['video-node'],
        revision_id: 'revision',
        options: { recovery_of_run_id: 'failed-run' }
      }),
      { token: 'token' }
    );
    expect(ctx.commit).toHaveBeenCalledWith('setSelectedNode', 'video-node');
    expect(ctx.commit).toHaveBeenCalledWith('setDryRun', dryRun);
  });

  it('selects a take against the current revision and selection head', async () => {
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.revisions = [{ id: 'revision' } as any];
    ctx.state.selections = [{ id: 'selection-old', target_node_id: 'image-node', take_id: 'take-old' } as any];
    const selected = { id: 'selection-new', target_node_id: 'image-node', take_id: 'take-new' };
    vi.mocked(poivelleOperator.selectTake).mockResolvedValue({ data: selected } as any);

    await selectTake(ctx as any, { target_node_id: 'image-node', take_id: 'take-new' });

    expect(poivelleOperator.selectTake).toHaveBeenCalledWith(
      'project',
      {
        revision_id: 'revision',
        target_node_id: 'image-node',
        take_id: 'take-new',
        expected_previous_event_id: 'selection-old'
      },
      { token: 'token' }
    );
    expect(ctx.commit).toHaveBeenCalledWith('setSelections', [selected]);
  });

  it('refreshes the authoritative selection head after a CAS conflict', async () => {
    const ctx = context('token');
    ctx.state.currentProjectId = 'project';
    ctx.state.revisions = [{ id: 'revision' } as any];
    ctx.state.selections = [{ id: 'selection-old', target_node_id: 'image-node', take_id: 'take-old' } as any];
    const conflict = Object.assign(new Error('selection head changed'), { response: { status: 409 } });
    vi.mocked(poivelleOperator.selectTake).mockRejectedValue(conflict);
    vi.mocked(poivelleOperator.getSelections).mockResolvedValue({
      data: [{ id: 'selection-latest', target_node_id: 'image-node', take_id: 'take-other' }]
    } as any);

    await expect(selectTake(ctx as any, { target_node_id: 'image-node', take_id: 'take-new' })).rejects.toThrow(
      'selection head changed'
    );

    expect(poivelleOperator.getSelections).toHaveBeenCalledWith('project', 'revision', { token: 'token' });
    expect(ctx.commit).toHaveBeenCalledWith('setSelections', [
      { id: 'selection-latest', target_node_id: 'image-node', take_id: 'take-other' }
    ]);
  });
});
