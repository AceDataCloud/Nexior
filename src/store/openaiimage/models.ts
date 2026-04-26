import { IApplication, ICredential, IService, Status } from '@/models';
import { IOpenAIImageConfig, IOpenAIImageTask } from '@/models';

export interface IOpenAIImageState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IOpenAIImageConfig | undefined;
  tasks:
    | {
        items: IOpenAIImageTask[] | undefined;
        total: number | undefined;
        active: IOpenAIImageTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
