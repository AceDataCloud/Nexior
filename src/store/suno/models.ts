import { IApplication, ICredential, IService, ISunoAudio, Status } from '@/models';
import { ISunoConfig, ISunoTask } from '@/models';

export interface ISunoState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: ISunoConfig | undefined;
  tasks:
    | {
        items: ISunoTask[] | undefined;
        total: number | undefined;
        active: ISunoTask | undefined;
      }
    | undefined;
  audio: ISunoAudio | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
