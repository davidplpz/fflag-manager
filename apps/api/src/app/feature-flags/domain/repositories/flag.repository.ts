import { FeatureFlag } from '@org/domain';

export const FLAG_REPOSITORY_TOKEN = Symbol('FLAG_REPOSITORY_TOKEN');

export interface FlagRepository {
    save(flag: FeatureFlag): Promise<void>;
    updateState(key: string, enabled: boolean): Promise<void>;
    findByKey(key: string): Promise<FeatureFlag | null>;
    findAll(page: number, limit: number): Promise<FeatureFlag[]>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
}
