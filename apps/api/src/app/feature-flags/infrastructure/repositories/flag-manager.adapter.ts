import { Inject, Injectable } from '@nestjs/common';
import { FlagRepository } from '../../domain/repositories/flag.repository.js';
import type { FeatureFlag, IFlagManager } from '@org/domain';

@Injectable()
export class FlagManagerAdapter implements FlagRepository {
    constructor(
        @Inject('IFlagManager')
        private readonly flagManager: IFlagManager
    ) { }

    async save(flag: FeatureFlag): Promise<void> {
        // FlagManagerService doesn't have a generic save, we use create
        // because it handles both Redis and DB. For updates, we'd need
        // more specific logic if the lib supports it.
        await this.flagManager.createFlag(flag);
    }

    async updateState(key: string, enabled: boolean): Promise<void> {
        if (enabled) {
            await this.flagManager.activateFlag(key);
        } else {
            await this.flagManager.deactivateFlag(key);
        }
    }

    async findByKey(key: string): Promise<FeatureFlag | null> {
        return this.flagManager.getFlag(key);
    }

    async findAll(page: number, limit: number): Promise<FeatureFlag[]> {
        const result = await this.flagManager.getAllFlags({ page, limit });
        return result.data;
    }

    async delete(key: string): Promise<void> {
        await this.flagManager.deleteFlag(key);
    }

    async exists(key: string): Promise<boolean> {
        const flag = await this.flagManager.getFlag(key);
        return !!flag;
    }
}
