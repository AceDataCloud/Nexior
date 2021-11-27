import { IUser } from '../user/types';

export interface IWechatQRCode {
  ticket: string;
  url: string;
}

export interface IWechatQRCodeResponse extends IWechatQRCode {}

export interface IWechatLoginStatusResponse {
  refreshToken: string;
  accessToken: string;
  user: IUser;
}
