export class AnalyticsAggregate {
    public readonly id?: number;
    public readonly flagKey: string;
    public readonly timeWindow: '1h' | '24h' | '7d' | '30d';
    public readonly windowStart: Date;
    public readonly windowEnd: Date;
    public readonly totalEvaluations: number;
    public readonly enabledCount: number;
    public readonly disabledCount: number;
    public readonly uniqueUsers: number;

    constructor(props: {
        id?: number;
        flagKey: string;
        timeWindow: '1h' | '24h' | '7d' | '30d';
        windowStart: Date;
        windowEnd: Date;
        totalEvaluations: number;
        enabledCount: number;
        disabledCount: number;
        uniqueUsers: number;
    }) {
        this.id = props.id;
        this.flagKey = props.flagKey;
        this.timeWindow = props.timeWindow;
        this.windowStart = props.windowStart;
        this.windowEnd = props.windowEnd;
        this.totalEvaluations = props.totalEvaluations;
        this.enabledCount = props.enabledCount;
        this.disabledCount = props.disabledCount;
        this.uniqueUsers = props.uniqueUsers;
    }

    get enabledRatio(): number {
        return this.totalEvaluations > 0 ? this.enabledCount / this.totalEvaluations : 0;
    }

    get successRate(): number {
        // In this context, successRate might be enabledRatio or something else.
        // Let's stick to enabledRatio for now as per requirements.
        return this.enabledRatio;
    }
}
