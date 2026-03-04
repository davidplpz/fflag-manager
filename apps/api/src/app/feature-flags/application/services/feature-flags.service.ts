import { Inject, Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { FLAG_REPOSITORY_TOKEN } from '../../domain/repositories/flag.repository.js';
import type { FlagRepository } from '../../domain/repositories/flag.repository.js';
import type { FeatureFlag } from '@org/domain';
import { StrategyEvaluator, MetricEvent } from '@org/domain';
import type { Strategy } from '@org/domain';
import { MetricsCollectorService } from '@org/infrastructure';
import { IFeatureFlagsService } from '../ports/feature-flags-service.interface.js';
import { UpdateFlagDto } from '../../infrastructure/dto/update-flag.dto.js';
import type { EvaluationContextDto } from '../../infrastructure/dto/evaluation-context.dto.js';

export const STRATEGY_EVALUATOR_TOKEN = 'STRATEGY_EVALUATOR';
export const METRICS_COLLECTOR_TOKEN = 'METRICS_COLLECTOR';

/** Extended flag shape that includes the optional strategy field stored by the persistence layer */
interface FeatureFlagWithStrategy extends FeatureFlag {
    strategy?: Strategy;
}

@Injectable()
export class FeatureFlagsService implements IFeatureFlagsService {
    private readonly logger = new Logger(FeatureFlagsService.name);

    constructor(
        @Inject(FLAG_REPOSITORY_TOKEN)
        private readonly flagRepository: FlagRepository,
        @Inject(STRATEGY_EVALUATOR_TOKEN)
        private readonly strategyEvaluator: StrategyEvaluator,
        @Inject(METRICS_COLLECTOR_TOKEN)
        private readonly metricsCollector: MetricsCollectorService,
    ) { }

    async create(dto: any): Promise<FeatureFlag> {
        const exists = await this.flagRepository.exists(dto.key);
        if (exists) {
            throw new ConflictException(`Feature flag with key "${dto.key}" already exists`);
        }

        const flag: FeatureFlag = {
            ...dto,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await this.flagRepository.save(flag);
        return flag;
    }

    async findOne(key: string): Promise<FeatureFlag> {
        const flag = await this.flagRepository.findByKey(key);
        if (!flag) {
            throw new NotFoundException(`Feature flag with key "${key}" not found`);
        }
        return flag;
    }

    async findAll(page = 1, limit = 10): Promise<FeatureFlag[]> {
        return this.flagRepository.findAll(page, limit);
    }

    async update(key: string, dto: UpdateFlagDto): Promise<FeatureFlag> {
        const flag = await this.findOne(key);
        if (dto.enabled !== undefined && dto.enabled !== flag.enabled) {
            await this.flagRepository.updateState(key, dto.enabled);
        }
        // Metadata update simulation since lib doesn't support full metadata update yet
        return this.findOne(key);
    }

    async remove(key: string): Promise<void> {
        await this.findOne(key);
        await this.flagRepository.delete(key);
    }

    async evaluate(key: string, context: EvaluationContextDto): Promise<{ enabled: boolean }> {
        try {
            // Retrieve the flag (FlagManagerAdapter handles Redis cache + DB fallback)
            const flag = (await this.flagRepository.findByKey(key)) as FeatureFlagWithStrategy | null;

            // Fail-safe: non-existent flags default to false (req 3.3)
            if (!flag) {
                this.logger.debug(`Flag "${key}" not found – returning false (fail-safe)`);
                await this.recordMetric(key, false, context);
                return { enabled: false };
            }

            // Globally disabled flags short-circuit
            if (!flag.enabled) {
                await this.recordMetric(key, false, context);
                return { enabled: false };
            }

            // Evaluate strategy if present
            let result = true;
            if (flag.strategy) {
                const evalContext = {
                    userId: context.userId,
                    timestamp: context.timestamp ? new Date(context.timestamp) : new Date(),
                };
                result = this.strategyEvaluator.evaluate(flag.strategy, evalContext);
            }

            await this.recordMetric(key, result, context);
            return { enabled: result };
        } catch (error) {
            // Fail-safe: any exception returns false (req 3.2, 16.7)
            this.logger.error(`Evaluation failed for flag "${key}": ${(error as Error).message}`, (error as Error).stack);
            return { enabled: false };
        }
    }

    private async recordMetric(key: string, result: boolean, context: EvaluationContextDto): Promise<void> {
        try {
            const event = new MetricEvent({
                flagKey: key,
                result,
                userId: context.userId,
                context: context.attributes,
                timestamp: context.timestamp ? new Date(context.timestamp) : new Date(),
            });
            await this.metricsCollector.recordEvent(event);
        } catch (error) {
            // Never let metric recording crash the evaluation (req 5.6)
            this.logger.warn(`Failed to record metric for flag "${key}": ${(error as Error).message}`);
        }
    }
}
