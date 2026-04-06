import { IApplication, ICredential, IService, IProducerAudio, Status } from '@/models';
import { IProducerConfig, IProducerTask } from '@/models';

export interface IProducerState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IProducerConfig | undefined;
  tasks:
    | {
        items: IProducerTask[] | undefined;
        total: number | undefined;
        active: IProducerTask | undefined;
      }
    | undefined;
  audio: IProducerAudio | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
