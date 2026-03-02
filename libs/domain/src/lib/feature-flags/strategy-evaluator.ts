import { Strategy, StrategyType, EvaluationContext, CompositeStrategy } from './strategy.interface.js';
import * as crypto from 'crypto';

export class StrategyEvaluator {
    evaluate(strategy: Strategy, context: EvaluationContext): boolean {
        try {
            switch (strategy.type) {
                case StrategyType.PERCENTAGE:
                    return this.evaluatePercentage(strategy.rolloutPercentage, context.userId);
                case StrategyType.USER_LIST:
                    return this.evaluateUserList(strategy.userIds, context.userId, strategy.isBlacklist);
                case StrategyType.TIME_WINDOW:
                    return this.evaluateTimeWindow(strategy.startTime, strategy.endTime, context.timestamp);
                case StrategyType.COMPOSITE:
                    return this.evaluateComposite(strategy, context);
                default:
                    return false;
            }
        } catch (error) {
            return false;
        }
    }

    private evaluateComposite(strategy: CompositeStrategy, context: EvaluationContext): boolean {
        const { operator, strategies } = strategy;

        if (!strategies || !Array.isArray(strategies) || strategies.length === 0) {
            return false;
        }

        if (operator === 'AND') {
            return strategies.every(s => this.evaluate(s, context));
        }

        if (operator === 'OR') {
            return strategies.some(s => this.evaluate(s, context));
        }

        return false;
    }

    private evaluatePercentage(rolloutPercentage: number, userId?: string): boolean {
        if (!userId) {
            return false;
        }

        if (rolloutPercentage >= 100) return true;
        if (rolloutPercentage <= 0) return false;

        const hash = crypto.createHash('sha256').update(userId).digest('hex');
        // Take the first 8 characters (32 bits) and convert to integer
        const hashInt = parseInt(hash.substring(0, 8), 16);
        const normalizedValue = hashInt % 100;

        return normalizedValue < rolloutPercentage;
    }

    private evaluateUserList(userIds: string[], userId?: string, isBlacklist = false): boolean {
        if (!userId) {
            return false;
        }

        const found = userIds.includes(userId);
        return isBlacklist ? !found : found;
    }

    private evaluateTimeWindow(startTime: Date, endTime: Date, timestamp?: Date): boolean {
        const timeToCheck = (timestamp || new Date()).getTime();
        return timeToCheck >= startTime.getTime() && timeToCheck < endTime.getTime();
    }
}
