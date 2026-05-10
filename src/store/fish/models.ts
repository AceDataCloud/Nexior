import { IApplication, ICredential, IService, Status } from '@/models';
import { IFishTtsConfig, IFishTask, IFishVoiceModel } from '@/models';

export interface IFishState {
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IFishTtsConfig | undefined;
  /** Cached list of the current user's voice-clone models. */
  voices: IFishVoiceModel[] | undefined;
  tasks:
    | {
        items: IFishTask[] | undefined;
        total: number | undefined;
        active: IFishTask | undefined;
      }
    | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
