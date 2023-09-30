export interface IToken {
  access?: string;
  refresh?: string;
}

export interface ISetting {
  stream?: boolean;
  endpoint?: string;
}

export enum IApplicationType {
  API = 'Api',
  PROXY = 'Proxy'
}

export enum ICredentialType {
  TOKEN = 'Token',
  IDENTITY = 'Identity'
}

export interface ICredential {
  type: ICredentialType;
  name?: string;
  token?: string;
  username?: string;
  password?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IApplication {
  id?: string;
  type?: IApplicationType;
  api_id?: string;
  proxy_id?: string;
  api_key?: string;
  user_id?: string;
  remaining_amount?: number;
  used_amount?: number;
  credential?: ICredential;
  created_at?: string;
  updated_at?: string;
}

export interface IState {
  token: IToken;
  setting: ISetting;
  applications: IApplication[];
}
