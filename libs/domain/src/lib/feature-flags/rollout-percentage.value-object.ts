export class RolloutPercentage {
    private readonly value: number;

    constructor(value: number) {
        this.validate(value);
        this.value = value;
    }

    private validate(value: number): void {
        if (!Number.isInteger(value)) {
            throw new Error('Percentage must be an integer');
        }
        if (value < 0 || value > 100) {
            throw new Error('Percentage must be between 0 and 100');
        }
    }

    isFullRollout(): boolean {
        return this.value === 100;
    }

    isNoRollout(): boolean {
        return this.value === 0;
    }

    toNumber(): number {
        return this.value;
    }
}
