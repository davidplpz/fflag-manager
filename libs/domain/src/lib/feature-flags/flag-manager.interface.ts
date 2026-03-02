import { CreateFlagDto, FeatureFlag, PaginatedResult, PaginationDto } from './dtos.js';

/**
 * Interface for Feature Flag management operations
 * This interface defines the contract for CRUD operations on feature flags
 * Implementations wrap fflags-lib ManagerService
 */
export interface IFlagManager {
  /**
   * Create a new feature flag
   * @param dto - Flag creation data
   * @returns Created feature flag
   * @throws Error if flag key already exists
   */
  createFlag(dto: CreateFlagDto): Promise<FeatureFlag>;

  /**
   * Retrieve a feature flag by its key
   * @param key - Unique flag key
   * @returns Feature flag or null if not found
   */
  getFlag(key: string): Promise<FeatureFlag | null>;

  /**
   * Retrieve all feature flags with pagination
   * @param pagination - Pagination parameters
   * @returns Paginated list of feature flags
   */
  getAllFlags(pagination: PaginationDto): Promise<PaginatedResult<FeatureFlag>>;

  /**
   * Activate a feature flag (set enabled = true)
   * @param key - Unique flag key
   * @throws Error if flag not found
   */
  activateFlag(key: string): Promise<void>;

  /**
   * Deactivate a feature flag (set enabled = false)
   * @param key - Unique flag key
   * @throws Error if flag not found
   */
  deactivateFlag(key: string): Promise<void>;

  /**
   * Delete a feature flag
   * @param key - Unique flag key
   * @throws Error if flag not found
   */
  deleteFlag(key: string): Promise<void>;
}
