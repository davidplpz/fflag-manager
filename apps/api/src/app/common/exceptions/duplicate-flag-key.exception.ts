import { ConflictException } from '@nestjs/common';

export class DuplicateFlagKeyException extends ConflictException {
    constructor(key: string) {
        super(`Feature flag with key '${key}' already exists`);
        this.name = 'DuplicateFlagKeyException';
    }
}
