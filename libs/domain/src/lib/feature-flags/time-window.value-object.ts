export class TimeWindow {
    constructor(public readonly start: Date, public readonly end: Date) {
        this.validate();
    }

    private validate(): void {
        if (this.start >= this.end) {
            throw new Error('Start date must be before end date');
        }
    }

    contains(timestamp: Date | number): boolean {
        const time = timestamp instanceof Date ? timestamp.getTime() : timestamp;
        return time >= this.start.getTime() && time < this.end.getTime();
    }

    getDurationInHours(): number {
        const diffMs = this.end.getTime() - this.start.getTime();
        return diffMs / (1000 * 60 * 60);
    }

    static fromPreset(preset: '1h' | '24h' | '7d' | '30d'): TimeWindow {
        const now = new Date();
        let start: Date;

        switch (preset) {
            case '1h':
                start = new Date(now.getTime() - 1 * 60 * 60 * 1000);
                break;
            case '24h':
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                throw new Error(`Unknown preset: ${preset}`);
        }

        return new TimeWindow(start, now);
    }
}
