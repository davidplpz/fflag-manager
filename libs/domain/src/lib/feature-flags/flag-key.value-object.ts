export class FlagKey {
    private readonly value: string;

    private static readonly KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    private static readonly MAX_LENGTH = 255;

    constructor(value: string) {
        this.validate(value);
        this.value = value;
    }

    private validate(value: string): void {
        if (!value || value.length === 0) {
            throw new Error('FlagKey cannot be empty');
        }

        if (value.length > FlagKey.MAX_LENGTH) {
            throw new Error('FlagKey is too long (max 255 characters)');
        }

        if (!FlagKey.KEBAB_CASE_REGEX.test(value)) {
            throw new Error(`Invalid FlagKey format: ${value}. Must be kebab-case (lowercase, numbers and hyphens only).`);
        }
    }

    equals(other: FlagKey): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
