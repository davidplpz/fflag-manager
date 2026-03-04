import type { FeatureFlag } from '@org/domain';

export interface IFeatureFlagsService {
    create(dto: any): Promise<FeatureFlag>;
    findOne(key: string): Promise<FeatureFlag>;
    findAll(page?: number, limit?: number): Promise<FeatureFlag[]>;
    update(key: string, dto: any): Promise<FeatureFlag>;
    remove(key: string): Promise<void>;
}
