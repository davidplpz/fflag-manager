/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './app/common/filters/global-exception.filter';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Requirement 7.9: Validate request payloads using DTOs with class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Requirement 17.1: Register GlobalExceptionFilter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Requirement 17.2: OpenAPI/Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Feature Flags Manager API')
    .setDescription(
      'API REST para gestión de feature flags con soporte de métricas y analytics. ' +
      'Construida sobre fflags-lib siguiendo Arquitectura Hexagonal y DDD.'
    )
    .setVersion('1.0')
    .addTag('feature-flags', 'CRUD y evaluación de feature flags')
    .addTag('metrics', 'Métricas de uso por flag')
    .addTag('analytics', 'Analytics y tendencias de uso')
    .addTag('health', 'Estado del sistema')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Introduce tu token JWT. Roles disponibles: admin, viewer.',
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(
    `📖 Swagger docs available at: http://localhost:${port}/${globalPrefix}/docs`
  );
}

bootstrap();

