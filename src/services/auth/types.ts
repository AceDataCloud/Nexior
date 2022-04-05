export interface IToken {
  access?: string;
  refresh?: string;
}

export interface ITokenResponse extends IToken {}
