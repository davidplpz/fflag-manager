import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { FeatureFlagsModule } from '../../feature-flags.module.js';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard.js';
import { ConfigModule } from '@nestjs/config';
import { METRICS_COLLECTOR_TOKEN, ANALYTICS_ENGINE_TOKEN } from '../../application/services/feature-flags.service.js';

describe('FeatureFlags Metrics & Analytics (Integration)', () => {
    let app: INestApplication;
    let metricsCollectorMock: any;
    let analyticsEngineMock: any;

    beforeEach(async () => {
        metricsCollectorMock = {
            getMetricsByFlag: jest.fn(),
        };
        analyticsEngineMock = {
            getAnalytics: jest.fn(),
            generateTimeSeries: jest.fn(),
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true }), FeatureFlagsModule],
        })
            .overrideProvider('IFlagManager').useValue({})
            .overrideProvider(METRICS_COLLECTOR_TOKEN).useValue(metricsCollectorMock)
            .overrideProvider(ANALYTICS_ENGINE_TOKEN).useValue(analyticsEngineMock)
            .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
            .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterEach(async () => {
        await app.close();
    });

    it('GET /api/feature-flags/:key/metrics should return metrics data', async () => {
        metricsCollectorMock.getMetricsByFlag.mockResolvedValue({
            flagKey: 'test-flag',
            totalEvaluations: 100,
            enabledCount: 80,
            disabledCount: 20,
            uniqueUsers: 50,
            successRate: 0.8,
        });

        const response = await supertest(app.getHttpServer())
            .get('/feature-flags/test-flag/metrics?window=24h');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            flagKey: 'test-flag',
            totalEvaluations: 100,
            enabledCount: 80,
            disabledCount: 20,
            uniqueUsers: 50,
            successRate: 0.8,
        });
        expect(metricsCollectorMock.getMetricsByFlag).toHaveBeenCalledWith('test-flag', '24h');
    });

    it('GET /api/feature-flags/:key/analytics should return combined analytics', async () => {
        analyticsEngineMock.getAnalytics.mockResolvedValue({
            flagKey: 'test-flag',
            timeWindow: '7d',
            totalEvaluations: 100,
            enabledCount: 80,
            disabledCount: 20,
            uniqueUsers: 50,
            enabledRatio: 0.8,
        });

        analyticsEngineMock.generateTimeSeries.mockResolvedValue({
            flagKey: 'test-flag',
            dataPoints: [
                { timestamp: '2023-10-01T00:00:00.000Z', evaluations: 50, uniqueUsers: 25 },
                { timestamp: '2023-10-02T00:00:00.000Z', evaluations: 50, uniqueUsers: 25 },
            ]
        });

        const response = await supertest(app.getHttpServer())
            .get('/feature-flags/test-flag/analytics?window=7d');

        expect(response.status).toBe(200);
        expect(response.body.totalEvaluations).toBe(100);
        expect(response.body.timeSeries.length).toBe(2);

        expect(analyticsEngineMock.getAnalytics).toHaveBeenCalledWith('test-flag', '7d');
        expect(analyticsEngineMock.generateTimeSeries).toHaveBeenCalledWith('test-flag', '7d');
    });
});
