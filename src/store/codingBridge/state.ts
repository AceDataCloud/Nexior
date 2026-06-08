import { ICodingBridgeState } from './models';
import { Status } from '@/models';

export default (): ICodingBridgeState => {
  return {
    nodes: [],
    currentNodeId: undefined,
    currentSessionId: undefined,
    sessions: {},
    events: {},
    permissions: [],
    connection: 'disconnected',
    application: undefined,
    applications: undefined,
    service: undefined,
    status: {
      getNodes: Status.None,
      claimPair: Status.None,
      deleteNode: Status.None,
      getApplications: Status.None
    }
  };
};
