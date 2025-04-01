import { NextResponse } from 'next/server';

// Standard response types
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Error codes
export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

// HTTP status codes mapping
const statusCodes = {
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.VALIDATION_ERROR]: 422,
};

// Success response helper
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    },
    { status }
  );
}

// Error response helper
export function errorResponse(
  code: ErrorCode,
  message: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status: statusCodes[code] }
  );
}

// Validation error helper
export function validationError(
  details: Record<string, string[]>
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    ErrorCode.VALIDATION_ERROR,
    'Validation failed',
    details
  );
}

// Not found helper
export function notFound(
  resource = 'Resource'
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    ErrorCode.NOT_FOUND,
    `${resource} not found`
  );
}
