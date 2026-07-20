import type {
  IPoivelleActionDryRun,
  IPoivelleArtifact,
  IPoivelleAsset,
  IPoivelleGraphNode,
  IPoivelleGraphSnapshot,
  IPoivelleMembership,
  IPoivelleProject,
  PoivelleProjection,
  IPoivelleProposal,
  IPoivelleRevision,
  IPoivelleRun,
  IPoivelleRunDetail,
  IPoivelleSelection,
  IPoivelleTake,
  IPoivelleTimeline,
  IPoivelleTVCStoryboard,
  IPoivelleWorkspace,
  Status
} from '@/models';

export interface IPoivelleState {
  workspaces: IPoivelleWorkspace[];
  projects: IPoivelleProject[];
  currentWorkspaceId?: string;
  currentMembership?: IPoivelleMembership;
  currentProjectId?: string;
  projection: PoivelleProjection;
  graph?: IPoivelleGraphSnapshot;
  assets: IPoivelleAsset[];
  artifacts: IPoivelleArtifact[];
  takes: IPoivelleTake[];
  selections: IPoivelleSelection[];
  storyboard?: IPoivelleTVCStoryboard;
  revisions: IPoivelleRevision[];
  proposals: IPoivelleProposal[];
  runs: IPoivelleRun[];
  activeRun?: IPoivelleRunDetail;
  timeline?: IPoivelleTimeline;
  selectedNodeId?: string;
  dryRun?: IPoivelleActionDryRun;
  application: undefined;
  applications: undefined;
  service: undefined;
  error?: string;
  status: {
    bootstrap: Status;
    graph: Status;
    command: Status;
    action: Status;
    assets: Status;
  };
}

export interface IPoivelleBootstrapResult {
  workspaces: IPoivelleWorkspace[];
  projects: IPoivelleProject[];
}

export const currentNode = (state: IPoivelleState): IPoivelleGraphNode | undefined =>
  state.graph?.nodes.find((node) => node.id === state.selectedNodeId);
