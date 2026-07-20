export type PoivelleRole = 'owner' | 'producer' | 'director' | 'editor' | 'reviewer' | 'viewer';
export type PoivelleProjection = 'canvas' | 'storyboard' | 'timeline' | 'review';
export type PoivelleNodeType =
  | 'text'
  | 'script'
  | 'character'
  | 'location'
  | 'prop'
  | 'storyboard'
  | 'scene'
  | 'shot'
  | 'image'
  | 'video'
  | 'audio'
  | 'subtitle'
  | 'composition'
  | 'output'
  | 'note';

export interface IPoivelleActor {
  id: string;
  type: 'human' | 'agent' | 'service';
  membership_generation?: number;
}

export interface IPoivelleWorkspace {
  id: string;
  tenant_id: string;
  name: string;
  state: 'active' | 'archived';
  monthly_limit_microcredits?: number;
  created_by: IPoivelleActor;
  created_at: string;
  updated_at: string;
}

export interface IPoivelleMembership {
  id: string;
  workspace_id: string;
  user_id: string;
  role: PoivelleRole;
  capabilities: string[];
  generation: number;
  state: 'active' | 'revoked';
}

export interface IPoivelleProject {
  id: string;
  tenant_id: string;
  workspace_id: string;
  title: string;
  domain: string;
  active_skill: string;
  state: 'active' | 'archived';
  graph_version: number;
  revision_generation: number;
  current_revision_id?: string;
  current_goal_snapshot_id?: string;
  automation_policy_snapshot_id?: string;
  updated_at: string;
}

export interface IPoivellePortRef {
  node_id: string;
  port: string;
}

export interface IPoivelleGraphNode {
  id: string;
  project_id: string;
  version: number;
  node_type: PoivelleNodeType;
  title: string;
  payload: Record<string, unknown>;
  locked_paths: string[];
  updated_at: string;
}

export interface IPoivelleGraphEdge {
  id: string;
  version: number;
  source: IPoivellePortRef;
  target: IPoivellePortRef;
  edge_type: 'contains' | 'follows' | 'uses_asset' | 'references' | 'derives_from' | 'supplies_input' | 'composes';
}

export interface IPoivelleGraphGroup {
  id: string;
  version: number;
  title: string;
  kind: 'act' | 'scene' | 'storyboard' | 'batch' | 'custom';
  node_ids: string[];
  parent_group_id?: string;
}

export interface IPoivelleGraphLayout {
  node_id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
}

export interface IPoivelleGraphSnapshot {
  project_id: string;
  graph_version: number;
  nodes: IPoivelleGraphNode[];
  edges: IPoivelleGraphEdge[];
  groups: IPoivelleGraphGroup[];
  layouts: IPoivelleGraphLayout[];
}

export interface IPoivelleGraphOperation {
  op:
    | 'create_node'
    | 'update_node'
    | 'delete_node'
    | 'connect'
    | 'delete_edge'
    | 'create_group'
    | 'update_group'
    | 'delete_group'
    | 'set_layout';
  node?: Partial<IPoivelleGraphNode>;
  node_id?: string;
  path?: string;
  value?: unknown;
  edge?: Partial<IPoivelleGraphEdge>;
  edge_id?: string;
  group?: Partial<IPoivelleGraphGroup>;
  group_id?: string;
  layout?: IPoivelleGraphLayout;
}

export interface IPoivelleGraphCommandRequest {
  idempotency_key: string;
  base_graph_version: number;
  read_set: {
    nodes?: Array<{ id: string; version: number }>;
    edges?: Array<{ id: string; version: number }>;
    groups?: Array<{ id: string; version: number }>;
    membership_generation: number;
  };
  operations: IPoivelleGraphOperation[];
}

export interface IPoivelleRevision {
  id: string;
  project_id: string;
  revision_number: number;
  graph_version: number;
  content_hash: string;
  manifest: Record<string, unknown>;
  created_at: string;
}

export interface IPoivelleAsset {
  id: string;
  workspace_id: string;
  project_id?: string;
  scope: 'project' | 'workspace';
  kind: string;
  title: string;
  current_version_id: string;
  state: 'active' | 'restricted' | 'deleted';
  created_at: string;
}

export interface IPoivelleProposal {
  id: string;
  project_id: string;
  intent: string;
  rationale: string;
  risk_class: 'low' | 'medium' | 'high' | 'critical';
  state: 'awaiting_approval' | 'applying' | 'applied' | 'rejected' | 'stale';
  graph_command: IPoivelleGraphCommandRequest;
  created_at: string;
}

export interface IPoivelleActionDryRun {
  id: string;
  project_id: string;
  action_type: string;
  target_ids: string[];
  revision_id: string;
  dependency_closure: string[];
  max_cost_microcredits: number;
  required_approval: 'auto' | 'batch' | 'always';
  confirmation_nonce: string;
  expires_at: string;
}

export interface IPoivelleStepRun {
  id: string;
  node_id: string;
  operation: string;
  state:
    | 'pending'
    | 'runnable'
    | 'running'
    | 'awaiting_callback'
    | 'retry_wait'
    | 'manual_recovery'
    | 'succeeded'
    | 'failed'
    | 'cancelled';
  artifact_ids: string[];
}

export interface IPoivelleRun {
  id: string;
  project_id: string;
  revision_id: string;
  state:
    | 'reservation_pending'
    | 'pending'
    | 'running'
    | 'paused'
    | 'paused_for_recovery'
    | 'settling'
    | 'release_pending'
    | 'succeeded'
    | 'failed'
    | 'cancelled';
  created_at: string;
  finished_at?: string;
}

export interface IPoivelleRunDetail {
  run: IPoivelleRun;
  steps: IPoivelleStepRun[];
}

export interface IPoivelleTimelineClip {
  id: string;
  track_id: string;
  artifact_id: string;
  timeline_start_ms: number;
  source_in_ms: number;
  source_out_ms: number;
}

export interface IPoivelleTimeline {
  id: string;
  project_id: string;
  graph_version: number;
  fps: string;
  tracks: Array<{ id: string; title?: string; kind?: string }>;
  clips: IPoivelleTimelineClip[];
}
