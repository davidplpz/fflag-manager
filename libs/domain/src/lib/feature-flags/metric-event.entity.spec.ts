import { MetricEvent } from './metric-event.entity.js';
import { FlagKey } from './flag-key.value-object.js';

describe('MetricEvent', () => {
    it('should create a valid MetricEvent', () => {
        const event = new MetricEvent({
            flagKey: 'my-flag',
            result: true,
            userId: 'user-1',
        });

        expect(event.id).toBeDefined();
        expect(event.flagKey).toBe('my-flag');
        expect(event.result).toBe(true);
        expect(event.userId).toBe('user-1');
        expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should accept FlagKey VO', () => {
        const flagKey = new FlagKey('my-flag');
        const event = new MetricEvent({
            flagKey,
            result: false,
        });

        expect(event.flagKey).toBe('my-flag');
    });

    it('should throw if flagKey is invalid', () => {
        expect(() => new MetricEvent({
            flagKey: 'INVALID KEY',
            result: true,
        })).toThrow();
    });
});
