// Common API types

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API Error response
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Generic success response
export interface SuccessResponse {
  success: boolean;
  message?: string;
}

// Query params base
export interface BaseQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Select option (for dropdowns)
export interface SelectOption<T = string | number> {
  value: T;
  label: string;
}

// Table column definition
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}
