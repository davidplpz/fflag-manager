import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { ServiceUnavailableException } from '@nestjs/common';
import { FflagsConfigFactory } from '../../../../libs/infrastructure/src/lib/fflags/config.factory.js';
import { Redis } from 'ioredis';
import { Client } from 'pg';

// Create basic mock classes
jest.mock('ioredis', () => {
    return {
        Redis: jest.fn().mockImplementation(() => {
            return {
                ping: jest.fn(),
                quit: jest.fn(),
            };
        }),
    };
});

jest.mock('pg', () => {
    return {
        Client: jest.fn().mockImplementation(() => {
            return {
                connect: jest.fn(),
                query: jest.fn(),
                end: jest.fn(),
            };
        }),
    };
});

describe('HealthController', () => {
    let controller: HealthController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HealthController],
        }).compile();

        controller = module.get<HealthController>(HealthController);

        jest.spyOn(FflagsConfigFactory, 'fromEnvironment').mockReturnValue({
            redis: { host: 'localhost', port: 6379 },
            database: { host: 'localhost', port: 5432, username: 'user', password: 'pass', database: 'db', type: 'postgres' }
        } as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 200 and ok status when all services are up', async () => {
        const redisMock = new Redis();
        (redisMock.ping as jest.Mock).mockResolvedValue('PONG');
        (redisMock.quit as jest.Mock).mockResolvedValue('OK');
        (Redis as unknown as jest.Mock).mockReturnValue(redisMock);

        const pgMock = new Client();
        (pgMock.connect as jest.Mock).mockResolvedValue(undefined);
        (pgMock.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
        (pgMock.end as jest.Mock).mockResolvedValue(undefined);
        (Client as unknown as jest.Mock).mockReturnValue(pgMock);

        const result = await controller.check();
        expect(result.status).toBe('ok');
        expect(result.details.redis.status).toBe('up');
        expect(result.details.database.status).toBe('up');
    });

    it('should throw ServiceUnavailableException when Redis is down', async () => {
        const redisMock = new Redis();
        (redisMock.ping as jest.Mock).mockRejectedValue(new Error('Connection Refused'));
        (Redis as unknown as jest.Mock).mockReturnValue(redisMock);

        const pgMock = new Client();
        (pgMock.connect as jest.Mock).mockResolvedValue(undefined);
        (pgMock.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
        (pgMock.end as jest.Mock).mockResolvedValue(undefined);
        (Client as unknown as jest.Mock).mockReturnValue(pgMock);

        await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
    });

    it('should throw ServiceUnavailableException when Database is down', async () => {
        const redisMock = new Redis();
        (redisMock.ping as jest.Mock).mockResolvedValue('PONG');
        (redisMock.quit as jest.Mock).mockResolvedValue('OK');
        (Redis as unknown as jest.Mock).mockReturnValue(redisMock);

        const pgMock = new Client();
        (pgMock.connect as jest.Mock).mockRejectedValue(new Error('DB Error'));
        (Client as unknown as jest.Mock).mockReturnValue(pgMock);

        await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
    });
});
