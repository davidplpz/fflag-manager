import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Query,
    UseGuards,
    Inject,
    Put,
    HttpCode,
} from '@nestjs/common';
import { IFeatureFlagsService } from '../../application/ports/feature-flags-service.interface.js';

import { FEATURE_FLAGS_SERVICE_TOKEN } from '../../application/ports/feature-flags-service.token.js';
import { CreateFlagDto } from '../dto/create-flag.dto.js';
import { UpdateFlagDto } from '../dto/update-flag.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard.js';
import { Roles } from '../../../auth/infrastructure/guards/roles.decorator.js';

@Controller('feature-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeatureFlagsController {
    constructor(
        @Inject(FEATURE_FLAGS_SERVICE_TOKEN)
        private readonly featureFlagsService: IFeatureFlagsService
    ) { }


    @Post()
    @Roles('admin')
    create(@Body() createFlagDto: CreateFlagDto) {
        return this.featureFlagsService.create(createFlagDto);
    }

    @Get()
    findAll(@Query() paginationDto: PaginationDto) {
        return this.featureFlagsService.findAll(paginationDto.page, paginationDto.limit);
    }

    @Get(':key')
    findOne(@Param('key') key: string) {
        return this.featureFlagsService.findOne(key);
    }

    @Put(':key')
    @Roles('admin')
    update(@Param('key') key: string, @Body() updateFlagDto: UpdateFlagDto) {
        return this.featureFlagsService.update(key, updateFlagDto);
    }

    @Delete(':key')
    @Roles('admin')
    @HttpCode(204)
    remove(@Param('key') key: string) {
        return this.featureFlagsService.remove(key);
    }
}
