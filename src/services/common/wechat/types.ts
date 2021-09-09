export interface IWechatQRCode {
  ticket: string;
  url: string;
}

export interface IWechatQRCodeResponse extends IWechatQRCode {}

export interface IWechatLoginStatusResponse {
  refresh_token: string;
  access_token: string;
  user: {
    id: string;
  };
}
