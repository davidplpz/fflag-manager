import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsController } from './feature-flags.controller.js';
import { FEATURE_FLAGS_SERVICE_TOKEN } from '../../application/ports/feature-flags-service.token.js';
import { IFeatureFlagsService } from '../../application/ports/feature-flags-service.interface.js';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../../auth/application/services/auth.service.js';

describe('FeatureFlagsController (Property Tests)', () => {
    let controller: FeatureFlagsController;
    let service: jest.Mocked<IFeatureFlagsService>;

    beforeEach(async () => {
        service = {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            controllers: [FeatureFlagsController],
            providers: [
                {
                    provide: FEATURE_FLAGS_SERVICE_TOKEN,
                    useValue: service,
                },
                {
                    provide: AuthService,
                    useValue: {
                        validateToken: jest.fn(),
                    },
                },
                Reflector,
            ],
        }).compile();

        controller = module.get<FeatureFlagsController>(FeatureFlagsController);
    });

    it('Property 3: Flag State Transitions - should correctly toggle status', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3 }),
                fc.boolean(),
                async (key, enabled) => {
                    service.update.mockResolvedValue({
                        key,
                        enabled,
                        name: 'Test',
                        description: 'Test',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    const result = await controller.update(key, { enabled } as any);
                    expect(result.enabled).toBe(enabled);
                    expect(service.update).toHaveBeenCalledWith(key, expect.objectContaining({ enabled }));
                    service.update.mockClear();
                }
            )
        );
    });

    it('Property 4: Flag Deletion - should call remove service', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3 }),
                async (key) => {
                    service.remove.mockResolvedValue(undefined);
                    await controller.remove(key);
                    expect(service.remove).toHaveBeenCalledWith(key);
                    service.remove.mockClear();
                }
            )
        );
    });

    it('Property 7: Timestamp Metadata - should return updated flag with modern timestamps', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 3 }),
                async (key) => {
                    const now = new Date();
                    service.findOne.mockResolvedValue({
                        key,
                        enabled: true,
                        name: 'Test',
                        description: 'Test',
                        createdAt: new Date(now.getTime() - 1000),
                        updatedAt: now,
                    });

                    const result = await controller.findOne(key);
                    expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(result.createdAt.getTime());
                    service.findOne.mockClear();
                }
            )
        );
    });
});
