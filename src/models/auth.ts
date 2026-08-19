export interface IToken {
  access?: string;
  refresh?: string;
  expiration?: number;
}

export interface ITokenResponse extends IToken {}

export interface IOAuthTokenRequest {
  code: string;
}

export interface IOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
}

export interface IAuthCodeResponse extends IOAuthTokenResponse {
  code: string;
  user_id: string;
}
