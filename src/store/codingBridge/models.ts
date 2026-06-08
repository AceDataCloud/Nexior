import { Status } from '@/models';
import {
  ICodingBridgeConnectionStatus,
  ICodingBridgeEvent,
  ICodingBridgeNode,
  ICodingBridgePermissionRequest,
  ICodingBridgeSession
} from '@/models';

export interface ICodingBridgeState {
  nodes: ICodingBridgeNode[];
  currentNodeId: string | undefined;
  currentSessionId: string | undefined;
  sessions: Record<string, ICodingBridgeSession>;
  events: Record<string, ICodingBridgeEvent[]>;
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
  };
}
