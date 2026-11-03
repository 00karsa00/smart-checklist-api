// The response envelope shared by every endpoint. Handlers return only `data`;
// the HTTP layer wraps it with successResponse / errorResponse.

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiMeta | null;
  requestId: string | undefined;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  requestId: string | undefined;
}

export function successResponse<T>(
  data: T,
  requestId: string | undefined,
  meta: ApiMeta | null = null,
): ApiSuccessResponse<T> {
  return { success: true, data, meta, requestId };
}

export function errorResponse(
  code: string,
  message: string,
  requestId: string | undefined,
): ApiErrorResponse {
  return { success: false, error: { code, message }, requestId };
}
