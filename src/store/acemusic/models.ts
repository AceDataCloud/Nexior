import { IApplication, ICredential, IService, IAcemusicAudio, Status } from '@/models';
import { IAcemusicConfig, IAcemusicTask } from '@/models';

export interface IAcemusicState {
  lyricsTask?: { id: string; userId?: string; applicationId?: string };
  application: IApplication | undefined;
  applications: IApplication[] | undefined;
  service: IService | undefined;
  credential: ICredential | undefined;
  config: IAcemusicConfig | undefined;
  tasks:
    | {
        items: IAcemusicTask[] | undefined;
        total: number | undefined;
        active: IAcemusicTask | undefined;
      }
    | undefined;
  audio: IAcemusicAudio | undefined;
  status: {
    getService: Status;
    getApplications: Status;
    getTasks: Status;
  };
}
