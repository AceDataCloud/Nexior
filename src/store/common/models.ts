import { IMidjourneyState } from '../midjourney/models';
import { IChatState } from '../chat/models';
import { IChatdocState } from '../chatdoc/models';
import { IToken, IUser } from '@/models';

export interface ISetting {
  navigationCollapsed?: boolean;
}

export interface ICommonState {
  token: IToken;
  user: IUser;
  setting?: ISetting;
  locale: string;
}

export interface IRootState extends ICommonState {
  midjourney: IMidjourneyState;
  chat: IChatState;
  chatdoc: IChatdocState;
}
