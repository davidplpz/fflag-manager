import { FlagManagerService } from './flag-manager.service';
import { FflagsConfig } from './config.interface';

describe('FlagManagerService', () => {
  let config: FflagsConfig;

  beforeEach(() => {
    config = {
      redis: {
        host: 'localhost',
        port: 6379,
        db: 1,
        keyPrefix: 'test:',
      },
      database: {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'test_db',
      },
    };
  });

  describe('constructor', () => {
    it('should create an instance with valid configuration', () => {
      let service: FlagManagerService | undefined;
      
      expect(() => {
        service = new FlagManagerService(config);
      }).not.toThrow();
      
      // Clean up
      if (service) {
        service.close().catch(() => {
          // Ignore cleanup errors in tests
        });
      }
    });
  });

  describe('interface implementation', () => {
    it('should implement IFlagManager interface with all required methods', () => {
      const service = new FlagManagerService(config);
      
      // Verify all interface methods are defined
      expect(typeof service.createFlag).toBe('function');
      expect(typeof service.getFlag).toBe('function');
      expect(typeof service.getAllFlags).toBe('function');
      expect(typeof service.activateFlag).toBe('function');
      expect(typeof service.deactivateFlag).toBe('function');
      expect(typeof service.deleteFlag).toBe('function');
      
      // Clean up
      service.close().catch(() => {
        // Ignore cleanup errors in tests
      });
    });
  });

  describe('mapping', () => {
    it('should map fflags-lib FeatureFlag to domain FeatureFlag correctly', () => {
      const service = new FlagManagerService(config);
      
      // Access private method through type assertion for testing
      const mapMethod = (service as any).mapToFeatureFlag;
      
      const fflagsFlag = {
        key: 'test-flag',
        isActive: true,
        description: 'Test description',
      };
      
      const result = mapMethod.call(service, fflagsFlag, 'Test Flag');
      
      expect(result).toEqual({
        key: 'test-flag',
        name: 'Test Flag',
        description: 'Test description',
        enabled: true,
      });
      
      // Clean up
      service.close().catch(() => {
        // Ignore cleanup errors in tests
      });
    });

    it('should use key as fallback name when name is empty', () => {
      const service = new FlagManagerService(config);
      
      const mapMethod = (service as any).mapToFeatureFlag;
      
      const fflagsFlag = {
        key: 'test-flag',
        isActive: false,
      };
      
      const result = mapMethod.call(service, fflagsFlag, '');
      
      expect(result.name).toBe('test-flag');
      expect(result.enabled).toBe(false);
      
      // Clean up
      service.close().catch(() => {
        // Ignore cleanup errors in tests
      });
    });
  });

  describe('error detection', () => {
    it('should correctly identify not found errors', () => {
      const service = new FlagManagerService(config);
      
      const isNotFoundError = (service as any).isNotFoundError;
      
      expect(isNotFoundError.call(service, new Error('not found'))).toBe(true);
      expect(isNotFoundError.call(service, new Error('does not exist'))).toBe(true);
      expect(isNotFoundError.call(service, new Error('No existe'))).toBe(true);
      expect(isNotFoundError.call(service, new Error('other error'))).toBe(false);
      expect(isNotFoundError.call(service, 'string error')).toBe(false);
      
      // Clean up
      service.close().catch(() => {
        // Ignore cleanup errors in tests
      });
    });
  });

  describe('error wrapping', () => {
    it('should wrap errors with additional context', () => {
      const service = new FlagManagerService(config);
      
      const wrapError = (service as any).wrapError;
      
      const originalError = new Error('Original message');
      const wrappedError = wrapError.call(service, originalError, 'Context message');
      
      expect(wrappedError.message).toBe('Context message: Original message');
      expect(wrappedError.stack).toBe(originalError.stack);
      
      // Clean up
      service.close().catch(() => {
        // Ignore cleanup errors in tests
      });
    });

    it('should handle non-Error objects', () => {
      const service = new FlagManagerService(config);
      
      const wrapError = (service as any).wrapError;
      
      const wrappedError = wrapError.call(service, 'string error', 'Context message');
      
      expect(wrappedError.message).toBe('Context message: string error');
      
      // Clean up
      service.close().catch(() => {
        // Ignore cleanup errors in tests
      });
    });
  });
});
