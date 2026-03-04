import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsController } from './feature-flags.controller.js';
import { FEATURE_FLAGS_SERVICE_TOKEN } from '../../application/ports/feature-flags-service.token.js';
import type { IFeatureFlagsService } from '../../application/ports/feature-flags-service.interface.js';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard.js';

describe('FeatureFlagsController', () => {
    let controller: FeatureFlagsController;
    let service: IFeatureFlagsService;


    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [FeatureFlagsController],
            providers: [
                {
                    provide: FEATURE_FLAGS_SERVICE_TOKEN,
                    useValue: {
                        create: jest.fn(),
                        findAll: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                        remove: jest.fn(),
                    },
                },
            ],
        })
            .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
            .compile();

        controller = module.get<FeatureFlagsController>(FeatureFlagsController);
        service = module.get<IFeatureFlagsService>(FEATURE_FLAGS_SERVICE_TOKEN);

    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should call service.create', async () => {
        const dto = { key: 'test', name: 'Test', enabled: true };
        await controller.create(dto as any);
        expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should call service.findAll', async () => {
        await controller.findAll({ page: 1, limit: 10 });
        expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });
});
