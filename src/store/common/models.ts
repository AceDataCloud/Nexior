import { IApplication, IUser } from '@/operators';
import { IMidjourneyState } from '../midjourney/models';
import { IChatState } from '../chat/models';

export enum Status {
  Request = 'Request',
  Success = 'Success',
  Error = 'Error'
}

export interface IToken {
  access?: string;
  refresh?: string;
  expiration?: number;
}

export interface ISetting {
  stream?: boolean;
  endpoint?: string;
}

export interface ICommonState {
  token: IToken;
  user: IUser;
  setting: ISetting;
}

export interface IRootState extends ICommonState {
  midjourney?: IMidjourneyState;
  chat?: IChatState;
}
