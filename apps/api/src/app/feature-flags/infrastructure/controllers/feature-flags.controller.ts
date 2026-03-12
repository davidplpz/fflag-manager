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
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';
import type { IFeatureFlagsService } from '../../application/ports/feature-flags-service.interface.js';
import { FEATURE_FLAGS_SERVICE_TOKEN } from '../../application/ports/feature-flags-service.token.js';
import { CreateFlagDto } from '../dto/create-flag.dto.js';
import { UpdateFlagDto } from '../dto/update-flag.dto.js';
import { PaginationDto } from '../dto/pagination.dto.js';
import { EvaluationContextDto } from '../dto/evaluation-context.dto.js';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard.js';
import { Roles } from '../../../auth/infrastructure/guards/roles.decorator.js';

@ApiTags('feature-flags')
@ApiBearerAuth('JWT-auth')
@Controller('feature-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeatureFlagsController {
    constructor(
        @Inject(FEATURE_FLAGS_SERVICE_TOKEN)
        private readonly featureFlagsService: IFeatureFlagsService
    ) { }

    @Post()
    @Roles('admin')
    @ApiOperation({
        summary: 'Crear un feature flag',
        description: 'Crea un nuevo feature flag con la key, nombre, descripción y estrategia de activación especificados. Solo accesible por administradores.',
    })
    @ApiResponse({ status: 201, description: 'Feature flag creado correctamente.' })
    @ApiResponse({ status: 400, description: 'Payload inválido (validación de DTO fallida).' })
    @ApiResponse({ status: 401, description: 'No autenticado.' })
    @ApiResponse({ status: 403, description: 'No autorizado (rol insuficiente).' })
    @ApiResponse({ status: 409, description: 'Ya existe un flag con esa key.' })
    create(@Body() createFlagDto: CreateFlagDto) {
        return this.featureFlagsService.create(createFlagDto);
    }

    @Get()
    @ApiOperation({
        summary: 'Listar todos los feature flags',
        description: 'Devuelve una lista paginada de todos los feature flags. Accesible por admin y viewer.',
    })
    @ApiResponse({ status: 200, description: 'Lista de feature flags.' })
    @ApiResponse({ status: 401, description: 'No autenticado.' })
    findAll(@Query() paginationDto: PaginationDto) {
        return this.featureFlagsService.findAll(paginationDto.page, paginationDto.limit);
    }

    @Get(':key')
    @ApiOperation({
        summary: 'Obtener un feature flag por key',
        description: 'Devuelve los detalles completos de un feature flag específico incluyendo su estrategia de activación.',
    })
    @ApiParam({ name: 'key', description: 'Identificador único del flag en formato kebab-case', example: 'my-new-feature' })
    @ApiResponse({ status: 200, description: 'Feature flag encontrado.' })
    @ApiResponse({ status: 404, description: 'Feature flag no encontrado.' })
    @ApiResponse({ status: 401, description: 'No autenticado.' })
    findOne(@Param('key') key: string) {
        return this.featureFlagsService.findOne(key);
    }

    @Put(':key')
    @Roles('admin')
    @ApiOperation({
        summary: 'Actualizar un feature flag',
        description: 'Actualiza el estado, nombre, descripción o estrategia de activación de un feature flag existente.',
    })
    @ApiParam({ name: 'key', description: 'Identificador único del flag en formato kebab-case', example: 'my-new-feature' })
    @ApiResponse({ status: 200, description: 'Feature flag actualizado correctamente.' })
    @ApiResponse({ status: 400, description: 'Payload inválido.' })
    @ApiResponse({ status: 404, description: 'Feature flag no encontrado.' })
    @ApiResponse({ status: 401, description: 'No autenticado.' })
    @ApiResponse({ status: 403, description: 'No autorizado (rol insuficiente).' })
    update(@Param('key') key: string, @Body() updateFlagDto: UpdateFlagDto) {
        return this.featureFlagsService.update(key, updateFlagDto);
    }

    @Delete(':key')
    @Roles('admin')
    @HttpCode(204)
    @ApiOperation({
        summary: 'Eliminar un feature flag',
        description: 'Elimina permanentemente un feature flag y todos sus datos de métricas asociados.',
    })
    @ApiParam({ name: 'key', description: 'Identificador único del flag en formato kebab-case', example: 'my-new-feature' })
    @ApiResponse({ status: 204, description: 'Feature flag eliminado correctamente.' })
    @ApiResponse({ status: 404, description: 'Feature flag no encontrado.' })
    @ApiResponse({ status: 401, description: 'No autenticado.' })
    @ApiResponse({ status: 403, description: 'No autorizado (rol insuficiente).' })
    remove(@Param('key') key: string) {
        return this.featureFlagsService.remove(key);
    }

    @Post(':key/evaluate')
    @HttpCode(200)
    @ApiOperation({
        summary: 'Evaluar un feature flag',
        description: 'Evalúa si un feature flag está activo para el contexto de usuario proporcionado. Genera un Metric_Event asíncronamente. Devuelve { enabled: false } en caso de error (fail-safe).',
    })
    @ApiParam({ name: 'key', description: 'Identificador único del flag en formato kebab-case', example: 'my-new-feature' })
    @ApiResponse({ status: 200, description: 'Resultado de la evaluación: { enabled: boolean }.' })
    @ApiResponse({ status: 401, description: 'No autenticado.' })
    evaluate(@Param('key') key: string, @Body() context: EvaluationContextDto) {
        return this.featureFlagsService.evaluate(key, context);
    }

    @Get(':key/metrics')
    @ApiTags('metrics')
    @ApiOperation({
        summary: 'Obtener métricas de un feature flag',
        description: 'Devuelve métricas de uso del flag en la ventana de tiempo especificada: total de evaluaciones, ratio enabled/disabled, usuarios únicos.',
    })
    @ApiParam({ name: 'key', description: 'Identificador único del flag en formato kebab-case', example: 'my-new-feature' })
    @ApiQuery({ name: 'window', enum: ['1h', '24h', '7d', '30d'], required: false, description: 'Ventana de tiempo para las métricas', example: '24h' })
    @ApiResponse({ status: 200, description: 'Métricas del feature flag.' })
    @ApiResponse({ status: 404, description: 'Feature flag no encontrado.' })
    @ApiResponse({ status: 401, description: 'No autenticado.' })
    getMetrics(
        @Param('key') key: string,
        @Query('window') window: '1h' | '24h' | '7d' | '30d' = '24h'
    ) {
        return this.featureFlagsService.getMetrics(key, window);
    }

    @Get(':key/analytics')
    @ApiTags('analytics')
    @ApiOperation({
        summary: 'Obtener analytics de un feature flag',
        description: 'Devuelve datos de analytics incluyendo time-series, tendencia (increasing/decreasing/stable) y estadísticas agregadas. Resultados cacheados 60 segundos en Redis.',
    })
    @ApiParam({ name: 'key', description: 'Identificador único del flag en formato kebab-case', example: 'my-new-feature' })
    @ApiQuery({ name: 'window', enum: ['1h', '24h', '7d', '30d'], required: false, description: 'Ventana de tiempo para el análisis', example: '24h' })
    @ApiResponse({ status: 200, description: 'Analytics del feature flag.' })
    @ApiResponse({ status: 404, description: 'Feature flag no encontrado.' })
    @ApiResponse({ status: 401, description: 'No autenticado.' })
    getAnalytics(
        @Param('key') key: string,
        @Query('window') window: '1h' | '24h' | '7d' | '30d' = '24h'
    ) {
        return this.featureFlagsService.getAnalytics(key, window);
    }
}
