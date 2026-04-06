import { IApplication, ICredential, IService, Status } from '@/models';
import { ISerpConfig, ISerpSearchResponse } from '@/models';

export interface ISerpState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: ISerpConfig | undefined;
  results: ISerpSearchResponse | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    search: Status;
  };
}
