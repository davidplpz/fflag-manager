import * as fc from 'fast-check';
import { StrategyEvaluator } from './strategy-evaluator.js';
import { StrategyType, EvaluationContext, PercentageStrategy, UserListStrategy, TimeWindowStrategy, CompositeStrategy, StrategyOperator } from './strategy.interface.js';

describe('StrategyEvaluator', () => {
    const evaluator = new StrategyEvaluator();

    describe('PercentageStrategy', () => {
        it('should enable flag if user hash is within percentage', () => {
            const strategy: PercentageStrategy = {
                type: StrategyType.PERCENTAGE,
                rolloutPercentage: 100,
            };
            const context: EvaluationContext = { userId: 'user-1' };
            expect(evaluator.evaluate(strategy, context)).toBe(true);
        });

        it('should disable flag if user hash is outside percentage', () => {
            const strategy: PercentageStrategy = {
                type: StrategyType.PERCENTAGE,
                rolloutPercentage: 0,
            };
            const context: EvaluationContext = { userId: 'user-1' };
            expect(evaluator.evaluate(strategy, context)).toBe(false);
        });

        it('should disable flag if userId is missing', () => {
            const strategy: PercentageStrategy = {
                type: StrategyType.PERCENTAGE,
                rolloutPercentage: 100,
            };
            const context: EvaluationContext = {};
            expect(evaluator.evaluate(strategy, context)).toBe(false);
        });

        it('should be deterministic (same user, same percentage -> same result)', () => {
            const strategy: PercentageStrategy = {
                type: StrategyType.PERCENTAGE,
                rolloutPercentage: 50,
            };
            const context: EvaluationContext = { userId: 'user-id-123' };

            const result1 = evaluator.evaluate(strategy, context);
            const result2 = evaluator.evaluate(strategy, context);

            expect(result1).toBe(result2);
        });
    });

    describe('UserListStrategy', () => {
        it('should enable flag if userId is in whitelist', () => {
            const strategy: UserListStrategy = {
                type: StrategyType.USER_LIST,
                userIds: ['user-1', 'user-2'],
                isBlacklist: false,
            };
            expect(evaluator.evaluate(strategy, { userId: 'user-1' })).toBe(true);
        });

        it('should disable flag if userId is not in whitelist', () => {
            const strategy: UserListStrategy = {
                type: StrategyType.USER_LIST,
                userIds: ['user-1', 'user-2'],
                isBlacklist: false,
            };
            expect(evaluator.evaluate(strategy, { userId: 'user-3' })).toBe(false);
        });

        it('should disable flag if userId is in blacklist', () => {
            const strategy: UserListStrategy = {
                type: StrategyType.USER_LIST,
                userIds: ['user-1', 'user-2'],
                isBlacklist: true,
            };
            expect(evaluator.evaluate(strategy, { userId: 'user-1' })).toBe(false);
        });

        it('should enable flag if userId is not in blacklist', () => {
            const strategy: UserListStrategy = {
                type: StrategyType.USER_LIST,
                userIds: ['user-1', 'user-2'],
                isBlacklist: true,
            };
            expect(evaluator.evaluate(strategy, { userId: 'user-3' })).toBe(true);
        });
    });

    describe('TimeWindowStrategy', () => {
        const now = new Date();
        const start = new Date(now.getTime() - 1000);
        const end = new Date(now.getTime() + 1000);

        it('should enable flag if within time window', () => {
            const strategy: TimeWindowStrategy = {
                type: StrategyType.TIME_WINDOW,
                startTime: start,
                endTime: end,
            };
            expect(evaluator.evaluate(strategy, { timestamp: now })).toBe(true);
        });

        it('should disable flag if before time window', () => {
            const strategy: TimeWindowStrategy = {
                type: StrategyType.TIME_WINDOW,
                startTime: end,
                endTime: new Date(end.getTime() + 1000),
            };
            expect(evaluator.evaluate(strategy, { timestamp: now })).toBe(false);
        });
    });

    describe('CompositeStrategy', () => {
        const strategyTrue: PercentageStrategy = { type: StrategyType.PERCENTAGE, rolloutPercentage: 100 };
        const strategyFalse: PercentageStrategy = { type: StrategyType.PERCENTAGE, rolloutPercentage: 0 };

        it('should evaluate AND correctly', () => {
            const strategy: CompositeStrategy = {
                type: StrategyType.COMPOSITE,
                operator: StrategyOperator.AND,
                strategies: [strategyTrue, strategyTrue],
            };
            expect(evaluator.evaluate(strategy, { userId: 'user-1' })).toBe(true);

            const strategyMixed: CompositeStrategy = {
                type: StrategyType.COMPOSITE,
                operator: StrategyOperator.AND,
                strategies: [strategyTrue, strategyFalse],
            };
            expect(evaluator.evaluate(strategyMixed, { userId: 'user-1' })).toBe(false);
        });

        it('should evaluate OR correctly', () => {
            const strategy: CompositeStrategy = {
                type: StrategyType.COMPOSITE,
                operator: StrategyOperator.OR,
                strategies: [strategyTrue, strategyFalse],
            };
            expect(evaluator.evaluate(strategy, { userId: 'user-1' })).toBe(true);

            const strategyAllFalse: CompositeStrategy = {
                type: StrategyType.COMPOSITE,
                operator: StrategyOperator.OR,
                strategies: [strategyFalse, strategyFalse],
            };
            expect(evaluator.evaluate(strategyAllFalse, { userId: 'user-1' })).toBe(false);
        });

        it('should evaluate nested composite strategies', () => {
            const inner: CompositeStrategy = {
                type: StrategyType.COMPOSITE,
                operator: StrategyOperator.OR,
                strategies: [strategyTrue, strategyFalse],
            };
            const outer: CompositeStrategy = {
                type: StrategyType.COMPOSITE,
                operator: StrategyOperator.AND,
                strategies: [inner, strategyTrue],
            };
            expect(evaluator.evaluate(outer, { userId: 'user-1' })).toBe(true);
        });
    });

    describe('Fail-safe Logic', () => {
        it('should return false on corrupted strategy objects', () => {
            // @ts-expect-error - testing corrupted object
            expect(evaluator.evaluate({ type: 'UNKNOWN' }, {})).toBe(false);
            // @ts-expect-error - testing null
            expect(evaluator.evaluate(null, {})).toBe(false);
        });
    });

    describe('Property-based testing (Requirement 2.2, 2.5, 2.3, 16.7)', () => {
        it('Percentage Strategy: consistency', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1 }),
                    fc.integer({ min: 0, max: 100 }),
                    (userId, rolloutPercentage) => {
                        const s = { type: StrategyType.PERCENTAGE, rolloutPercentage } as PercentageStrategy;
                        const r1 = evaluator.evaluate(s, { userId });
                        const r2 = evaluator.evaluate(s, { userId });
                        return r1 === r2;
                    }
                )
            );
        });

        it('User Whitelist: should enable for any user in the list', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
                    (userIds) => {
                        const s: UserListStrategy = { type: StrategyType.USER_LIST, userIds, isBlacklist: false };
                        const userId = userIds[Math.floor(Math.random() * userIds.length)];
                        return evaluator.evaluate(s, { userId }) === true;
                    }
                )
            );
        });

        it('Fail-safe: should never crash', () => {
            fc.assert(
                fc.property(
                    fc.anything(),
                    (val) => {
                        try {
                            evaluator.evaluate(val as any, {});
                            return true;
                        } catch {
                            return false;
                        }
                    }
                )
            );
        });
    });
});
