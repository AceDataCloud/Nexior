import { ICodingBridgeState } from './models';
import { Status } from '@/models';

export default (): ICodingBridgeState => {
  return {
    nodes: [],
    currentNodeId: undefined,
    currentSessionId: undefined,
    sessions: {},
    events: {},
    history: {},
    historyRef: undefined,
    permissions: [],
    connection: 'disconnected',
    directory: undefined,
    directoryLoading: false,
    application: undefined,
    applications: undefined,
    service: undefined,
    status: {
      getNodes: Status.None,
      claimPair: Status.None,
      deleteNode: Status.None,
      getApplications: Status.None,
      getHistory: Status.None
    }
  };
};
