import { ISite, IToken, IUser } from '@/models';
import { IMidjourneyState } from '../midjourney/models';
import { IChatState } from '../chat/models';
import { IChatdocState } from '../chatdoc/models';
import { IQrartState } from '../qrart/models';
import { ILumaState } from '../luma/models';
import { IHeadshotsState } from '../headshots/models';
import { ISunoState } from '../suno/models';

export interface ISetting {}

export interface ICommonState {
  token: IToken;
  user?: IUser;
  setting?: ISetting;
  site?: ISite;
  currency: string;
  auth: {
    flow: 'popup' | 'redirect';
    visible: boolean;
  };
  exchange:
    | {
        [key: string]: number;
      }
    | undefined;
}

export interface IRootState extends ICommonState {
  midjourney: IMidjourneyState;
  chat: IChatState;
  chatdoc: IChatdocState;
  qrart: IQrartState;
  luma: ILumaState;
  headshots: IHeadshotsState;
  suno: ISunoState;
}
