import { AnalyticsAggregate } from '@org/domain';
import pkg from 'pg';
const { Client } = pkg;
import { Redis } from 'ioredis';
import { FflagsConfig } from './config.interface.js';

export class AnalyticsEngineService {
    private pgClient: any;
    private redisClient: Redis;

    constructor(config: FflagsConfig) {
        this.pgClient = new Client({
            host: config.database.host,
            port: config.database.port,
            user: config.database.username,
            password: config.database.password,
            database: config.database.database,
        });

        this.redisClient = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            db: config.redis.db,
        });
    }

    async getAnalytics(flagKey: string, timeWindow: '1h' | '24h' | '7d' | '30d'): Promise<AnalyticsAggregate> {
        const cacheKey = `analytics:${flagKey}:${timeWindow}`;
        const cached = await this.redisClient.get(cacheKey);

        if (cached) {
            const data = JSON.parse(cached);
            return new AnalyticsAggregate({
                ...data,
                windowStart: new Date(data.windowStart),
                windowEnd: new Date(data.windowEnd),
            });
        }

        const aggregate = await this.calculateAnalytics(flagKey, timeWindow);

        await this.redisClient.setex(cacheKey, 60, JSON.stringify(aggregate));

        return aggregate;
    }

    private async calculateAnalytics(flagKey: string, timeWindow: string): Promise<AnalyticsAggregate> {
        if (!this.pgClient._connected) {
            await this.pgClient.connect();
        }

        const windowMs = this.getWindowMs(timeWindow);
        const end = new Date();
        const start = new Date(end.getTime() - windowMs);

        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN result = true THEN 1 END) as enabled,
                COUNT(CASE WHEN result = false THEN 1 END) as disabled,
                COUNT(DISTINCT user_id) as users
            FROM metric_events
            WHERE flag_key = $1 AND timestamp >= $2 AND timestamp <= $3
        `;

        const res = await this.pgClient.query(query, [flagKey, start, end]);
        const row = res.rows[0];

        return new AnalyticsAggregate({
            flagKey,
            timeWindow: timeWindow as any,
            windowStart: start,
            windowEnd: end,
            totalEvaluations: parseInt(row.total || '0'),
            enabledCount: parseInt(row.enabled || '0'),
            disabledCount: parseInt(row.disabled || '0'),
            uniqueUsers: parseInt(row.users || '0'),
        });
    }

    async findUnusedFlags(days: number): Promise<string[]> {
        if (!this.pgClient._connected) {
            await this.pgClient.connect();
        }

        const res = await this.pgClient.query(`
            SELECT id FROM feature_flags
            WHERE id NOT IN (
                SELECT DISTINCT flag_key FROM metric_events
                WHERE timestamp > NOW() - INTERVAL '${days} days'
            )
        `);

        return res.rows.map((r: any) => r.id);
    }

    private getWindowMs(timeWindow: string): number {
        switch (timeWindow) {
            case '1h': return 3600000;
            case '24h': return 86400000;
            case '7d': return 604800000;
            case '30d': return 2592000000;
            default: return 3600000;
        }
    }

    async generateTimeSeries(flagKey: string, timeWindow: '1h' | '24h' | '7d' | '30d'): Promise<any> {
        if (!this.pgClient._connected) {
            await this.pgClient.connect();
        }

        const windowMs = this.getWindowMs(timeWindow);
        const end = new Date();
        const start = new Date(end.getTime() - windowMs);

        let bucketExpression = "date_trunc('hour', timestamp)";
        if (timeWindow === '1h') bucketExpression = "date_trunc('minute', timestamp)";
        else if (timeWindow === '24h') bucketExpression = "date_trunc('hour', timestamp)";
        else bucketExpression = "date_trunc('day', timestamp)";

        const query = `
            SELECT 
                ${bucketExpression} as time_bucket,
                COUNT(*) as evaluations,
                COUNT(DISTINCT user_id) as unique_users
            FROM metric_events
            WHERE flag_key = $1 AND timestamp >= $2 AND timestamp <= $3
            GROUP BY 1
            ORDER BY 1 ASC
        `;

        const res = await this.pgClient.query(query, [flagKey, start, end]);

        return {
            flagKey,
            dataPoints: res.rows.map((r: any) => ({
                timestamp: r.time_bucket,
                evaluations: parseInt(r.evaluations || '0', 10),
                uniqueUsers: parseInt(r.unique_users || '0', 10),
            }))
        };
    }

    async close(): Promise<void> {
        if (this.pgClient._connected) {
            await this.pgClient.end();
        }
        await this.redisClient.quit();
    }
}
