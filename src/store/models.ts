import { IApplication, IUser } from '@/operators';

export interface IToken {
  access?: string;
  refresh?: string;
}

export interface ISetting {
  stream?: boolean;
  endpoint?: string;
}

export interface IState {
  token: IToken;
  user: IUser;
  setting: ISetting;
  applications: IApplication[];
}
