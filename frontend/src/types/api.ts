export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  data: T;
  message?: string;
  warning?: string;
  errors?: Record<string, string[]> | null;
  meta?: PaginationMeta | null;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
