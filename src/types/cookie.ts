export interface ICookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expirationDate?: string;
  hostOnly?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
  secure?: boolean;
  session?: boolean;
  storeId?: number;
}

export interface ICookieStore {
  [key: string]: ICookie[];
}
