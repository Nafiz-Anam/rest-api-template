export interface TokenResponse {
  token: string;
  expires: Date;
}

export interface DeviceInfo {
  id: string;
  name: string;
}

export interface AuthTokensResponse {
  access: TokenResponse;
  refresh?: TokenResponse;
  device?: DeviceInfo;
}
