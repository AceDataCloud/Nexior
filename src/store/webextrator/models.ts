import { IApplication, ICredential, IService, IWebextratorConfig, IWebextratorResponse, Status } from '@/models';

export interface IWebextratorState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IWebextratorConfig | undefined;
  response: IWebextratorResponse | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    run: Status;
  };
}
