import { Status } from '@/models';
import {
  ICodingBridgeConnectionStatus,
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
  // Past on-device sessions per node, sourced live from `history.list`.
  history: Record<string, ICodingBridgeHistorySummary[]>;
  historyRef: ICodingBridgeHistoryRef | undefined;
  permissions: ICodingBridgePermissionRequest[];
  connection: ICodingBridgeConnectionStatus;
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
