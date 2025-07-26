import { IApplication, ICredential, ISite, IToken, IUser, Status } from '@/models';
import { IMidjourneyState } from '../midjourney/models';
import { IChatState } from '../chat/models';
import { IQrartState } from '../qrart/models';
import { ILumaState } from '../luma/models';
import { IPikaState } from '../pika/models';
import { IKlingState } from '../kling/models';
import { IFluxState } from '../flux/models';
import { IHailuoState } from '../hailuo/models';
import { IHeadshotsState } from '../headshots/models';
import { ISunoState } from '../suno/models';

export interface ISetting {}

export interface ICommonState {
  token: IToken;
  user?: IUser;
  setting?: ISetting;
  site?: ISite;
  currency: string;
  fingerprint?: string;
  auth: {
    flow: 'popup' | 'redirect';
    visible: boolean;
  };
  exchange:
    | {
        [key: string]: number;
      }
    | undefined;
  applications: IApplication[] | undefined;
  status: {
    getService: Status | undefined;
    getApplications: Status | undefined;
    getTasks: Status | undefined;
  };
}

export interface IAppState {
  midjourney: IMidjourneyState;
  chat: IChatState;
  qrart: IQrartState;
  luma: ILumaState;
  pika: IPikaState;
  kling: IKlingState;
  flux: IFluxState;
  hailuo: IHailuoState;
  headshots: IHeadshotsState;
  suno: ISunoState;
}

export interface IRootState extends ICommonState, IAppState {}
