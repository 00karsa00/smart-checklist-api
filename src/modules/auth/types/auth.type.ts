export type GenerateTokenResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  userId: string;
};

export type ValidateTokenResponse = {
  valid: boolean;
  userId: string;
  issuedAt: Date;
  expiresAt: Date;
};
