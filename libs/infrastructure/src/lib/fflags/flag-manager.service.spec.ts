import { FlagManagerService } from './flag-manager.service.js';
import { FflagsConfig } from './config.interface.js';
import { Redis } from 'ioredis';
import pkg from 'pg';
const { Client } = pkg;
import { ManagerService } from 'fflags-lib';

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      quit: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
    })),
  };
});
jest.mock('pg', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(undefined),
    _connected: false,
  })),
}));
jest.mock('fflags-lib', () => ({
  ManagerService: {
    getInstance: jest.fn().mockReturnValue({
      getFlag: jest.fn(),
      createFlag: jest.fn(),
      getAllFlags: jest.fn(),
      activateFlag: jest.fn(),
      deactivateFlag: jest.fn(),
      deleteFlag: jest.fn(),
      quit: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

describe('FlagManagerService', () => {
  let config: FflagsConfig;

  beforeEach(() => {
    jest.clearAllMocks();
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

      expect(Redis).toHaveBeenCalled();
      expect(Client).toHaveBeenCalled();
      expect(ManagerService.getInstance).toHaveBeenCalled();

      // Clean up
      if (service) {
        service.close().catch(() => { });
      }
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

      service.close().catch(() => { });
    });
  });

  describe('fallback logic', () => {
    it('should fall back to DB query when fflags-lib throws a connection error', async () => {
      const service = new FlagManagerService(config);

      const managerMock = (service as any).managerService;
      managerMock.getFlag.mockRejectedValue(new Error('Redis connection lost'));

      const pgClientMock = (service as any).pgClient;
      pgClientMock.query.mockResolvedValue({
        rows: [{ id: 'test-flag', is_active: true, name: 'Test', description: 'Desc' }]
      });

      const result = await service.getFlag('test-flag');

      expect(managerMock.getFlag).toHaveBeenCalledWith('test-flag');
      expect(pgClientMock.query).toHaveBeenCalled();
      expect(result).toEqual({
        key: 'test-flag',
        name: 'Test',
        enabled: true,
        description: 'Desc',
      });

      service.close().catch(() => { });
    });

    it('should return null if both fflags-lib and DB fallback fail', async () => {
      const service = new FlagManagerService(config);

      const managerMock = (service as any).managerService;
      managerMock.getFlag.mockRejectedValue(new Error('Redis connection lost'));

      const pgClientMock = (service as any).pgClient;
      pgClientMock.query.mockRejectedValue(new Error('DB connection failed'));

      const result = await service.getFlag('test-flag');

      expect(result).toBeNull();

      service.close().catch(() => { });
    });

    it('should NOT fall back if fflags-lib returns a "not found" error', async () => {
      const service = new FlagManagerService(config);

      const managerMock = (service as any).managerService;
      managerMock.getFlag.mockRejectedValue(new Error('Flag not found'));

      const pgClientMock = (service as any).pgClient;

      const result = await service.getFlag('test-flag');

      expect(pgClientMock.query).not.toHaveBeenCalled();
      expect(result).toBeNull();

      service.close().catch(() => { });
    });
  });
});
