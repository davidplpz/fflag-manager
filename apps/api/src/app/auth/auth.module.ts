import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './application/services/auth.service.js';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard.js';
import { RolesGuard } from './infrastructure/guards/roles.guard.js';
import { USER_REPOSITORY_TOKEN } from './domain/repositories/user.repository.js';
import { PgUserRepository } from './infrastructure/repositories/pg-user.repository.js';
import { AuthController } from './infrastructure/controllers/auth.controller.js';

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET', 'secret'),
                signOptions: { expiresIn: '1h' },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        JwtAuthGuard,
        RolesGuard,
        {
            provide: USER_REPOSITORY_TOKEN,
            useClass: PgUserRepository,
        },
    ],
    exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule { }
