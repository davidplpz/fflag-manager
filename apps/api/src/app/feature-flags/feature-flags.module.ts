import { Module } from '@nestjs/common';
import { FeatureFlagsController } from './infrastructure/controllers/feature-flags.controller.js';
import { FeatureFlagsService } from './application/services/feature-flags.service.js';
import { FLAG_REPOSITORY_TOKEN } from './domain/repositories/flag.repository.js';
import { FlagManagerAdapter } from './infrastructure/repositories/flag-manager.adapter.js';
import { FEATURE_FLAGS_SERVICE_TOKEN } from './application/ports/feature-flags-service.token.js';
import { FlagManagerService } from '@org/infrastructure';
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
    ],
    exports: [FeatureFlagsService],
})
export class FeatureFlagsModule { }
