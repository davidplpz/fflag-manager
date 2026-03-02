import * as fc from 'fast-check';
import { RolloutPercentage } from './rollout-percentage.value-object';

describe('RolloutPercentage', () => {
    describe('Validation', () => {
        it('should create a valid RolloutPercentage', () => {
            expect(new RolloutPercentage(0).toNumber()).toBe(0);
            expect(new RolloutPercentage(50).toNumber()).toBe(50);
            expect(new RolloutPercentage(100).toNumber()).toBe(100);
        });

        it('should throw an error for percentage < 0', () => {
            expect(() => new RolloutPercentage(-1)).toThrow('Percentage must be between 0 and 100');
        });

        it('should throw an error for percentage > 100', () => {
            expect(() => new RolloutPercentage(101)).toThrow('Percentage must be between 0 and 100');
        });

        it('should throw an error for non-integer percentage', () => {
            expect(() => new RolloutPercentage(50.5)).toThrow('Percentage must be an integer');
        });
    });

    describe('Helper methods', () => {
        it('should correctly identify full rollout', () => {
            expect(new RolloutPercentage(100).isFullRollout()).toBe(true);
            expect(new RolloutPercentage(99).isFullRollout()).toBe(false);
        });

        it('should correctly identify no rollout', () => {
            expect(new RolloutPercentage(0).isNoRollout()).toBe(true);
            expect(new RolloutPercentage(1).isNoRollout()).toBe(false);
        });
    });

    describe('Property-based testing (Requirement 16.5)', () => {
        it('should always validate integers between 0 and 100', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 0, max: 100 }),
                    (val) => {
                        const rollout = new RolloutPercentage(val);
                        return rollout.toNumber() === val;
                    }
                )
            );
        });

        it('should throw for values outside 0-100', () => {
            fc.assert(
                fc.property(
                    fc.oneof(
                        fc.integer({ max: -1 }),
                        fc.integer({ min: 101 })
                    ),
                    (val) => {
                        try {
                            new RolloutPercentage(val);
                            return false;
                        } catch (e) {
                            return true;
                        }
                    }
                )
            );
        });
    });
});
