import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { FLAG_REPOSITORY_TOKEN } from '../../domain/repositories/flag.repository.js';
import type { FlagRepository } from '../../domain/repositories/flag.repository.js';
import type { FeatureFlag } from '@org/domain';
import { IFeatureFlagsService } from '../ports/feature-flags-service.interface.js';
import { UpdateFlagDto } from '../../infrastructure/dto/update-flag.dto.js';

@Injectable()
export class FeatureFlagsService implements IFeatureFlagsService {

    constructor(
        @Inject(FLAG_REPOSITORY_TOKEN)
        private readonly flagRepository: FlagRepository
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
}
