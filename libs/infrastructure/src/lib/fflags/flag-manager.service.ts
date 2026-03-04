import { ManagerService } from 'fflags-lib';
import { Redis } from 'ioredis';
import pkg from 'pg';
const { Client } = pkg;
import {
  IFlagManager,
  CreateFlagDto,
  FeatureFlag,
  PaginatedResult,
  PaginationDto,
} from '@org/domain';
import { FflagsConfig } from './config.interface.js';

/**
 * Wrapper service for fflags-lib ManagerService
 * Implements IFlagManager interface and provides error handling and logging
 * 
 * Requirements:
 * - 1.3: Create Feature_Flag with unique Flag_Key, name, description, and initial Flag_State
 * - 1.5: Update Flag_State (activate/deactivate)
 * - 1.6: Delete Feature_Flag by Flag_Key
 * - 1.7: Retrieve Feature_Flag by Flag_Key
 * - 4.7, 16.3: Fallback to PostgreSQL if Redis is unavailable
 */
export class FlagManagerService implements IFlagManager {
  private managerService: ManagerService;
  private redisClient: Redis;
  private pgClient: any;

  constructor(config: FflagsConfig) {
    // Initialize Redis client
    this.redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      keyPrefix: config.redis.keyPrefix,
    });

    // Initialize fflags-lib ManagerService
    this.managerService = ManagerService.getInstance(this.redisClient);

    // Initialize PG client for fallback (Requirement 4.7, 16.3)
    this.pgClient = new Client({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password,
      database: config.database.database,
    });
  }

  /**
   * Create a new feature flag
   * Wraps fflags-lib createFlag operation
   * 
   * @throws Error if flag key already exists (Requirement 1.4)
   */
  async createFlag(dto: CreateFlagDto): Promise<FeatureFlag> {
    try {
      this.logOperation('createFlag', { key: dto.key });

      const flag = await this.managerService.createFlag(
        dto.key,
        dto.enabled,
        dto.description || ''
      );

      const result = this.mapToFeatureFlag(flag, dto.name);
      this.logSuccess('createFlag', { key: dto.key });

      return result;
    } catch (error) {
      this.handleError('createFlag', error, { key: dto.key });
      throw this.wrapError(error, `Failed to create flag with key '${dto.key}'`);
    }
  }

  /**
   * Retrieve a feature flag by key
   * Returns null if flag does not exist (fail-safe behavior)
   * Falls back to PostgreSQL if Redis/fflags-lib fails (Requirement 4.7, 16.3)
   */
  async getFlag(key: string): Promise<FeatureFlag | null> {
    try {
      this.logOperation('getFlag', { key });

      const flag = await this.managerService.getFlag(key);

      if (!flag) {
        this.logInfo('getFlag', `Flag not found (fflags-lib): ${key}`);
        return null;
      }

      const result = this.mapToFeatureFlag(flag, key);
      this.logSuccess('getFlag', { key });

      return result;
    } catch (error) {
      // Fallback to direct DB query if it's a connection error or something likely related to Redis/fflags-lib failure
      if (!this.isNotFoundError(error)) {
        this.logInfo('getFlag', `fflags-lib failed for ${key}, falling back to direct DB query. Error: ${error instanceof Error ? error.message : String(error)}`);
        return this.getFlagFromDb(key);
      }

      // If flag not found, return null instead of throwing (fail-safe)
      this.logInfo('getFlag', `Flag not found: ${key}`);
      return null;
    }
  }

  /**
   * Direct database query for fallback
   * (Requirement 4.7, 16.3)
   */
  private async getFlagFromDb(key: string): Promise<FeatureFlag | null> {
    try {
      if (!this.pgClient._connected) {
        await this.pgClient.connect();
      }

      const query = 'SELECT id, is_active, name, description FROM feature_flags WHERE id = $1';
      const res = await this.pgClient.query(query, [key]);

      if (res.rows.length === 0) {
        return null;
      }

      const row = res.rows[0];
      return {
        key: row.id,
        name: row.name || row.id,
        description: row.description,
        enabled: row.is_active,
      };
    } catch (error) {
      this.handleError('getFlagFromDb', error, { key });
      return null; // Ultimate fail-safe
    }
  }

  /**
   * Retrieve all feature flags with pagination
   * Implements pagination on top of fflags-lib getAllFlags
   */
  async getAllFlags(pagination: PaginationDto): Promise<PaginatedResult<FeatureFlag>> {
    try {
      const page = pagination.page || 1;
      const limit = pagination.limit || 10;

      this.logOperation('getAllFlags', { page, limit });

      // Get all flags from fflags-lib
      const allFlags = await this.managerService.getAllFlags();

      // Calculate pagination
      const total = allFlags.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      // Slice the results for pagination
      const paginatedFlags = allFlags.slice(startIndex, endIndex);

      // Map to FeatureFlag interface
      const data = paginatedFlags.map((flag) =>
        this.mapToFeatureFlag(flag, flag.key)
      );

      this.logSuccess('getAllFlags', { total, page, limit });

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('No feature flags found')) {
        this.logInfo('getAllFlags', 'No feature flags found, returning empty list');
        return {
          data: [],
          total: 0,
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          totalPages: 0,
        };
      }
      this.handleError('getAllFlags', error, { pagination });
      throw this.wrapError(error, 'Failed to retrieve all flags');
    }
  }

  /**
   * Activate a feature flag
   * Sets flag state to enabled
   */
  async activateFlag(key: string): Promise<void> {
    try {
      this.logOperation('activateFlag', { key });
      await this.managerService.activateFlag(key);
      this.logSuccess('activateFlag', { key });
    } catch (error) {
      this.handleError('activateFlag', error, { key });
      throw this.wrapError(error, `Failed to activate flag with key '${key}'`);
    }
  }

  /**
   * Deactivate a feature flag
   * Sets flag state to disabled
   */
  async deactivateFlag(key: string): Promise<void> {
    try {
      this.logOperation('deactivateFlag', { key });
      await this.managerService.deactivateFlag(key);
      this.logSuccess('deactivateFlag', { key });
    } catch (error) {
      this.handleError('deactivateFlag', error, { key });
      throw this.wrapError(error, `Failed to deactivate flag with key '${key}'`);
    }
  }

  /**
   * Delete a feature flag
   * Removes flag from both Redis cache and PostgreSQL
   */
  async deleteFlag(key: string): Promise<void> {
    try {
      this.logOperation('deleteFlag', { key });
      await this.managerService.deleteFlag(key);
      this.logSuccess('deleteFlag', { key });
    } catch (error) {
      this.handleError('deleteFlag', error, { key });
      throw this.wrapError(error, `Failed to delete flag with key '${key}'`);
    }
  }

  /**
   * Close connections and cleanup
   */
  async close(): Promise<void> {
    try {
      this.logOperation('close', {});
      await this.managerService.quit();
      await this.redisClient.quit();
      if (this.pgClient._connected) {
        await this.pgClient.end();
      }
      this.logSuccess('close', {});
    } catch (error) {
      this.handleError('close', error, {});
      throw this.wrapError(error, 'Failed to close connections');
    }
  }

  /**
   * Map fflags-lib FeatureFlag to domain FeatureFlag
   * Note: fflags-lib doesn't provide timestamps, so we don't set them
   */
  private mapToFeatureFlag(
    flag: { key: string; isActive: boolean; description?: string },
    name: string
  ): FeatureFlag {
    return {
      key: flag.key,
      name: name || flag.key, // Use key as fallback name
      description: flag.description,
      enabled: flag.isActive,
      // Note: fflags-lib doesn't provide timestamps, so we don't set them
    };
  }

  /**
   * Check if error is a "not found" error
   */
  private isNotFoundError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.message.includes('not found') ||
        error.message.includes('does not exist') ||
        error.message.includes('No existe')
      );
    }
    return false;
  }

  /**
   * Wrap error with additional context
   */
  private wrapError(error: unknown, message: string): Error {
    if (error instanceof Error) {
      const wrappedError = new Error(`${message}: ${error.message}`);
      wrappedError.stack = error.stack;
      return wrappedError;
    }
    return new Error(`${message}: ${String(error)}`);
  }

  /**
   * Log operation start
   */
  private logOperation(operation: string, context: Record<string, unknown>): void {
    console.log(`[FlagManagerService] Starting ${operation}`, {
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log operation success
   */
  private logSuccess(operation: string, context: Record<string, unknown>): void {
    console.log(`[FlagManagerService] Completed ${operation}`, {
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log informational message
   */
  private logInfo(operation: string, message: string): void {
    console.info(`[FlagManagerService] ${operation}: ${message}`, {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle and log errors
   */
  private handleError(operation: string, error: unknown, context: Record<string, unknown>): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[FlagManagerService] Error in ${operation}:`, {
      error: errorMessage,
      stack: errorStack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}
