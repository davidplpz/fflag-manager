import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { FflagsConfigFactory } from '../../../../libs/infrastructure/src/lib/fflags/config.factory.js';
import { Redis } from 'ioredis';
import { Client } from 'pg';

@Controller('health')
export class HealthController {
    @Get()
    async check() {
        const config = FflagsConfigFactory.fromEnvironment();
        const healthStatus: any = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            details: {},
        };

        let isHealthy = true;

        // Check Redis
        try {
            const redis = new Redis({
                host: config.redis.host,
                port: config.redis.port,
                password: config.redis.password,
                connectTimeout: 2000,
            });
            const redisStatus = await redis.ping();
            healthStatus.details.redis = { status: redisStatus === 'PONG' ? 'up' : 'down' };
            if (redisStatus !== 'PONG') isHealthy = false;
            await redis.quit();
        } catch (error: any) {
            healthStatus.details.redis = { status: 'down', error: error.message };
            isHealthy = false;
        }

        // Check PostgreSQL
        try {
            const pgClient = new Client({
                host: config.database.host,
                port: config.database.port,
                user: config.database.username,
                password: config.database.password,
                database: config.database.database,
                connectionTimeoutMillis: 2000,
            });
            await pgClient.connect();
            const pgResult = await pgClient.query('SELECT 1');
            healthStatus.details.database = { status: pgResult.rowCount === 1 ? 'up' : 'down' };
            if (pgResult.rowCount !== 1) isHealthy = false;
            await pgClient.end();
        } catch (error: any) {
            healthStatus.details.database = { status: 'down', error: error.message };
            isHealthy = false;
        }

        if (!isHealthy) {
            healthStatus.status = 'error';
            throw new ServiceUnavailableException(healthStatus);
        }

        return healthStatus;
    }
}
