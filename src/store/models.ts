import { IApplication, IMidjourneyPreset, IUser } from '@/operators';

export interface IToken {
  access?: string;
  refresh?: string;
}

export interface ISetting {
  stream?: boolean;
  endpoint?: string;
}

export interface ICommonState {
  token: IToken;
  user: IUser;
  setting: ISetting;
  applications: IApplication[] | undefined;
}

export interface IMidjourneyState {
  applications: IApplication[] | undefined;
  preset: IMidjourneyPreset;
}

export interface IChatState {
  applications: IApplication[] | undefined;
}

export interface IRootState {
  common: ICommonState;
  midjourney: IMidjourneyState;
  chat: IChatState;
}
