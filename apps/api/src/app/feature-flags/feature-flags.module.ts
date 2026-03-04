import { Module } from '@nestjs/common';
import { FeatureFlagsController } from './infrastructure/controllers/feature-flags.controller.js';
import { FeatureFlagsService, STRATEGY_EVALUATOR_TOKEN, METRICS_COLLECTOR_TOKEN, ANALYTICS_ENGINE_TOKEN } from './application/services/feature-flags.service.js';
import { FLAG_REPOSITORY_TOKEN } from './domain/repositories/flag.repository.js';
import { FlagManagerAdapter } from './infrastructure/repositories/flag-manager.adapter.js';
import { FEATURE_FLAGS_SERVICE_TOKEN } from './application/ports/feature-flags-service.token.js';
import { FlagManagerService, MetricsCollectorService, AnalyticsEngineService } from '@org/infrastructure';
import { StrategyEvaluator } from '@org/domain';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [AuthModule],
    controllers: [FeatureFlagsController],
    providers: [
        {
            provide: FEATURE_FLAGS_SERVICE_TOKEN,
            useClass: FeatureFlagsService,
        },
        FeatureFlagsService,
        {
            provide: 'IFlagManager',
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return new FlagManagerService({
                    redis: {
                        host: config.get<string>('REDIS_HOST', 'localhost'),
                        port: config.get<number>('REDIS_PORT', 6379),
                        password: config.get<string>('REDIS_PASSWORD'),
                        db: config.get<number>('REDIS_DB', 0),
                        keyPrefix: config.get<string>('REDIS_PREFIX', 'ff:'),
                    },
                    database: {
                        host: config.get<string>('POSTGRES_HOST', 'localhost'),
                        port: config.get<number>('POSTGRES_PORT', 5432),
                        user: config.get<string>('POSTGRES_USER', 'postgres'),
                        password: config.get<string>('POSTGRES_PASSWORD', 'postgres'),
                        database: config.get<string>('POSTGRES_DB', 'fflags'),
                    }
                } as any);
            }
        },
        {
            provide: FLAG_REPOSITORY_TOKEN,
            useClass: FlagManagerAdapter,
        },
        {
            provide: STRATEGY_EVALUATOR_TOKEN,
            useClass: StrategyEvaluator,
        },
        {
            provide: METRICS_COLLECTOR_TOKEN,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return new MetricsCollectorService({
                    redis: {
                        host: config.get<string>('REDIS_HOST', 'localhost'),
                        port: config.get<number>('REDIS_PORT', 6379),
                        password: config.get<string>('REDIS_PASSWORD'),
                        db: config.get<number>('REDIS_DB', 0),
                        keyPrefix: config.get<string>('REDIS_PREFIX', 'ff:'),
                    },
                    database: {
                        host: config.get<string>('POSTGRES_HOST', 'localhost'),
                        port: config.get<number>('POSTGRES_PORT', 5432),
                        username: config.get<string>('POSTGRES_USER', 'postgres'),
                        password: config.get<string>('POSTGRES_PASSWORD', 'postgres'),
                        database: config.get<string>('POSTGRES_DB', 'fflags'),
                    }
                } as any);
            }
        },
        {
            provide: ANALYTICS_ENGINE_TOKEN,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                return new AnalyticsEngineService({
                    redis: {
                        host: config.get<string>('REDIS_HOST', 'localhost'),
                        port: config.get<number>('REDIS_PORT', 6379),
                        password: config.get<string>('REDIS_PASSWORD'),
                        db: config.get<number>('REDIS_DB', 0),
                        keyPrefix: config.get<string>('REDIS_PREFIX', 'ff:'),
                    },
                    database: {
                        host: config.get<string>('POSTGRES_HOST', 'localhost'),
                        port: config.get<number>('POSTGRES_PORT', 5432),
                        username: config.get<string>('POSTGRES_USER', 'postgres'),
                        password: config.get<string>('POSTGRES_PASSWORD', 'postgres'),
                        database: config.get<string>('POSTGRES_DB', 'fflags'),
                    }
                } as any);
            }
        },
    ],
    exports: [FeatureFlagsService],
})
export class FeatureFlagsModule { }
