import { FflagsConfig, FflagsEnvironmentConfig } from './config.interface.js';

/**
 * Factory for creating fflags-lib configuration based on environment
 * Maps environment variables to configuration objects
 */
export class FflagsConfigFactory {
  /**
   * Create configuration from environment variables
   */
  static fromEnvironment(): FflagsConfig {
    return {
      redis: {
        host: process.env['REDIS_HOST'] || 'localhost',
        port: parseInt(process.env['REDIS_PORT'] || '6379', 10),
        password: process.env['REDIS_PASSWORD'],
        db: parseInt(process.env['REDIS_DB'] || '0', 10),
        keyPrefix: process.env['REDIS_KEY_PREFIX'] || 'fflags:',
      },
      database: {
        type: (process.env['DATABASE_TYPE'] as 'postgres' | 'mysql') || 'postgres',
        host: process.env['DATABASE_HOST'] || 'localhost',
        port: parseInt(process.env['DATABASE_PORT'] || '5432', 10),
        username: process.env['DATABASE_USERNAME'] || 'postgres',
        password: process.env['DATABASE_PASSWORD'] || 'postgres',
        database: process.env['DATABASE_NAME'] || 'feature_flags',
      },
    };
  }

  /**
   * Create configuration for specific environment with overrides
   */
  static forEnvironment(
    environment: 'development' | 'test' | 'production',
    overrides?: Partial<FflagsEnvironmentConfig>
  ): FflagsConfig {
    const baseConfig = this.getBaseConfigForEnvironment(environment);
    
    if (overrides) {
      return {
        redis: {
          ...baseConfig.redis,
          ...overrides.redis,
        },
        database: {
          ...baseConfig.database,
          ...overrides.database,
        },
      };
    }

    return baseConfig;
  }

  /**
   * Create configuration for development environment
   */
  static forDevelopment(): FflagsConfig {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'fflags:dev:',
      },
      database: {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'feature_flags_dev',
      },
    };
  }

  /**
   * Create configuration for test environment
   */
  static forTest(): FflagsConfig {
    return {
      redis: {
        host: 'localhost',
        port: 6379,
        db: 1, // Use different DB for tests
        keyPrefix: 'fflags:test:',
      },
      database: {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'feature_flags_test',
      },
    };
  }

  /**
   * Create configuration for production environment
   */
  static forProduction(): FflagsConfig {
    // In production, always use environment variables
    const config = this.fromEnvironment();
    
    // Validate required fields
    this.validateProductionConfig(config);
    
    return config;
  }

  /**
   * Validate that production configuration has all required fields
   */
  private static validateProductionConfig(config: FflagsConfig): void {
    const errors: string[] = [];

    if (!config.redis.host) {
      errors.push('REDIS_HOST is required in production');
    }

    if (!config.database.host) {
      errors.push('DATABASE_HOST is required in production');
    }

    if (!config.database.password) {
      errors.push('DATABASE_PASSWORD is required in production');
    }

    if (errors.length > 0) {
      throw new Error(
        `Invalid production configuration:\n${errors.join('\n')}`
      );
    }
  }

  /**
   * Get base configuration for environment
   */
  private static getBaseConfigForEnvironment(
    environment: 'development' | 'test' | 'production'
  ): FflagsConfig {
    switch (environment) {
      case 'development':
        return this.forDevelopment();
      case 'test':
        return this.forTest();
      case 'production':
        return this.forProduction();
      default:
        throw new Error(`Unknown environment: ${environment}`);
    }
  }
}
