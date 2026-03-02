import { FlagKey } from './flag-key.value-object.js';

export class MetricEvent {
    public readonly id: string;
    public readonly flagKey: string;
    public readonly result: boolean;
    public readonly userId?: string;
    public readonly context?: Record<string, any>;
    public readonly timestamp: Date;

    constructor(props: {
        id?: string;
        flagKey: string | FlagKey;
        result: boolean;
        userId?: string;
        context?: Record<string, any>;
        timestamp?: Date;
    }) {
        this.id = props.id || crypto.randomUUID();
        this.flagKey = props.flagKey instanceof FlagKey ? props.flagKey.toString() : new FlagKey(props.flagKey).toString();
        this.result = props.result;
        this.userId = props.userId;
        this.context = props.context;
        this.timestamp = props.timestamp || new Date();
    }
}
