import { AnalyticsAggregate } from './analytics-aggregate.entity.js';

describe('AnalyticsAggregate', () => {
    it('should create a valid AnalyticsAggregate and calculate ratios', () => {
        const start = new Date();
        const end = new Date(start.getTime() + 3600000);
        const aggregate = new AnalyticsAggregate({
            flagKey: 'test-flag',
            timeWindow: '1h',
            windowStart: start,
            windowEnd: end,
            totalEvaluations: 100,
            enabledCount: 80,
            disabledCount: 20,
            uniqueUsers: 10,
        });

        expect(aggregate.enabledRatio).toBe(0.8);
        expect(aggregate.successRate).toBe(0.8);
    });

    it('should handle zero evaluations gracefully', () => {
        const aggregate = new AnalyticsAggregate({
            flagKey: 'test-flag',
            timeWindow: '1h',
            windowStart: new Date(),
            windowEnd: new Date(),
            totalEvaluations: 0,
            enabledCount: 0,
            disabledCount: 0,
            uniqueUsers: 0,
        });

        expect(aggregate.enabledRatio).toBe(0);
    });
});
