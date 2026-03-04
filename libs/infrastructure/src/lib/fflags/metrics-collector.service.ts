import { MetricEvent } from '@org/domain';
import pkg from 'pg';
const { Client } = pkg;
import { FflagsConfig } from './config.interface.js';

export class MetricsCollectorService {
    private buffer: MetricEvent[] = [];
    private readonly MAX_BUFFER_SIZE = 100;
    private readonly FLUSH_INTERVAL_MS = 10000;
    private flushTimer: NodeJS.Timeout | null = null;

    private pgClient: any;
    private circuitBreaker = {
        state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
        failures: 0,
        lastFailureTime: 0,
        threshold: 5,
        resetTimeoutMs: 60000,
    };

    constructor(config: FflagsConfig) {
        this.pgClient = new Client({
            host: config.database.host,
            port: config.database.port,
            user: config.database.username,
            password: config.database.password,
            database: config.database.database,
        });

        this.startFlushTimer();
    }

    public getMetricsByFlag = async (key: string, timeWindow: '1h' | '24h' | '7d' | '30d'): Promise<any> => {
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

        const res = await this.pgClient.query(query, [key, start, end]);
        const row = res.rows[0];

        const totalEvaluations = parseInt(row.total || '0', 10);
        const enabledCount = parseInt(row.enabled || '0', 10);
        const disabledCount = parseInt(row.disabled || '0', 10);
        const uniqueUsers = parseInt(row.users || '0', 10);
        const successRate = totalEvaluations > 0 ? enabledCount / totalEvaluations : 0;

        return {
            flagKey: key,
            totalEvaluations,
            enabledCount,
            disabledCount,
            uniqueUsers,
            successRate
        };
    };

    private getWindowMs(timeWindow: string): number {
        switch (timeWindow) {
            case '1h': return 3600000;
            case '24h': return 86400000;
            case '7d': return 604800000;
            case '30d': return 2592000000;
            default: return 3600000;
        }
    }

    async recordEvent(event: MetricEvent): Promise<void> {
        this.buffer.push(event);
        if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
            await this.flush();
        }
    }

    private startFlushTimer() {
        this.flushTimer = setInterval(() => this.flush(), this.FLUSH_INTERVAL_MS);
    }

    async flush(): Promise<void> {
        if (this.buffer.length === 0 || this.isCircuitOpen()) {
            return;
        }

        const eventsToFlush = [...this.buffer];
        this.buffer = [];

        try {
            if (!this.pgClient._connected) {
                await this.pgClient.connect();
            }

            const query = `
                INSERT INTO metric_events (flag_key, result, user_id, context, timestamp)
                VALUES ${eventsToFlush.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(',')}
            `;

            const values = eventsToFlush.flatMap(e => [
                e.flagKey,
                e.result,
                e.userId || null,
                e.context ? JSON.stringify(e.context) : null,
                e.timestamp
            ]);

            await this.pgClient.query(query, values);
            this.onSuccess();
        } catch (error) {
            this.onError(error);
            console.error('[MetricsCollectorService] Failed to flush metrics:', error);
            // Re-buffer if possible? For now just drop to avoid memory leak if DB is down.
        }
    }

    private isCircuitOpen(): boolean {
        if (this.circuitBreaker.state === 'OPEN') {
            if (Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.resetTimeoutMs) {
                this.circuitBreaker.state = 'HALF_OPEN';
                return false;
            }
            return true;
        }
        return false;
    }

    private onSuccess() {
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.state = 'CLOSED';
    }

    private onError(error: any) {
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailureTime = Date.now();
        if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
            this.circuitBreaker.state = 'OPEN';
            console.warn('[MetricsCollectorService] Circuit Breaker OPEN');
        }
    }

    async close(): Promise<void> {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        await this.flush();
        if (this.pgClient._connected) {
            await this.pgClient.end();
        }
    }
}
