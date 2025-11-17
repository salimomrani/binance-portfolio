// T044: API Response models matching backend types

export interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp: Date;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: Date;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
