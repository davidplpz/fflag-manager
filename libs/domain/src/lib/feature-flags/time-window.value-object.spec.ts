import { TimeWindow } from './time-window.value-object.js';

describe('TimeWindow', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

    describe('Validation', () => {
        it('should create a valid TimeWindow', () => {
            const window = new TimeWindow(oneHourAgo, inOneHour);
            expect(window.start).toEqual(oneHourAgo);
            expect(window.end).toEqual(inOneHour);
        });

        it('should throw an error if start >= end', () => {
            expect(() => new TimeWindow(now, now)).toThrow('Start date must be before end date');
            expect(() => new TimeWindow(inOneHour, oneHourAgo)).toThrow('Start date must be before end date');
        });
    });

    describe('contains', () => {
        it('should return true for a timestamp within the window', () => {
            const window = new TimeWindow(oneHourAgo, inOneHour);
            expect(window.contains(now)).toBe(true);
        });

        it('should return false for a timestamp before the window', () => {
            const window = new TimeWindow(now, inOneHour);
            expect(window.contains(oneHourAgo)).toBe(false);
        });

        it('should return false for a timestamp after the window', () => {
            const window = new TimeWindow(oneHourAgo, now);
            expect(window.contains(inOneHour)).toBe(false);
        });

        it('should return true for start timestamp (inclusive)', () => {
            const window = new TimeWindow(oneHourAgo, inOneHour);
            expect(window.contains(oneHourAgo)).toBe(true);
        });

        it('should return false for end timestamp (exclusive)', () => {
            const window = new TimeWindow(oneHourAgo, inOneHour);
            expect(window.contains(inOneHour)).toBe(false);
        });
    });

    describe('getDurationInHours', () => {
        it('should return correct duration', () => {
            const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
            const window = new TimeWindow(now, twoHoursLater);
            expect(window.getDurationInHours()).toBe(2);
        });
    });

    describe('fromPreset', () => {
        it('should create a TimeWindow for 1h preset', () => {
            const window = TimeWindow.fromPreset('1h');
            expect(window.getDurationInHours()).toBe(1);
        });

        it('should create a TimeWindow for 24h preset', () => {
            const window = TimeWindow.fromPreset('24h');
            expect(window.getDurationInHours()).toBe(24);
        });

        it('should create a TimeWindow for 7d preset', () => {
            const window = TimeWindow.fromPreset('7d');
            expect(window.getDurationInHours()).toBe(168); // 7 * 24
        });

        it('should create a TimeWindow for 30d preset', () => {
            const window = TimeWindow.fromPreset('30d');
            expect(window.getDurationInHours()).toBe(720); // 30 * 24
        });

        it('should throw for unknown preset', () => {
            // @ts-expect-error - testing invalid input
            expect(() => TimeWindow.fromPreset('invalid')).toThrow('Unknown preset');
        });
    });
});
