export interface TokenPayload {
  sub: string; // user id
  iat?: number;
  exp?: number;
}

export interface GenerateTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  userId: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  userId: string;
  issuedAt: Date;
  expiresAt: Date;
}
