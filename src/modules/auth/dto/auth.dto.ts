export interface GenerateTokenDto {
  userId: string;
}

export interface ValidateTokenDto {
  token: string;
}

export interface UserIdParams {
  [key: string]: string;
}
