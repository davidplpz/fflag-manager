import { NotFoundException } from '@nestjs/common';

export class FlagNotFoundException extends NotFoundException {
    constructor(key: string) {
        super(`Feature flag with key '${key}' not found`);
        this.name = 'FlagNotFoundException';
    }
}
