import type { FeatureFlag } from '@org/domain';
import type { EvaluationContextDto } from '../../infrastructure/dto/evaluation-context.dto.js';

export interface IFeatureFlagsService {
    create(dto: any): Promise<FeatureFlag>;
    findOne(key: string): Promise<FeatureFlag>;
    findAll(page?: number, limit?: number): Promise<FeatureFlag[]>;
    update(key: string, dto: any): Promise<FeatureFlag>;
    remove(key: string): Promise<void>;
    evaluate(key: string, context: EvaluationContextDto): Promise<{ enabled: boolean }>;
}
