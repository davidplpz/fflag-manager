import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsService } from './feature-flags.service.js';
import { FLAG_REPOSITORY_TOKEN } from '../../domain/repositories/flag.repository.js';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('FeatureFlagsService', () => {
    let service: FeatureFlagsService;
    let repository: any;

    beforeEach(async () => {
        repository = {
            save: jest.fn(),
            findByKey: jest.fn(),
            findAll: jest.fn(),
            delete: jest.fn(),
            exists: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FeatureFlagsService,
                {
                    provide: FLAG_REPOSITORY_TOKEN,
                    useValue: repository,
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
});
