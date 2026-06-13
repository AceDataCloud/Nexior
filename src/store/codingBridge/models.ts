import { Status } from '@/models';
import {
  ICodingBridgeCapabilities,
  ICodingBridgeComposerPrefs,
  ICodingBridgeConnectionStatus,
  ICodingBridgeDirListing,
  ICodingBridgeEvent,
  ICodingBridgeHistorySummary,
  ICodingBridgeNode,
  ICodingBridgePermissionRequest,
  ICodingBridgeSession
} from '@/models';

/** Pointer to the last-opened history conversation, restored after a reload. */
export interface ICodingBridgeHistoryRef {
  node_id: string;
  provider: 'claude' | 'codex';
  session_id: string;
}

export interface ICodingBridgeState {
  nodes: ICodingBridgeNode[];
  currentNodeId: string | undefined;
  currentSessionId: string | undefined;
  sessions: Record<string, ICodingBridgeSession>;
  events: Record<string, ICodingBridgeEvent[]>;
  // Highest relay-assigned event `seq` applied per session. Drives reconnect
  // replay (resume_from) and dedups overlapping events. In-memory only: a full
  // reload rebuilds the transcript from history instead of a seq cursor.
  lastSeq: Record<string, number>;
  // Past on-device sessions per node, sourced live from `history.list`.
  history: Record<string, ICodingBridgeHistorySummary[]>;
  // What each node can do (providers/models/efforts), from `capabilities.get`.
  capabilities: Record<string, ICodingBridgeCapabilities>;
  historyRef: ICodingBridgeHistoryRef | undefined;
  permissions: ICodingBridgePermissionRequest[];
  connection: ICodingBridgeConnectionStatus;
  // Latest directory snapshot for the working-directory picker (node-scoped,
  // transient: replaced on each `fs.list` and never persisted).
  directory: ICodingBridgeDirListing | undefined;
  directoryLoading: boolean;
  // Last composer setup (cwd/provider/model/effort/mode) used per node, so a
  // new session on a known device pre-fills it instead of resetting. Persisted.
  lastComposer: Record<string, ICodingBridgeComposerPrefs>;
  // Coding Bridge is not a billed API service, so it owns no application /
  // service / credential. These fields exist only so the shared `Main.vue`
  // layout (which is generic over per-app modules) reads `undefined` and
  // hides the application widget instead of throwing.
  application: undefined;
  applications: undefined;
  service: undefined;
  status: {
    getNodes: Status;
    claimPair: Status;
    deleteNode: Status;
    getApplications: Status;
    getHistory: Status;
  };
}
