import { AccountKind } from "../../../common";

export type IdentifyResponse = {
  /** Tells the client which field to ask for next. */
  loginMethod: string;
};

export type LoginResponse<Session> = {
  accessToken: string;
  tokenType: "Bearer";
  /** Access token lifetime, e.g. "15m". */
  expiresIn: string;
  /** Exchange at POST …/refresh for a new pair before or after the access token expires. */
  refreshToken: string;
  refreshExpiresAt: Date;
  user: Session;
};

export type ValidateTokenResponse = {
  valid: boolean;
  userId: string;
  kind: AccountKind;
  issuedAt: Date;
  expiresAt: Date;
};
