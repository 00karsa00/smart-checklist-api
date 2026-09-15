
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
  requestId: string | string[] | undefined;
}

export function successResponse<T>(
  data: T,
  requestId: string | string[] | undefined,
  meta: ApiMeta | null = null,
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    meta,
    requestId,
  };
}
