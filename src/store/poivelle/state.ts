import { Status } from '@/models';
import type { IPoivelleState } from './models';

export default (): IPoivelleState => ({
  workspaces: [],
  projects: [],
  projection: 'canvas',
  assets: [],
  artifacts: [],
  takes: [],
  selections: [],
  revisions: [],
  proposals: [],
  runs: [],
  application: undefined,
  applications: undefined,
  service: undefined,
  status: {
    bootstrap: Status.None,
    graph: Status.None,
    command: Status.None,
    action: Status.None,
    assets: Status.None
  }
});
