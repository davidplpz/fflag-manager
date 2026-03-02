/**
 * Configuration interface for fflags-lib integration
 * Defines database and Redis connection settings
 */
export interface FflagsConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  database: {
    type: 'postgres' | 'mysql';
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
}

/**
 * Environment-specific configuration options
 */
export interface FflagsEnvironmentConfig {
  environment: 'development' | 'test' | 'production';
  redis: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  database: {
    type?: 'postgres' | 'mysql';
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
  };
}
