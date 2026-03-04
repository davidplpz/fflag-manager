import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsService, STRATEGY_EVALUATOR_TOKEN, METRICS_COLLECTOR_TOKEN } from './feature-flags.service.js';
import { FLAG_REPOSITORY_TOKEN } from '../../domain/repositories/flag.repository.js';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('FeatureFlagsService', () => {
    let service: FeatureFlagsService;
    let repository: any;
    let strategyEvaluator: any;
    let metricsCollector: any;

    beforeEach(async () => {
        repository = {
            save: jest.fn(),
            findByKey: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
            updateState: jest.fn(),
        };

        strategyEvaluator = {
            evaluate: jest.fn().mockReturnValue(true),
        };

        metricsCollector = {
            recordEvent: jest.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FeatureFlagsService,
                {
                    provide: FLAG_REPOSITORY_TOKEN,
                    useValue: repository,
                },
                {
                    provide: STRATEGY_EVALUATOR_TOKEN,
                    useValue: strategyEvaluator,
                },
                {
                    provide: METRICS_COLLECTOR_TOKEN,
                    useValue: metricsCollector,
                },
            ],
        }).compile();

        service = module.get<FeatureFlagsService>(FeatureFlagsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new flag', async () => {
            const dto = { key: 'test-flag', name: 'Test Flag', enabled: true };
            repository.exists.mockResolvedValue(false);
            repository.save.mockResolvedValue(undefined);

            const result = await service.create(dto);
            expect(result.key).toBe(dto.key);
            expect(repository.save).toHaveBeenCalled();
        });

        it('should throw ConflictException if flag exists', async () => {
            repository.exists.mockResolvedValue(true);
            await expect(service.create({ key: 'exists' })).rejects.toThrow(ConflictException);
        });
    });

    describe('findOne', () => {
        it('should return a flag if found', async () => {
            const flag = { key: 'test' };
            repository.findByKey.mockResolvedValue(flag);
            const result = await service.findOne('test');
            expect(result).toBe(flag);
        });

        it('should throw NotFoundException if not found', async () => {
            repository.findByKey.mockResolvedValue(null);
            await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
        });
    });

    describe('evaluate', () => {
        it('should return { enabled: false } when flag does not exist (fail-safe)', async () => {
            repository.findByKey.mockResolvedValue(null);

            const result = await service.evaluate('non-existent', {});

            expect(result).toEqual({ enabled: false });
            expect(strategyEvaluator.evaluate).not.toHaveBeenCalled();
        });

        it('should return { enabled: false } when flag is globally disabled', async () => {
            repository.findByKey.mockResolvedValue({
                key: 'my-flag',
                name: 'My Flag',
                enabled: false,
            });

            const result = await service.evaluate('my-flag', { userId: 'user-1' });

            expect(result).toEqual({ enabled: false });
            expect(strategyEvaluator.evaluate).not.toHaveBeenCalled();
        });

        it('should return { enabled: true } for an enabled flag with no strategy', async () => {
            repository.findByKey.mockResolvedValue({
                key: 'my-flag',
                name: 'My Flag',
                enabled: true,
            });

            const result = await service.evaluate('my-flag', {});

            expect(result).toEqual({ enabled: true });
            expect(strategyEvaluator.evaluate).not.toHaveBeenCalled();
        });

        it('should delegate to strategyEvaluator when flag has a strategy', async () => {
            const strategy = { type: 'PERCENTAGE', rolloutPercentage: 50 };
            repository.findByKey.mockResolvedValue({
                key: 'my-flag',
                name: 'My Flag',
                enabled: true,
                strategy,
            });
            strategyEvaluator.evaluate.mockReturnValue(false);

            const result = await service.evaluate('my-flag', { userId: 'user-42' });

            expect(strategyEvaluator.evaluate).toHaveBeenCalledWith(
                strategy,
                expect.objectContaining({ userId: 'user-42' }),
            );
            expect(result).toEqual({ enabled: false });
        });

        it('should record a metric event on each evaluation', async () => {
            repository.findByKey.mockResolvedValue({
                key: 'my-flag',
                name: 'My Flag',
                enabled: true,
            });

            await service.evaluate('my-flag', { userId: 'user-1' });

            expect(metricsCollector.recordEvent).toHaveBeenCalledTimes(1);
        });

        it('should record metric even for non-existent flags', async () => {
            repository.findByKey.mockResolvedValue(null);

            await service.evaluate('missing-flag', {});

            expect(metricsCollector.recordEvent).toHaveBeenCalledTimes(1);
        });

        it('should return { enabled: false } (fail-safe) when repository throws', async () => {
            repository.findByKey.mockRejectedValue(new Error('Connection refused'));

            const result = await service.evaluate('my-flag', {});

            expect(result).toEqual({ enabled: false });
        });

        it('should return { enabled: false } (fail-safe) when strategyEvaluator throws', async () => {
            const strategy = { type: 'PERCENTAGE', rolloutPercentage: 50 };
            repository.findByKey.mockResolvedValue({
                key: 'my-flag',
                name: 'My Flag',
                enabled: true,
                strategy,
            });
            strategyEvaluator.evaluate.mockImplementation(() => {
                throw new Error('Strategy error');
            });

            const result = await service.evaluate('my-flag', {});

            expect(result).toEqual({ enabled: false });
        });

        it('should still evaluate correctly when metricsCollector.recordEvent fails', async () => {
            repository.findByKey.mockResolvedValue({
                key: 'my-flag',
                name: 'My Flag',
                enabled: true,
            });
            metricsCollector.recordEvent.mockRejectedValue(new Error('DB down'));

            const result = await service.evaluate('my-flag', {});

            // Metric failure must not crash evaluation
            expect(result).toEqual({ enabled: true });
        });
    });
});
