import { AxiosResponse } from 'axios';
import httpClient from '../../instance';
import { IWechatQRCodeResponse, IWechatLoginStatusResponse } from './types';

class WechatService {
  key = 'wechat';

  async createQRCode4Login(): Promise<AxiosResponse<IWechatQRCodeResponse>> {
    return await httpClient.post(`/${this.key}/qrcode`, {
      scene: 'login'
    });
  }

  async getLoginStatus(ticket: string): Promise<AxiosResponse<IWechatLoginStatusResponse>> {
    return httpClient.post(`/${this.key}/authenticate`, {
      ticket: ticket
    });
  }
}

export default new WechatService();
