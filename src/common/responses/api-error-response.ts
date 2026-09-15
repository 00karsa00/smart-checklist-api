export interface ApiErrorDetail {
  field?: string;
  message: string;
  value?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details: ApiErrorDetail[] | null;
  };
  requestId: string | string[] | undefined;
}

export function errorResponse(
  code: string,
  message: string,
  requestId: string | string[] | undefined,
  details: ApiErrorDetail[] | null = null,
): ApiErrorResponse {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
    requestId,
  };
}
