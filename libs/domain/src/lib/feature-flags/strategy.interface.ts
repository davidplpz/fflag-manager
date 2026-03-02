export enum StrategyType {
    PERCENTAGE = 'PERCENTAGE',
    USER_LIST = 'USER_LIST',
    TIME_WINDOW = 'TIME_WINDOW',
    COMPOSITE = 'COMPOSITE',
}

export interface EvaluationContext {
    userId?: string;
    timestamp?: Date;
}

export interface BaseStrategy {
    type: StrategyType;
}

export interface PercentageStrategy extends BaseStrategy {
    type: StrategyType.PERCENTAGE;
    rolloutPercentage: number; // 0-100
}

export interface UserListStrategy extends BaseStrategy {
    type: StrategyType.USER_LIST;
    userIds: string[];
    isBlacklist?: boolean;
}

export interface TimeWindowStrategy extends BaseStrategy {
    type: StrategyType.TIME_WINDOW;
    startTime: Date;
    endTime: Date;
}

export enum StrategyOperator {
    AND = 'AND',
    OR = 'OR',
}

export interface CompositeStrategy extends BaseStrategy {
    type: StrategyType.COMPOSITE;
    operator: StrategyOperator;
    strategies: Strategy[];
}

export type Strategy = PercentageStrategy | UserListStrategy | TimeWindowStrategy | CompositeStrategy;
