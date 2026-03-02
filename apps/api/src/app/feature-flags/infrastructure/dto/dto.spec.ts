import 'reflect-metadata';
import { validate } from 'class-validator';
import { CreateFlagDto } from './create-flag.dto.js';
import { StrategyDto, StrategyTypeDto } from './strategy.dto.js';
import { PaginationDto } from './pagination.dto.js';
import { EvaluationContextDto } from './evaluation-context.dto.js';
import { plainToInstance } from 'class-transformer';

describe('API DTOs Validation', () => {
    describe('CreateFlagDto', () => {
        it('should pass with valid data', async () => {
            const dto = plainToInstance(CreateFlagDto, {
                key: 'my-feature-flag',
                name: 'My Feature Flag',
                enabled: true,
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail with invalid key format (not kebab-case)', async () => {
            const dto = plainToInstance(CreateFlagDto, {
                key: 'Invalid Key',
                name: 'My Feature Flag',
                enabled: true,
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty('matches');
        });

        it('should fail with too short key', async () => {
            const dto = plainToInstance(CreateFlagDto, {
                key: 'ab',
                name: 'My Flag',
                enabled: true,
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('StrategyDto', () => {
        it('should pass with valid percentage strategy', async () => {
            const dto = plainToInstance(StrategyDto, {
                type: StrategyTypeDto.PERCENTAGE,
                rolloutPercentage: 50,
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });

        it('should fail with invalid percentage (> 100)', async () => {
            const dto = plainToInstance(StrategyDto, {
                type: StrategyTypeDto.PERCENTAGE,
                rolloutPercentage: 150,
            });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should pass with valid recursive composite strategy', async () => {
            const dto = plainToInstance(StrategyDto, {
                type: StrategyTypeDto.COMPOSITE,
                operator: 'AND',
                strategies: [
                    { type: StrategyTypeDto.PERCENTAGE, rolloutPercentage: 100 },
                    { type: StrategyTypeDto.USER_LIST, userIds: ['user-1'] }
                ]
            });
            const errors = await validate(dto, { skipMissingProperties: false });
            expect(errors.length).toBe(0);
        });
    });

    describe('PaginationDto', () => {
        it('should have default values', () => {
            const dto = new PaginationDto();
            expect(dto.page).toBe(1);
            expect(dto.limit).toBe(10);
        });

        it('should fail with invalid page (< 1)', async () => {
            const dto = plainToInstance(PaginationDto, { page: 0 });
            const errors = await validate(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('EvaluationContextDto', () => {
        it('should pass with valid data', async () => {
            const dto = plainToInstance(EvaluationContextDto, {
                userId: 'user-123',
                timestamp: new Date().toISOString(),
            });
            const errors = await validate(dto);
            expect(errors.length).toBe(0);
        });
    });
});
