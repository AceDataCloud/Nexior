import { IToken, IUser } from '@/models';
import { IMidjourneyState } from '../midjourney/models';
import { IChatState } from '../chat/models';
import { IChatdocState } from '../chatdoc/models';
import { IQrartState } from '../qrart/models';

export interface ISetting {
  navigationCollapsed?: boolean;
}

export interface ICommonState {
  token: IToken;
  user?: IUser;
  setting?: ISetting;
  locale: string;
  dark: boolean;
}

export interface IRootState extends ICommonState {
  midjourney: IMidjourneyState;
  chat: IChatState;
  chatdoc: IChatdocState;
  qrart: IQrartState;
}
