import { AxiosResponse } from 'axios';
import httpClient from '../../instance';
import { IWechatQRCode, IWechatQRCodeResponse, IWechatLoginStatusResponse } from './types';

class WechatService {
  key = 'wechat';

  async createQRCode4Login(): Promise<AxiosResponse<IWechatQRCodeResponse>> {
    return await httpClient.post(`/${this.key}/qrcode`, {
      scene: 'login'
    });
  }

  async getLoginStatus(ticket: string): Promise<AxiosResponse<IWechatLoginStatusResponse>> {
    return httpClient.post(`/${this.key}/auth`, {
      ticket: ticket
    });
  }
}

export default new WechatService();
