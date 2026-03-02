/**
 * Data Transfer Objects for Feature Flag operations
 */

/**
 * DTO for creating a new feature flag
 */
export interface CreateFlagDto {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
}

/**
 * DTO for pagination parameters
 */
export interface PaginationDto {
  page?: number;
  limit?: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Feature Flag entity representation
 */
export interface FeatureFlag {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
