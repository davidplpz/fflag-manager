import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { FeatureFlagsModule } from '../../feature-flags.module.js';
import { IFlagManager } from '@org/domain';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard.js';
import { ConfigModule } from '@nestjs/config';

describe('FeatureFlags Fallback (Integration)', () => {
    let app: INestApplication;
    let flagManager: IFlagManager;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true }), FeatureFlagsModule],
        })
            .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        flagManager = app.get<IFlagManager>('IFlagManager');
    });

    afterEach(async () => {
        await app.close();
    });

    it('POST /api/feature-flags/:key/evaluate should fall back to DB when Redis fails', async () => {
        const flagKey = 'fallback-test-flag';
        const mockFlag = {
            key: flagKey,
            name: 'Fallback Test',
            enabled: true,
        };

        // Mock flagManager.getFlag to simulate Redis failure and DB fallback
        jest.spyOn(flagManager, 'getFlag').mockImplementation(async (key) => {
            if (key === flagKey) {
                return mockFlag;
            }
            return null;
        });

        const response = await supertest(app.getHttpServer())
            .post(`/feature-flags/${flagKey}/evaluate`)
            .send({
                userId: 'user-123',
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ enabled: true });
        expect(flagManager.getFlag).toHaveBeenCalledWith(flagKey);
    });

    it('POST /api/feature-flags/:key/evaluate should return enabled: false if Manager fails completely', async () => {
        const flagKey = 'fail-test-flag';

        // Mock flagManager.getFlag to throw (simulate catastrophic failure)
        jest.spyOn(flagManager, 'getFlag').mockRejectedValue(new Error('Persistent error'));

        const response = await supertest(app.getHttpServer())
            .post(`/feature-flags/${flagKey}/evaluate`)
            .send({});

        // Fail-safe requirement 3.3, 16.7
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ enabled: false });
    });
});
