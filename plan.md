# Requirements Document - Feature Flags Manager

## Introduction

Este documento define los requisitos para un sistema completo de gestión de feature flags diseñado para un monorepo NX. El sistema se construirá sobre la base de **fflags-lib** (paquete npm TypeScript existente que implementa arquitectura hexagonal, DDD y gestión básica de flags con soporte para Redis, PostgreSQL y MySQL). El sistema EXTENDERÁ fflags-lib añadiendo: sistema de métricas avanzadas, analytics engine con reportes y estadísticas, estrategias de activación avanzadas, API REST wrapper con NestJS, y frontend web con Next.js. El sistema seguirá principios de arquitectura hexagonal, DDD, y será desarrollado mediante TDD.

## Glossary

- **Feature_Flag_Manager**: Sistema completo que gestiona feature flags, métricas y analytics, construido sobre fflags-lib
- **fflags_lib**: Paquete npm TypeScript existente que implementa gestión básica de feature flags con arquitectura hexagonal y DDD
- **ManagerService**: Servicio principal de fflags-lib que expone métodos CRUD para feature flags (createFlag, getFlag, getAllFlags, activateFlag, deactivateFlag, deleteFlag)
- **Feature_Flag**: Configuración que controla la activación/desactivación de una funcionalidad específica
- **Flag_Key**: Identificador único de un feature flag (formato: kebab-case)
- **Flag_State**: Estado de un feature flag (enabled/disabled)
- **Flag_Strategy**: Estrategia de activación (simple, percentage, user-based, time-based)
- **Flag_Repository**: Repositorio de persistencia para feature flags
- **Metrics_Collector**: Componente que recopila métricas de uso de feature flags (extensión sobre fflags-lib)
- **Analytics_Engine**: Motor que procesa y analiza datos de uso de feature flags (extensión sobre fflags-lib)
- **Redis_Cache**: Sistema de caché distribuido usando Redis
- **PostgreSQL_Store**: Base de datos relacional para persistencia
- **API_Backend**: Backend NestJS que expone endpoints REST como wrapper de fflags-lib
- **Web_Frontend**: Interfaz web Next.js para gestión visual
- **JWT_Auth**: Sistema de autenticación basado en JSON Web Tokens (implementación nueva en TypeScript)
- **JWT_Package**: Paquete TypeScript nuevo en libs/infrastructure/ que implementa autenticación JWT usando @nestjs/jwt
- **User_Context**: Información del usuario que solicita evaluación de un flag
- **Evaluation_Event**: Evento generado cuando se evalúa un feature flag
- **Metric_Event**: Evento que registra el uso de un feature flag
- **Time_Window**: Período de tiempo para análisis de métricas
- **Rollout_Percentage**: Porcentaje de usuarios que tienen acceso a una feature
- **Domain_Layer**: Capa de dominio con entidades y lógica de negocio
- **Application_Layer**: Capa de aplicación con casos de uso
- **Infrastructure_Layer**: Capa de infraestructura con adaptadores externos
- **Docker_Container**: Contenedor Docker para servicios de infraestructura

## Requirements

### Requirement 1: Gestión de Feature Flags

**User Story:** Como desarrollador, quiero crear y gestionar feature flags, para poder controlar dinámicamente la activación de funcionalidades en mis aplicaciones.

#### Acceptance Criteria

1. THE Feature_Flag_Manager SHALL integrate fflags_lib ManagerService as the core flag management engine
2. THE Feature_Flag_Manager SHALL install fflags_lib as npm dependency from https://www.npmjs.com/package/fflags-lib
3. THE Feature_Flag_Manager SHALL use ManagerService.createFlag to create a Feature_Flag with unique Flag_Key, name, description, and initial Flag_State
4. WHEN a Flag_Key already exists, THE ManagerService SHALL return a descriptive error
5. THE Feature_Flag_Manager SHALL use ManagerService.activateFlag and ManagerService.deactivateFlag to update Flag_State
6. THE Feature_Flag_Manager SHALL use ManagerService.deleteFlag to delete a Feature_Flag by its Flag_Key
7. THE Feature_Flag_Manager SHALL use ManagerService.getFlag to retrieve a Feature_Flag by its Flag_Key
8. THE Feature_Flag_Manager SHALL use ManagerService.getAllFlags to list all Feature_Flags with pagination support
9. WHEN creating a Feature_Flag, THE ManagerService SHALL validate that Flag_Key follows kebab-case format
10. THE ManagerService SHALL store Feature_Flag metadata including creation timestamp and last modification timestamp

### Requirement 2: Estrategias de Activación

**User Story:** Como product manager, quiero configurar diferentes estrategias de activación para feature flags, para poder realizar rollouts graduales y pruebas A/B.

#### Acceptance Criteria

1. THE Feature_Flag_Manager SHALL verify if fflags_lib supports simple Flag_Strategy (enabled/disabled for all users)
2. WHERE fflags_lib does not support percentage-based Flag_Strategy, THE Feature_Flag_Manager SHALL implement percentage-based Flag_Strategy with configurable Rollout_Percentage as extension
3. WHERE fflags_lib does not support user-based Flag_Strategy, THE Feature_Flag_Manager SHALL implement user-based Flag_Strategy with explicit user whitelist as extension
4. WHERE fflags_lib does not support time-based Flag_Strategy, THE Feature_Flag_Manager SHALL implement time-based Flag_Strategy with start and end timestamps as extension
5. WHEN evaluating a percentage-based Flag_Strategy, THE Feature_Flag_Manager SHALL use consistent hashing to ensure same user gets same result
6. WHEN evaluating a user-based Flag_Strategy, THE Feature_Flag_Manager SHALL check if User_Context is in the whitelist
7. WHEN evaluating a time-based Flag_Strategy, THE Feature_Flag_Manager SHALL check if current time is within the configured time window
8. WHERE advanced strategies are implemented, THE Feature_Flag_Manager SHALL allow combining multiple Flag_Strategy types with AND/OR logic

### Requirement 3: Evaluación de Feature Flags

**User Story:** Como desarrollador, quiero evaluar feature flags en tiempo de ejecución, para poder activar o desactivar funcionalidades basándome en la configuración actual.

#### Acceptance Criteria

1. WHEN a Flag_Key is provided, THE Feature_Flag_Manager SHALL use fflags_lib to evaluate the Feature_Flag and return a boolean result
2. WHEN evaluating a Feature_Flag, THE Feature_Flag_Manager SHALL apply the configured Flag_Strategy (using fflags_lib or extensions)
3. WHEN a Flag_Key does not exist, THE Feature_Flag_Manager SHALL return false as default value
4. THE Feature_Flag_Manager SHALL accept optional User_Context for user-based evaluation
5. WHEN evaluating a Feature_Flag, THE Feature_Flag_Manager SHALL generate an Evaluation_Event for metrics tracking
6. THE Feature_Flag_Manager SHALL complete evaluation within 50 milliseconds for cached flags
7. THE fflags_lib SHALL use Redis_Cache to minimize database queries during evaluation
8. WHEN Redis_Cache is unavailable, THE fflags_lib SHALL fallback to PostgreSQL_Store

### Requirement 4: Persistencia y Caché

**User Story:** Como arquitecto de sistemas, quiero que los feature flags se persistan en PostgreSQL y se cacheen en Redis, para garantizar durabilidad y alto rendimiento.

#### Acceptance Criteria

1. THE fflags_lib SHALL persist Feature_Flags in PostgreSQL_Store using its built-in Flag_Repository
2. THE fflags_lib SHALL cache Feature_Flags in Redis_Cache with configurable TTL
3. WHEN a Feature_Flag is updated, THE fflags_lib SHALL invalidate the Redis_Cache entry
4. WHEN a Feature_Flag is deleted, THE fflags_lib SHALL remove it from both PostgreSQL_Store and Redis_Cache
5. THE fflags_lib SHALL implement the repository pattern from Domain_Layer
6. THE fflags_lib SHALL use transactions for atomic operations in PostgreSQL_Store
7. WHEN Redis_Cache is unavailable, THE fflags_lib SHALL continue operating with PostgreSQL_Store only
8. THE Feature_Flag_Manager SHALL configure fflags_lib with appropriate database connection parameters

### Requirement 5: Recopilación de Métricas

**User Story:** Como product manager, quiero recopilar métricas sobre el uso de feature flags, para poder analizar el impacto de las funcionalidades activadas.

#### Acceptance Criteria

1. WHEN a Feature_Flag is evaluated, THE Metrics_Collector SHALL generate a Metric_Event
2. THE Metrics_Collector SHALL record Flag_Key, evaluation result, timestamp, and User_Context in each Metric_Event
3. THE Metrics_Collector SHALL persist Metric_Events in PostgreSQL_Store asynchronously
4. THE Metrics_Collector SHALL batch Metric_Events to reduce database writes
5. THE Metrics_Collector SHALL flush batched events every 10 seconds or when batch size reaches 100 events
6. WHEN batch persistence fails, THE Metrics_Collector SHALL retry up to 3 times with exponential backoff
7. THE Metrics_Collector SHALL expose metrics count by Flag_Key and time period
8. THE Metrics_Collector SHALL calculate evaluation success rate per Feature_Flag

### Requirement 6: Analytics y Reportes

**User Story:** Como product manager, quiero visualizar analytics sobre el uso de feature flags, para tomar decisiones informadas sobre el rollout de funcionalidades.

#### Acceptance Criteria

1. THE Analytics_Engine SHALL calculate total evaluations per Feature_Flag within a Time_Window
2. THE Analytics_Engine SHALL calculate unique users per Feature_Flag within a Time_Window
3. THE Analytics_Engine SHALL calculate enabled/disabled ratio per Feature_Flag within a Time_Window
4. THE Analytics_Engine SHALL identify Feature_Flags with zero usage in the last 30 days
5. THE Analytics_Engine SHALL generate time-series data for Feature_Flag usage trends
6. THE Analytics_Engine SHALL support Time_Window values of 1 hour, 24 hours, 7 days, and 30 days
7. THE Analytics_Engine SHALL cache analytics results in Redis_Cache for 60 seconds
8. THE Analytics_Engine SHALL provide export functionality for analytics data in JSON format

### Requirement 7: API REST Backend

**User Story:** Como desarrollador frontend, quiero consumir una API REST para gestionar feature flags, para poder integrar la funcionalidad en la interfaz web.

#### Acceptance Criteria

1. THE API_Backend SHALL expose POST /api/feature-flags endpoint to create Feature_Flags
2. THE API_Backend SHALL expose GET /api/feature-flags/:key endpoint to retrieve a Feature_Flag
3. THE API_Backend SHALL expose PUT /api/feature-flags/:key endpoint to update a Feature_Flag
4. THE API_Backend SHALL expose DELETE /api/feature-flags/:key endpoint to delete a Feature_Flag
5. THE API_Backend SHALL expose GET /api/feature-flags endpoint to list all Feature_Flags with pagination
6. THE API_Backend SHALL expose POST /api/feature-flags/:key/evaluate endpoint to evaluate a Feature_Flag
7. THE API_Backend SHALL expose GET /api/feature-flags/:key/metrics endpoint to retrieve metrics
8. THE API_Backend SHALL expose GET /api/feature-flags/:key/analytics endpoint to retrieve analytics
9. THE API_Backend SHALL validate request payloads using DTOs with class-validator
10. THE API_Backend SHALL return appropriate HTTP status codes (200, 201, 400, 404, 500)
11. THE API_Backend SHALL implement error handling with descriptive error messages
12. THE API_Backend SHALL use NestJS framework following hexagonal architecture

### Requirement 8: Autenticación y Autorización

**User Story:** Como administrador del sistema, quiero que el acceso a la API esté protegido por autenticación JWT, para garantizar que solo usuarios autorizados puedan gestionar feature flags.

#### Acceptance Criteria

1. THE API_Backend SHALL require JWT_Auth token for all endpoints except health check
2. WHEN a request lacks JWT_Auth token, THE API_Backend SHALL return HTTP 401 Unauthorized
3. WHEN a JWT_Auth token is invalid or expired, THE API_Backend SHALL return HTTP 401 Unauthorized
4. THE API_Backend SHALL extract User_Context from JWT_Auth token claims
5. THE API_Backend SHALL use JWT_Package from libs/infrastructure for token validation
6. THE JWT_Package SHALL be implemented using @nestjs/jwt or jsonwebtoken library
7. THE API_Backend SHALL support role-based access control with admin and viewer roles
8. WHEN a user has viewer role, THE API_Backend SHALL allow only GET requests
9. WHEN a user has admin role, THE API_Backend SHALL allow all CRUD operations

### Requirement 9: Frontend Web de Gestión

**User Story:** Como product manager, quiero una interfaz web para gestionar feature flags visualmente, para poder activar/desactivar funcionalidades sin necesidad de código.

#### Acceptance Criteria

1. THE Web_Frontend SHALL display a list of all Feature_Flags with their current Flag_State
2. THE Web_Frontend SHALL provide a form to create new Feature_Flags
3. THE Web_Frontend SHALL provide a toggle control to enable/disable Feature_Flags
4. THE Web_Frontend SHALL display detailed view of a Feature_Flag including metadata and strategy
5. THE Web_Frontend SHALL provide interface to configure Flag_Strategy for each Feature_Flag
6. THE Web_Frontend SHALL display real-time metrics for each Feature_Flag
7. THE Web_Frontend SHALL display analytics charts for Feature_Flag usage trends
8. THE Web_Frontend SHALL implement authentication flow using JWT_Auth
9. THE Web_Frontend SHALL show loading states during API requests
10. THE Web_Frontend SHALL display error messages when API requests fail
11. THE Web_Frontend SHALL use Next.js framework with React components
12. THE Web_Frontend SHALL be responsive and work on desktop and mobile devices

### Requirement 10: Arquitectura Hexagonal y DDD

**User Story:** Como arquitecto de software, quiero que el sistema siga arquitectura hexagonal y DDD, para garantizar mantenibilidad y testabilidad del código.

#### Acceptance Criteria

1. THE Feature_Flag_Manager SHALL organize code in Domain_Layer, Application_Layer, and Infrastructure_Layer
2. THE Domain_Layer SHALL contain Feature_Flag entity, value objects, and domain services
3. THE Domain_Layer SHALL define repository interfaces without implementation details
4. THE Application_Layer SHALL contain use cases for each feature flag operation
5. THE Application_Layer SHALL orchestrate Domain_Layer and Infrastructure_Layer
6. THE Infrastructure_Layer SHALL contain adapters for PostgreSQL_Store, Redis_Cache, and API_Backend
7. THE Infrastructure_Layer SHALL implement repository interfaces defined in Domain_Layer
8. THE Feature_Flag_Manager SHALL use dependency injection to wire layers
9. THE Feature_Flag_Manager SHALL follow screaming architecture with feature-based folder structure
10. THE Domain_Layer SHALL have zero dependencies on Infrastructure_Layer

### Requirement 11: Test-Driven Development

**User Story:** Como desarrollador, quiero que el código esté cubierto por tests automatizados, para garantizar la calidad y prevenir regresiones.

#### Acceptance Criteria

1. THE Feature_Flag_Manager SHALL have unit tests for all Domain_Layer entities and services
2. THE Feature_Flag_Manager SHALL have unit tests for all Application_Layer use cases
3. THE Feature_Flag_Manager SHALL have integration tests for Infrastructure_Layer adapters
4. THE Feature_Flag_Manager SHALL have end-to-end tests for API_Backend endpoints
5. THE Feature_Flag_Manager SHALL achieve minimum 80% code coverage
6. THE Feature_Flag_Manager SHALL use Jest as testing framework
7. THE Feature_Flag_Manager SHALL use test doubles (mocks, stubs) to isolate units under test
8. THE Feature_Flag_Manager SHALL include property-based tests for Flag_Strategy evaluation logic
9. WHEN running tests, THE Feature_Flag_Manager SHALL use in-memory implementations for repositories
10. THE Feature_Flag_Manager SHALL run tests in CI pipeline before merging code

### Requirement 12: Infraestructura con Docker

**User Story:** Como DevOps engineer, quiero que Redis y PostgreSQL se ejecuten en contenedores Docker, para facilitar el desarrollo local y el despliegue.

#### Acceptance Criteria

1. THE Feature_Flag_Manager SHALL provide docker-compose.yml file for local development
2. THE docker-compose.yml SHALL define PostgreSQL_Store service with version 15 or higher
3. THE docker-compose.yml SHALL define Redis_Cache service with version 7 or higher
4. THE docker-compose.yml SHALL configure persistent volumes for PostgreSQL_Store data
5. THE docker-compose.yml SHALL expose PostgreSQL_Store on port 5432
6. THE docker-compose.yml SHALL expose Redis_Cache on port 6379
7. THE docker-compose.yml SHALL include health checks for both services
8. THE Feature_Flag_Manager SHALL provide database migration scripts for PostgreSQL_Store schema
9. THE Feature_Flag_Manager SHALL document environment variables required for database connections
10. THE Feature_Flag_Manager SHALL support running API_Backend in Docker_Container for production

### Requirement 13: Integración con Paquetes Existentes y Nuevos

**User Story:** Como desarrollador, quiero integrar el paquete fflags-lib existente y crear el paquete JWT necesario, para reutilizar código y mantener consistencia en el monorepo.

#### Acceptance Criteria

1. THE Feature_Flag_Manager SHALL install fflags-lib as npm dependency from https://www.npmjs.com/package/fflags-lib
2. THE Feature_Flag_Manager SHALL use fflags_lib ManagerService as the core engine for flag CRUD operations
3. THE Feature_Flag_Manager SHALL configure fflags_lib with Redis and PostgreSQL connection parameters
4. THE Feature_Flag_Manager SHALL create JWT_Package in libs/infrastructure/@org/jwt as new TypeScript implementation
5. THE JWT_Package SHALL implement JWT token generation, validation, and verification using @nestjs/jwt
6. THE JWT_Package SHALL export JwtService, JwtGuard, and JWT configuration utilities
7. THE JWT_Package SHALL support RS256 and HS256 signing algorithms
8. THE API_Backend SHALL import and use JWT_Package for authentication middleware
9. THE Feature_Flag_Manager SHALL extend fflags_lib functionality by adding Metrics_Collector layer
10. THE Feature_Flag_Manager SHALL extend fflags_lib functionality by adding Analytics_Engine layer
11. THE Feature_Flag_Manager SHALL maintain package boundaries following NX module structure
12. THE Feature_Flag_Manager SHALL document fflags-lib integration and JWT_Package usage in README files

### Requirement 14: Parser y Serialización de Configuración

**User Story:** Como desarrollador, quiero parsear y serializar configuraciones de feature flags desde/hacia JSON, para poder importar/exportar configuraciones fácilmente.

#### Acceptance Criteria

1. WHEN a valid JSON configuration is provided, THE Feature_Flag_Manager SHALL parse it into Feature_Flag objects
2. WHEN an invalid JSON configuration is provided, THE Feature_Flag_Manager SHALL return a descriptive error with line and column information
3. THE Feature_Flag_Manager SHALL validate JSON schema for Feature_Flag configuration
4. THE Feature_Flag_Manager SHALL serialize Feature_Flag objects into valid JSON format
5. FOR ALL valid Feature_Flag objects, parsing then serializing then parsing SHALL produce an equivalent object (round-trip property)
6. THE Feature_Flag_Manager SHALL support bulk import of Feature_Flags from JSON file
7. THE Feature_Flag_Manager SHALL support bulk export of Feature_Flags to JSON file
8. THE Feature_Flag_Manager SHALL preserve Flag_Strategy configuration during serialization round-trip

### Requirement 15: Monitoreo y Observabilidad

**User Story:** Como SRE, quiero monitorear el estado del sistema de feature flags, para detectar problemas y garantizar disponibilidad.

#### Acceptance Criteria

1. THE API_Backend SHALL expose GET /health endpoint that returns system health status
2. THE API_Backend SHALL check PostgreSQL_Store connectivity in health endpoint
3. THE API_Backend SHALL check Redis_Cache connectivity in health endpoint
4. THE API_Backend SHALL return HTTP 200 when all dependencies are healthy
5. THE API_Backend SHALL return HTTP 503 when any critical dependency is unhealthy
6. THE Feature_Flag_Manager SHALL log all errors with stack traces
7. THE Feature_Flag_Manager SHALL log performance metrics for flag evaluation operations
8. THE Feature_Flag_Manager SHALL expose Prometheus-compatible metrics endpoint
9. THE Feature_Flag_Manager SHALL track total evaluations counter per Feature_Flag
10. THE Feature_Flag_Manager SHALL track evaluation latency histogram

### Requirement 16: Validación y Manejo de Errores

**User Story:** Como desarrollador, quiero que el sistema valide entradas y maneje errores gracefully, para proporcionar una experiencia robusta.

#### Acceptance Criteria

1. WHEN invalid input is provided to any endpoint, THE API_Backend SHALL return HTTP 400 with validation errors
2. WHEN a database operation fails, THE Feature_Flag_Manager SHALL log the error and return a generic error message
3. WHEN Redis_Cache connection fails, THE Feature_Flag_Manager SHALL log a warning and continue with PostgreSQL_Store
4. THE Feature_Flag_Manager SHALL validate Flag_Key format using regex pattern
5. THE Feature_Flag_Manager SHALL validate Rollout_Percentage is between 0 and 100
6. THE Feature_Flag_Manager SHALL validate time-based strategy timestamps are in ISO 8601 format
7. WHEN a Feature_Flag evaluation throws an exception, THE Feature_Flag_Manager SHALL return false and log the error
8. THE Feature_Flag_Manager SHALL implement circuit breaker pattern for external service calls

### Requirement 17: Documentación y Ejemplos

**User Story:** Como nuevo desarrollador en el equipo, quiero documentación clara y ejemplos de uso, para poder integrar feature flags en mis aplicaciones rápidamente.

#### Acceptance Criteria

1. THE Feature_Flag_Manager SHALL provide README.md with architecture overview
2. THE Feature_Flag_Manager SHALL provide API documentation using OpenAPI/Swagger
3. THE Feature_Flag_Manager SHALL provide code examples for common use cases
4. THE Feature_Flag_Manager SHALL document all environment variables required
5. THE Feature_Flag_Manager SHALL provide setup instructions for local development
6. THE Feature_Flag_Manager SHALL document database schema with ER diagrams
7. THE Feature_Flag_Manager SHALL provide examples of each Flag_Strategy type
8. THE Feature_Flag_Manager SHALL document testing strategy and how to run tests


======

# Design Document - Feature Flags Manager

## Overview

### Purpose

El Feature Flags Manager es un sistema completo de gestión de feature flags diseñado para un monorepo NX. El sistema se construye sobre **fflags-lib** (paquete npm existente) y lo extiende con capacidades avanzadas de métricas, analytics, API REST y frontend web.

### Core Design Principles

1. **Reutilización sobre Reinvención**: Integrar fflags-lib como motor core en lugar de reimplementar gestión básica de flags
2. **Arquitectura Hexagonal**: Separación clara entre dominio, aplicación e infraestructura
3. **Domain-Driven Design**: Modelado del dominio con entidades, value objects y agregados
4. **Screaming Architecture**: Estructura de carpetas que refleja las capacidades del negocio
5. **Test-Driven Development**: Tests como especificación ejecutable del comportamiento

### System Boundaries

**Dentro del alcance:**
- Integración y configuración de fflags-lib para gestión CRUD de flags
- Extensión con sistema de métricas (Metrics_Collector)
- Extensión con motor de analytics (Analytics_Engine)
- API REST wrapper con NestJS
- Frontend web con Next.js
- Nuevo paquete JWT en libs/infrastructure/@org/jwt
- Infraestructura Docker (PostgreSQL, Redis)

**Fuera del alcance:**
- Modificación del código fuente de fflags-lib
- Sistema de notificaciones en tiempo real
- Integración con sistemas de CI/CD externos
- Multi-tenancy

## Architecture

### High-Level Architecture

El sistema sigue una arquitectura hexagonal (Ports & Adapters) con tres capas principales:

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │  Next.js Web    │              │  NestJS REST    │       │
│  │    Frontend     │◄────────────►│      API        │       │
│  └─────────────────┘              └─────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Use Cases / Services                     │   │
│  │  • CreateFlagUseCase                                 │   │
│  │  • EvaluateFlagUseCase                               │   │
│  │  • CollectMetricsUseCase                             │   │
│  │  • GenerateAnalyticsUseCase                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Domain Layer                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  fflags-lib Core (npm package)                       │   │
│  │  • ManagerService (CRUD operations)                  │   │
│  │  • FeatureFlag Entity                                │   │
│  │  • Repository Interfaces                             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Extensions (our code)                               │   │
│  │  • MetricsCollector                                  │   │
│  │  • AnalyticsEngine                                   │   │
│  │  • AdvancedStrategies (percentage, user, time)       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │    Redis     │  │  JWT Package │      │
│  │  Adapter     │  │   Adapter    │  │ (libs/infra) │      │
│  │ (fflags-lib) │  │ (fflags-lib) │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Integration Strategy with fflags-lib

**fflags-lib** es el motor core que proporciona:
- Gestión CRUD de feature flags (ManagerService)
- Persistencia en PostgreSQL
- Caché en Redis
- Arquitectura hexagonal base
- Repository pattern

**Nuestras extensiones** añaden:
- Metrics_Collector: Recopila eventos de evaluación
- Analytics_Engine: Procesa y analiza métricas
- Advanced Strategies: Estrategias de activación avanzadas (si fflags-lib no las soporta)
- API REST: Wrapper NestJS sobre fflags-lib
- Web Frontend: Interfaz visual con Next.js
- JWT Authentication: Nuevo paquete en libs/infrastructure/@org/jwt

### Deployment Architecture

```mermaid
graph TB
    subgraph "Docker Environment"
        API[NestJS API<br/>:3000]
        WEB[Next.js Frontend<br/>:3001]
        PG[(PostgreSQL<br/>:5432)]
        REDIS[(Redis<br/>:6379)]
    end
    
    subgraph "External"
        CLIENT[Browser Client]
        APPS[Client Applications]
    end
    
    CLIENT -->|HTTPS| WEB
    WEB -->|REST API| API
    APPS -->|REST API| API
    API -->|fflags-lib| PG
    API -->|fflags-lib| REDIS
    API -->|Metrics| PG
    
    style API fill:#e1f5ff
    style WEB fill:#e1f5ff
    style PG fill:#ffe1e1
    style REDIS fill:#ffe1e1
```

### Technology Stack

**Backend:**
- NestJS (API framework)
- fflags-lib (npm package - core flag management)
- TypeScript
- @nestjs/jwt (JWT authentication)
- class-validator (DTO validation)
- TypeORM (si fflags-lib lo usa) o adaptador de fflags-lib

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- TailwindCSS (styling)
- React Query (data fetching)

**Infrastructure:**
- PostgreSQL 15+ (persistence)
- Redis 7+ (caching)
- Docker & Docker Compose
- NX (monorepo management)

**Testing:**
- Jest (unit & integration tests)
- fast-check (property-based testing)
- Supertest (API e2e tests)
- React Testing Library (frontend tests)

## Components and Interfaces

### Core Components

#### 1. fflags-lib Integration Layer

**Responsibility:** Configurar y exponer funcionalidad de fflags-lib

```typescript
// Wrapper sobre fflags-lib ManagerService
interface IFlagManager {
  createFlag(dto: CreateFlagDto): Promise<FeatureFlag>;
  getFlag(key: string): Promise<FeatureFlag | null>;
  getAllFlags(pagination: PaginationDto): Promise<PaginatedResult<FeatureFlag>>;
  activateFlag(key: string): Promise<void>;
  deactivateFlag(key: string): Promise<void>;
  deleteFlag(key: string): Promise<void>;
}

// Configuración de fflags-lib
interface FflagsConfig {
  database: {
    type: 'postgres';
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
    ttl: number; // seconds
  };
}
```

#### 2. Metrics Collector (Extension)

**Responsibility:** Recopilar eventos de evaluación de flags

```typescript
interface IMetricsCollector {
  recordEvaluation(event: EvaluationEvent): Promise<void>;
  flush(): Promise<void>;
  getMetricsByFlag(key: string, timeWindow: TimeWindow): Promise<FlagMetrics>;
}

interface EvaluationEvent {
  flagKey: string;
  result: boolean;
  timestamp: Date;
  userId?: string;
  context?: Record<string, any>;
}

interface FlagMetrics {
  flagKey: string;
  totalEvaluations: number;
  enabledCount: number;
  disabledCount: number;
  uniqueUsers: number;
  successRate: number;
}
```

**Implementation Strategy:**
- Batch events in memory (max 100 events or 10 seconds)
- Async persistence to PostgreSQL
- Retry logic with exponential backoff (3 attempts)
- Circuit breaker for database failures

#### 3. Analytics Engine (Extension)

**Responsibility:** Procesar y analizar métricas agregadas

```typescript
interface IAnalyticsEngine {
  calculateUsageStats(key: string, window: TimeWindow): Promise<UsageStats>;
  findUnusedFlags(days: number): Promise<string[]>;
  generateTimeSeries(key: string, window: TimeWindow): Promise<TimeSeriesData>;
  exportAnalytics(key: string, format: 'json'): Promise<string>;
}

interface UsageStats {
  flagKey: string;
  timeWindow: TimeWindow;
  totalEvaluations: number;
  uniqueUsers: number;
  enabledRatio: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface TimeSeriesData {
  flagKey: string;
  dataPoints: Array<{
    timestamp: Date;
    evaluations: number;
    uniqueUsers: number;
  }>;
}

type TimeWindow = '1h' | '24h' | '7d' | '30d';
```

**Caching Strategy:**
- Cache analytics results in Redis for 60 seconds
- Invalidate cache on flag updates
- Use cache key pattern: `analytics:{flagKey}:{window}`

#### 4. Advanced Strategy Evaluator (Extension)

**Responsibility:** Implementar estrategias avanzadas si fflags-lib no las soporta

```typescript
interface IStrategyEvaluator {
  evaluate(flag: FeatureFlag, context: EvaluationContext): boolean;
}

interface EvaluationContext {
  userId?: string;
  attributes?: Record<string, any>;
  timestamp?: Date;
}

// Estrategias
interface PercentageStrategy {
  type: 'percentage';
  rolloutPercentage: number; // 0-100
}

interface UserBasedStrategy {
  type: 'user-based';
  whitelist: string[]; // user IDs
}

interface TimeBasedStrategy {
  type: 'time-based';
  startTime: Date;
  endTime: Date;
}

interface CompositeStrategy {
  type: 'composite';
  operator: 'AND' | 'OR';
  strategies: Strategy[];
}

type Strategy = PercentageStrategy | UserBasedStrategy | TimeBasedStrategy | CompositeStrategy;
```

**Percentage Strategy Implementation:**
```typescript
// Consistent hashing para mismo usuario = mismo resultado
function evaluatePercentage(userId: string, percentage: number): boolean {
  const hash = createHash('sha256').update(userId).digest('hex');
  const hashValue = parseInt(hash.substring(0, 8), 16);
  const bucket = hashValue % 100;
  return bucket < percentage;
}
```

#### 5. JWT Authentication Package

**Location:** `libs/infrastructure/@org/jwt`

**Responsibility:** Autenticación y autorización con JWT

```typescript
// libs/infrastructure/@org/jwt/src/lib/jwt.service.ts
interface IJwtService {
  sign(payload: JwtPayload): string;
  verify(token: string): JwtPayload;
  decode(token: string): JwtPayload | null;
}

interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: 'admin' | 'viewer';
  iat: number;
  exp: number;
}

// libs/infrastructure/@org/jwt/src/lib/jwt.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}

// libs/infrastructure/@org/jwt/src/lib/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
```

**Configuration:**
- Support RS256 (asymmetric) and HS256 (symmetric)
- Configurable token expiration (default: 1 hour)
- Refresh token support (optional)

#### 6. REST API Layer (NestJS)

**Responsibility:** Exponer endpoints HTTP para gestión de flags

```typescript
// API Controllers
@Controller('api/feature-flags')
@UseGuards(JwtAuthGuard)
export class FeatureFlagsController {
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateFlagDto): Promise<FeatureFlagResponse>;

  @Get(':key')
  async getOne(@Param('key') key: string): Promise<FeatureFlagResponse>;

  @Get()
  async getAll(@Query() pagination: PaginationDto): Promise<PaginatedResponse<FeatureFlagResponse>>;

  @Put(':key')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(@Param('key') key: string, @Body() dto: UpdateFlagDto): Promise<FeatureFlagResponse>;

  @Delete(':key')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async delete(@Param('key') key: string): Promise<void>;

  @Post(':key/evaluate')
  async evaluate(@Param('key') key: string, @Body() context: EvaluationContextDto): Promise<EvaluationResponse>;

  @Get(':key/metrics')
  async getMetrics(@Param('key') key: string, @Query('window') window: TimeWindow): Promise<MetricsResponse>;

  @Get(':key/analytics')
  async getAnalytics(@Param('key') key: string, @Query('window') window: TimeWindow): Promise<AnalyticsResponse>;
}

@Controller('health')
export class HealthController {
  @Get()
  async check(): Promise<HealthResponse>;
}
```

**DTOs with Validation:**

```typescript
import { IsString, IsBoolean, IsOptional, Matches, IsEnum, Min, Max } from 'class-validator';

export class CreateFlagDto {
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'Key must be in kebab-case format' })
  key: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  strategy?: StrategyDto;
}

export class StrategyDto {
  @IsEnum(['simple', 'percentage', 'user-based', 'time-based', 'composite'])
  type: string;

  @IsOptional()
  @Min(0)
  @Max(100)
  rolloutPercentage?: number;

  @IsOptional()
  whitelist?: string[];

  @IsOptional()
  startTime?: string; // ISO 8601

  @IsOptional()
  endTime?: string; // ISO 8601
}

export class PaginationDto {
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

#### 7. Web Frontend (Next.js)

**Responsibility:** Interfaz visual para gestión de feature flags

**Key Pages:**

```typescript
// app/dashboard/page.tsx - Lista de flags
interface DashboardPageProps {}

// app/flags/[key]/page.tsx - Detalle de flag
interface FlagDetailPageProps {
  params: { key: string };
}

// app/flags/new/page.tsx - Crear flag
interface CreateFlagPageProps {}

// app/analytics/[key]/page.tsx - Analytics de flag
interface AnalyticsPageProps {
  params: { key: string };
}
```

**Key Components:**

```typescript
// components/FlagList.tsx
interface FlagListProps {
  flags: FeatureFlag[];
  onToggle: (key: string) => void;
  onDelete: (key: string) => void;
}

// components/FlagForm.tsx
interface FlagFormProps {
  initialData?: FeatureFlag;
  onSubmit: (data: CreateFlagDto) => void;
  onCancel: () => void;
}

// components/StrategyConfig.tsx
interface StrategyConfigProps {
  strategy: Strategy;
  onChange: (strategy: Strategy) => void;
}

// components/MetricsChart.tsx
interface MetricsChartProps {
  flagKey: string;
  timeWindow: TimeWindow;
}

// components/AnalyticsDashboard.tsx
interface AnalyticsDashboardProps {
  flagKey: string;
  data: UsageStats;
  timeSeries: TimeSeriesData;
}
```

**State Management:**

```typescript
// hooks/useFlags.ts
export function useFlags() {
  return useQuery({
    queryKey: ['flags'],
    queryFn: () => api.getFlags(),
  });
}

// hooks/useFlagMetrics.ts
export function useFlagMetrics(key: string, window: TimeWindow) {
  return useQuery({
    queryKey: ['metrics', key, window],
    queryFn: () => api.getMetrics(key, window),
    refetchInterval: 30000, // 30 seconds
  });
}

// hooks/useAuth.ts
export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<JwtPayload | null>(null);
  
  // JWT token management
  return { token, user, login, logout };
}
```

### Component Interaction Flow

#### Flag Evaluation Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant UseCase
    participant fflags-lib
    participant Redis
    participant PostgreSQL
    participant Metrics

    Client->>API: POST /api/feature-flags/:key/evaluate
    API->>UseCase: evaluateFlag(key, context)
    UseCase->>fflags-lib: getFlag(key)
    
    fflags-lib->>Redis: get(key)
    alt Cache Hit
        Redis-->>fflags-lib: flag data
    else Cache Miss
        fflags-lib->>PostgreSQL: SELECT * FROM flags WHERE key = ?
        PostgreSQL-->>fflags-lib: flag data
        fflags-lib->>Redis: set(key, data, ttl)
    end
    
    fflags-lib-->>UseCase: FeatureFlag
    UseCase->>UseCase: applyStrategy(flag, context)
    UseCase->>Metrics: recordEvaluation(event)
    Metrics-->>Metrics: batch event
    UseCase-->>API: { enabled: boolean }
    API-->>Client: 200 OK { enabled: true }
    
    Note over Metrics: Async flush every 10s or 100 events
    Metrics->>PostgreSQL: INSERT INTO metrics_events
```

#### Metrics Collection Flow

```mermaid
sequenceDiagram
    participant Evaluator
    participant Collector
    participant Buffer
    participant PostgreSQL
    
    loop Every Evaluation
        Evaluator->>Collector: recordEvaluation(event)
        Collector->>Buffer: add(event)
        
        alt Buffer Full (100 events) OR 10s elapsed
            Collector->>Collector: flush()
            Collector->>PostgreSQL: INSERT INTO metrics_events (batch)
            
            alt Success
                Collector->>Buffer: clear()
            else Failure
                Collector->>Collector: retry with backoff
            end
        end
    end
```

## Data Models

### Database Schema

#### Feature Flags Table (managed by fflags-lib)

```sql
-- fflags-lib manages this schema
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  strategy JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT key_format CHECK (key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
```

#### Metrics Events Table (our extension)

```sql
CREATE TABLE metrics_events (
  id BIGSERIAL PRIMARY KEY,
  flag_key VARCHAR(255) NOT NULL,
  result BOOLEAN NOT NULL,
  user_id VARCHAR(255),
  context JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY (flag_key) REFERENCES feature_flags(key) ON DELETE CASCADE
);

CREATE INDEX idx_metrics_events_flag_key ON metrics_events(flag_key);
CREATE INDEX idx_metrics_events_timestamp ON metrics_events(timestamp);
CREATE INDEX idx_metrics_events_flag_timestamp ON metrics_events(flag_key, timestamp);
```

#### Analytics Aggregates Table (our extension)

```sql
-- Pre-aggregated data for faster analytics queries
CREATE TABLE analytics_aggregates (
  id BIGSERIAL PRIMARY KEY,
  flag_key VARCHAR(255) NOT NULL,
  time_window VARCHAR(10) NOT NULL, -- '1h', '24h', '7d', '30d'
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  total_evaluations INTEGER NOT NULL,
  enabled_count INTEGER NOT NULL,
  disabled_count INTEGER NOT NULL,
  unique_users INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY (flag_key) REFERENCES feature_flags(key) ON DELETE CASCADE,
  UNIQUE(flag_key, time_window, window_start)
);

CREATE INDEX idx_analytics_flag_window ON analytics_aggregates(flag_key, time_window, window_start);
```

### Domain Entities

#### FeatureFlag Entity (from fflags-lib)

```typescript
// fflags-lib provides this
export class FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  strategy?: Strategy;
  createdAt: Date;
  updatedAt: Date;

  // Domain methods (if fflags-lib provides them)
  activate(): void;
  deactivate(): void;
  isEnabled(): boolean;
}
```

#### MetricEvent Entity (our extension)

```typescript
export class MetricEvent {
  id: number;
  flagKey: string;
  result: boolean;
  userId?: string;
  context?: Record<string, any>;
  timestamp: Date;

  constructor(props: MetricEventProps) {
    this.validateFlagKey(props.flagKey);
    Object.assign(this, props);
  }

  private validateFlagKey(key: string): void {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
      throw new Error('Invalid flag key format');
    }
  }
}
```

#### AnalyticsAggregate Entity (our extension)

```typescript
export class AnalyticsAggregate {
  id: number;
  flagKey: string;
  timeWindow: TimeWindow;
  windowStart: Date;
  windowEnd: Date;
  totalEvaluations: number;
  enabledCount: number;
  disabledCount: number;
  uniqueUsers: number;
  createdAt: Date;

  get enabledRatio(): number {
    return this.totalEvaluations > 0 
      ? this.enabledCount / this.totalEvaluations 
      : 0;
  }

  get successRate(): number {
    return this.enabledRatio * 100;
  }
}
```

### Value Objects

#### FlagKey Value Object

```typescript
export class FlagKey {
  private readonly value: string;

  constructor(key: string) {
    this.validate(key);
    this.value = key;
  }

  private validate(key: string): void {
    if (!key || key.trim().length === 0) {
      throw new Error('Flag key cannot be empty');
    }
    
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
      throw new Error('Flag key must be in kebab-case format');
    }
    
    if (key.length > 255) {
      throw new Error('Flag key cannot exceed 255 characters');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: FlagKey): boolean {
    return this.value === other.value;
  }
}
```

#### RolloutPercentage Value Object

```typescript
export class RolloutPercentage {
  private readonly value: number;

  constructor(percentage: number) {
    this.validate(percentage);
    this.value = percentage;
  }

  private validate(percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }
    
    if (!Number.isInteger(percentage)) {
      throw new Error('Rollout percentage must be an integer');
    }
  }

  toNumber(): number {
    return this.value;
  }

  isFullRollout(): boolean {
    return this.value === 100;
  }

  isNoRollout(): boolean {
    return this.value === 0;
  }
}
```

#### TimeWindow Value Object

```typescript
export class TimeWindow {
  private readonly start: Date;
  private readonly end: Date;

  constructor(start: Date, end: Date) {
    this.validate(start, end);
    this.start = start;
    this.end = end;
  }

  private validate(start: Date, end: Date): void {
    if (start >= end) {
      throw new Error('Start time must be before end time');
    }
    
    if (end > new Date()) {
      throw new Error('End time cannot be in the future');
    }
  }

  contains(timestamp: Date): boolean {
    return timestamp >= this.start && timestamp <= this.end;
  }

  getDurationInHours(): number {
    return (this.end.getTime() - this.start.getTime()) / (1000 * 60 * 60);
  }

  static fromPreset(preset: '1h' | '24h' | '7d' | '30d'): TimeWindow {
    const end = new Date();
    const start = new Date();
    
    switch (preset) {
      case '1h':
        start.setHours(start.getHours() - 1);
        break;
      case '24h':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
    }
    
    return new TimeWindow(start, end);
  }
}
```

### Redis Cache Keys

```typescript
// Cache key patterns
const CACHE_KEYS = {
  FLAG: (key: string) => `flag:${key}`,
  ALL_FLAGS: (page: number, limit: number) => `flags:list:${page}:${limit}`,
  ANALYTICS: (key: string, window: TimeWindow) => `analytics:${key}:${window}`,
  METRICS: (key: string, window: TimeWindow) => `metrics:${key}:${window}`,
};

// TTL values (seconds)
const CACHE_TTL = {
  FLAG: 300,        // 5 minutes
  ALL_FLAGS: 60,    // 1 minute
  ANALYTICS: 60,    // 1 minute
  METRICS: 30,      // 30 seconds
};
```

### Configuration Parser/Serializer

#### JSON Schema for Feature Flag Configuration

```typescript
export interface FlagConfigJson {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  strategy?: {
    type: 'simple' | 'percentage' | 'user-based' | 'time-based' | 'composite';
    rolloutPercentage?: number;
    whitelist?: string[];
    startTime?: string; // ISO 8601
    endTime?: string;   // ISO 8601
    operator?: 'AND' | 'OR';
    strategies?: FlagConfigJson['strategy'][];
  };
}

export interface BulkConfigJson {
  version: string;
  flags: FlagConfigJson[];
}
```

#### Parser Implementation

```typescript
export class FlagConfigParser {
  parse(json: string): FlagConfigJson[] {
    try {
      const data = JSON.parse(json);
      this.validateSchema(data);
      return this.transformToFlags(data);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ParseError(`Invalid JSON at line ${this.getLineNumber(error)}: ${error.message}`);
      }
      throw error;
    }
  }

  serialize(flags: FeatureFlag[]): string {
    const config: BulkConfigJson = {
      version: '1.0',
      flags: flags.map(this.flagToJson),
    };
    return JSON.stringify(config, null, 2);
  }

  private validateSchema(data: any): void {
    // JSON schema validation
    if (!data.flags || !Array.isArray(data.flags)) {
      throw new ValidationError('Missing or invalid "flags" array');
    }
    
    data.flags.forEach((flag: any, index: number) => {
      if (!flag.key || typeof flag.key !== 'string') {
        throw new ValidationError(`Flag at index ${index}: missing or invalid "key"`);
      }
      
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(flag.key)) {
        throw new ValidationError(`Flag at index ${index}: key must be in kebab-case format`);
      }
      
      // Additional validations...
    });
  }

  private getLineNumber(error: SyntaxError): number {
    // Extract line number from error message
    const match = error.message.match(/line (\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

**Redundancies Eliminated:**
- Properties 1.7 (getFlag) and 4.1 (persistence) are subsumed by Property 1 (create-retrieve round-trip)
- Properties 3.1, 3.2 are covered by strategy-specific evaluation properties
- Properties 5.1 and 3.5 are identical (evaluation generates metric event)
- Properties 8.2 is covered by 8.1 (missing token rejection)
- Properties 4.4 and 1.6 both test deletion behavior
- Properties 4.7 and 3.8 both test Redis fallback
- Property 14.8 is covered by 14.5 (round-trip includes strategy)
- Property 16.3 is covered by 3.8 (Redis resilience)
- Property 16.4 is covered by 1.9 (kebab-case validation)

**Consolidations:**
- Combined 8.8 and 8.9 into single RBAC property
- Combined 6.1, 6.2, 6.3 into single analytics calculation property
- Combined percentage strategy properties (2.2 and 2.5) into single consistent evaluation property

### Property 1: Flag Creation Round-Trip

*For any* valid flag key, name, description, and initial state, creating a flag and then retrieving it by key should return a flag with equivalent attributes.

**Validates: Requirements 1.3, 1.7, 4.1**

### Property 2: Duplicate Key Rejection

*For any* flag key that already exists in the system, attempting to create another flag with the same key should result in an error.

**Validates: Requirements 1.4**

### Property 3: Flag State Transitions

*For any* existing flag, activating it should set its state to enabled, and deactivating it should set its state to disabled, and these changes should be reflected in subsequent retrievals.

**Validates: Requirements 1.5**

### Property 4: Flag Deletion

*For any* existing flag, after deleting it by key, attempting to retrieve it should return null or not found.

**Validates: Requirements 1.6, 4.4**

### Property 5: Pagination Completeness

*For any* set of N created flags, retrieving all flags across paginated requests should return exactly N flags with no duplicates or omissions.

**Validates: Requirements 1.8**

### Property 6: Kebab-Case Validation

*For any* string that does not match the kebab-case pattern (lowercase alphanumeric with hyphens), attempting to create a flag with that key should be rejected with a validation error.

**Validates: Requirements 1.9, 16.4**

### Property 7: Timestamp Metadata

*For any* created flag, the retrieved flag should have valid creation and modification timestamps where creation timestamp ≤ modification timestamp ≤ current time.

**Validates: Requirements 1.10**

### Property 8: Percentage Strategy Consistency

*For any* user ID and percentage-based flag, evaluating the flag multiple times with the same user ID should always return the same result (consistent hashing).

**Validates: Requirements 2.2, 2.5**

### Property 9: User Whitelist Evaluation

*For any* user-based flag with a whitelist, evaluation should return enabled for users in the whitelist and disabled for users not in the whitelist.

**Validates: Requirements 2.3, 2.6**

### Property 10: Time Window Evaluation

*For any* time-based flag with start and end timestamps, evaluation should return enabled when current time is within the window and disabled when outside the window.

**Validates: Requirements 2.4, 2.7**

### Property 11: Composite Strategy Logic

*For any* composite strategy with AND operator, all sub-strategies must evaluate to enabled for the result to be enabled; for OR operator, at least one sub-strategy must evaluate to enabled.

**Validates: Requirements 2.8**

### Property 12: Non-Existent Flag Default

*For any* flag key that does not exist in the system, evaluation should return false as the default value.

**Validates: Requirements 3.3**

### Property 13: Evaluation Generates Metric Event

*For any* flag evaluation, a metric event should be generated containing the flag key, result, timestamp, and optional user context.

**Validates: Requirements 3.5, 5.1, 5.2**

### Property 14: Cache Invalidation on Update

*For any* flag that is updated, the next retrieval should return the updated data, not stale cached data.

**Validates: Requirements 4.3**

### Property 15: Metrics Aggregation Accuracy

*For any* flag and time window, the total evaluations count should equal the number of metric events for that flag within the time window.

**Validates: Requirements 5.7, 6.1**

### Property 16: Success Rate Calculation

*For any* flag with recorded metrics, the success rate should equal (enabled_count / total_evaluations) × 100.

**Validates: Requirements 5.8, 6.3**

### Property 17: Unique User Counting

*For any* flag and time window, the unique users count should equal the number of distinct user IDs in metric events for that flag within the time window.

**Validates: Requirements 6.2**

### Property 18: Unused Flag Detection

*For any* flag with zero evaluation events in the last N days, it should be identified as unused.

**Validates: Requirements 6.4**

### Property 19: Time Series Data Grouping

*For any* flag and time window, time-series data points should be correctly grouped by time intervals with no gaps or overlaps.

**Validates: Requirements 6.5**

### Property 20: Analytics Export Round-Trip

*For any* analytics data, exporting to JSON and then parsing should produce equivalent data structures.

**Validates: Requirements 6.8**

### Property 21: API Input Validation

*For any* API endpoint, providing invalid input (malformed data, missing required fields, invalid types) should return HTTP 400 with descriptive validation errors.

**Validates: Requirements 7.9, 16.1**

### Property 22: API Error Messages

*For any* error response from the API, the response body should contain a descriptive error message explaining what went wrong.

**Validates: Requirements 7.11**

### Property 23: JWT Authentication Required

*For any* protected API endpoint (all except /health), requests without a valid JWT token should be rejected with HTTP 401.

**Validates: Requirements 8.1, 8.2**

### Property 24: JWT Token Validation

*For any* request with an invalid or expired JWT token, the API should return HTTP 401 Unauthorized.

**Validates: Requirements 8.3**

### Property 25: JWT User Context Extraction

*For any* valid JWT token, the extracted user context should match the claims encoded in the token.

**Validates: Requirements 8.4**

### Property 26: Role-Based Access Control

*For any* user with viewer role, mutation operations (POST, PUT, DELETE) should be rejected; for admin role, all operations should be allowed.

**Validates: Requirements 8.7, 8.8, 8.9**

### Property 27: JWT Token Generation and Verification

*For any* valid payload, generating a JWT token and then verifying it should return the original payload.

**Validates: Requirements 13.5**

### Property 28: Configuration Parsing

*For any* valid JSON configuration string, parsing it should produce feature flag objects with correct attributes.

**Validates: Requirements 14.1**

### Property 29: Configuration Parse Error Details

*For any* invalid JSON configuration, the parser should return an error with line and column information.

**Validates: Requirements 14.2**

### Property 30: Configuration Schema Validation

*For any* JSON that doesn't match the feature flag schema (missing required fields, wrong types), validation should reject it with descriptive errors.

**Validates: Requirements 14.3**

### Property 31: Configuration Serialization Round-Trip

*For any* valid feature flag object, serializing to JSON then parsing then serializing should produce equivalent JSON (idempotent serialization).

**Validates: Requirements 14.4, 14.5, 14.8**

### Property 32: Bulk Import Completeness

*For any* JSON file containing N valid flag configurations, importing should create exactly N flags in the system.

**Validates: Requirements 14.6**

### Property 33: Bulk Export Completeness

*For any* set of N flags in the system, exporting to JSON and then importing should recreate all N flags with equivalent attributes.

**Validates: Requirements 14.7**

### Property 34: Evaluation Counter Increment

*For any* flag, after K evaluations, the total evaluations counter should increase by K.

**Validates: Requirements 15.9**

### Property 35: Rollout Percentage Bounds

*For any* percentage-based strategy, the rollout percentage must be an integer between 0 and 100 (inclusive), otherwise validation should reject it.

**Validates: Requirements 16.5**

### Property 36: ISO 8601 Timestamp Validation

*For any* time-based strategy, timestamps that are not in valid ISO 8601 format should be rejected with a validation error.

**Validates: Requirements 16.6**

### Property 37: Evaluation Exception Handling

*For any* flag evaluation that throws an exception, the system should return false and log the error without crashing.

**Validates: Requirements 16.7**

## Error Handling

### Error Categories

#### 1. Validation Errors (HTTP 400)

**Triggers:**
- Invalid flag key format (non-kebab-case)
- Missing required fields
- Invalid data types
- Rollout percentage out of bounds (< 0 or > 100)
- Invalid ISO 8601 timestamps
- Invalid JSON schema

**Response Format:**
```typescript
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "key",
      "message": "Key must be in kebab-case format",
      "value": "InvalidKey123"
    }
  ]
}
```

**Handling Strategy:**
- Validate at API boundary using class-validator DTOs
- Return detailed field-level errors
- Never expose internal implementation details

#### 2. Not Found Errors (HTTP 404)

**Triggers:**
- Flag key does not exist
- Resource not found

**Response Format:**
```typescript
{
  "statusCode": 404,
  "message": "Feature flag not found",
  "flagKey": "non-existent-flag"
}
```

**Handling Strategy:**
- Check existence before operations
- Return specific error messages
- For evaluation, return false instead of 404 (fail-safe)

#### 3. Conflict Errors (HTTP 409)

**Triggers:**
- Duplicate flag key on creation
- Concurrent modification conflicts

**Response Format:**
```typescript
{
  "statusCode": 409,
  "message": "Feature flag with key 'my-flag' already exists"
}
```

**Handling Strategy:**
- Check uniqueness constraints
- Use database unique constraints as backup
- Provide clear conflict resolution guidance

#### 4. Authentication Errors (HTTP 401)

**Triggers:**
- Missing JWT token
- Invalid JWT token
- Expired JWT token
- Malformed token

**Response Format:**
```typescript
{
  "statusCode": 401,
  "message": "Unauthorized: Invalid or missing authentication token"
}
```

**Handling Strategy:**
- Validate token before processing request
- Don't expose token details in error
- Log authentication failures for security monitoring

#### 5. Authorization Errors (HTTP 403)

**Triggers:**
- Insufficient permissions (viewer attempting mutation)
- Role-based access control violation

**Response Format:**
```typescript
{
  "statusCode": 403,
  "message": "Forbidden: Insufficient permissions for this operation",
  "requiredRole": "admin",
  "userRole": "viewer"
}
```

**Handling Strategy:**
- Check permissions after authentication
- Provide clear role requirements
- Log authorization failures

#### 6. Infrastructure Errors (HTTP 503)

**Triggers:**
- PostgreSQL connection failure
- Redis connection failure (if critical)
- External service unavailable

**Response Format:**
```typescript
{
  "statusCode": 503,
  "message": "Service temporarily unavailable",
  "retryAfter": 30 // seconds
}
```

**Handling Strategy:**
- Implement circuit breaker pattern
- Provide retry-after hints
- Degrade gracefully when possible (Redis fallback)
- Log infrastructure errors for ops team

#### 7. Internal Server Errors (HTTP 500)

**Triggers:**
- Unexpected exceptions
- Unhandled errors
- Programming errors

**Response Format:**
```typescript
{
  "statusCode": 500,
  "message": "Internal server error",
  "errorId": "uuid-for-tracking"
}
```

**Handling Strategy:**
- Catch all unhandled exceptions at top level
- Log full stack trace with error ID
- Return generic message (don't expose internals)
- Alert on-call engineer for investigation

### Resilience Patterns

#### Circuit Breaker

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    if (this.failureCount >= 5) {
      this.state = 'OPEN';
    }
  }
  
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return false;
    const elapsed = Date.now() - this.lastFailureTime.getTime();
    return elapsed > 60000; // 60 seconds
  }
}
```

#### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}
```

#### Graceful Degradation

```typescript
async function evaluateFlagWithFallback(key: string, context: EvaluationContext): Promise<boolean> {
  try {
    // Try with Redis cache
    return await evaluateWithCache(key, context);
  } catch (error) {
    logger.warn('Redis unavailable, falling back to database', { key, error });
    
    try {
      // Fallback to direct database query
      return await evaluateFromDatabase(key, context);
    } catch (dbError) {
      logger.error('Database unavailable, returning safe default', { key, error: dbError });
      
      // Ultimate fallback: return false (fail-safe)
      return false;
    }
  }
}
```

### Error Logging Strategy

```typescript
interface ErrorLog {
  errorId: string;
  timestamp: Date;
  level: 'warn' | 'error' | 'fatal';
  message: string;
  stack?: string;
  context: {
    userId?: string;
    flagKey?: string;
    operation: string;
    [key: string]: any;
  };
}

// Log all errors with structured format
logger.error({
  errorId: generateUuid(),
  timestamp: new Date(),
  level: 'error',
  message: error.message,
  stack: error.stack,
  context: {
    userId: user?.id,
    flagKey: key,
    operation: 'evaluateFlag',
  },
});
```

## Testing Strategy

### Overview

El sistema utilizará una estrategia de testing dual que combina:

1. **Unit Tests**: Para casos específicos, ejemplos concretos y edge cases
2. **Property-Based Tests**: Para verificar propiedades universales a través de múltiples inputs generados

Esta combinación proporciona cobertura completa: los unit tests capturan bugs concretos y casos específicos, mientras que los property tests verifican la corrección general del sistema.

### Property-Based Testing Framework

**Library Selection:** `fast-check` (JavaScript/TypeScript)

**Rationale:**
- Native TypeScript support
- Excellent integration with Jest
- Rich set of built-in generators (arbitraries)
- Shrinking support for minimal failing examples
- Active maintenance and community

**Configuration:**
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts', '**/*.property.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.property.spec.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Property Test Configuration

**Minimum Iterations:** 100 runs per property test (due to randomization)

**Tagging Convention:**
```typescript
/**
 * Feature: feature-flags-manager, Property 1: Flag Creation Round-Trip
 * 
 * For any valid flag key, name, description, and initial state,
 * creating a flag and then retrieving it by key should return
 * a flag with equivalent attributes.
 */
it('property: flag creation round-trip', () => {
  fc.assert(
    fc.property(
      flagKeyArbitrary(),
      fc.string(),
      fc.option(fc.string()),
      fc.boolean(),
      async (key, name, description, enabled) => {
        // Test implementation
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

```
src/
├── domain/
│   ├── entities/
│   │   ├── feature-flag.entity.ts
│   │   ├── feature-flag.entity.spec.ts          # Unit tests
│   │   └── feature-flag.entity.property.spec.ts # Property tests
│   └── value-objects/
│       ├── flag-key.vo.ts
│       ├── flag-key.vo.spec.ts
│       └── flag-key.vo.property.spec.ts
├── application/
│   ├── use-cases/
│   │   ├── create-flag.use-case.ts
│   │   ├── create-flag.use-case.spec.ts
│   │   └── create-flag.use-case.property.spec.ts
└── infrastructure/
    ├── repositories/
    │   ├── flag.repository.postgres.ts
    │   └── flag.repository.postgres.integration.spec.ts
    └── api/
        ├── controllers/
        │   ├── feature-flags.controller.ts
        │   └── feature-flags.controller.e2e.spec.ts
```

### Custom Arbitraries (Generators)

```typescript
// test/arbitraries/flag-key.arbitrary.ts
import * as fc from 'fast-check';

export function flagKeyArbitrary(): fc.Arbitrary<string> {
  // Generate valid kebab-case strings
  return fc
    .array(fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 1, maxLength: 10 }), { minLength: 1, maxLength: 5 })
    .map(parts => parts.join('-'));
}

export function invalidFlagKeyArbitrary(): fc.Arbitrary<string> {
  // Generate invalid flag keys for negative testing
  return fc.oneof(
    fc.string().filter(s => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)),
    fc.constant(''),
    fc.constant('UPPERCASE'),
    fc.constant('with spaces'),
    fc.constant('with_underscores'),
  );
}

// test/arbitraries/feature-flag.arbitrary.ts
export function featureFlagArbitrary(): fc.Arbitrary<CreateFlagDto> {
  return fc.record({
    key: flagKeyArbitrary(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 })),
    enabled: fc.boolean(),
    strategy: fc.option(strategyArbitrary()),
  });
}

export function strategyArbitrary(): fc.Arbitrary<Strategy> {
  return fc.oneof(
    fc.record({ type: fc.constant('simple' as const) }),
    fc.record({
      type: fc.constant('percentage' as const),
      rolloutPercentage: fc.integer({ min: 0, max: 100 }),
    }),
    fc.record({
      type: fc.constant('user-based' as const),
      whitelist: fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
    }),
    fc.record({
      type: fc.constant('time-based' as const),
      startTime: fc.date(),
      endTime: fc.date(),
    }).filter(s => s.startTime < s.endTime),
  );
}

// test/arbitraries/evaluation-context.arbitrary.ts
export function evaluationContextArbitrary(): fc.Arbitrary<EvaluationContext> {
  return fc.record({
    userId: fc.option(fc.uuid()),
    attributes: fc.option(fc.dictionary(fc.string(), fc.anything())),
    timestamp: fc.option(fc.date()),
  });
}
```

### Property Test Examples

#### Property 1: Flag Creation Round-Trip

```typescript
/**
 * Feature: feature-flags-manager, Property 1: Flag Creation Round-Trip
 */
describe('Property: Flag Creation Round-Trip', () => {
  it('should preserve flag attributes through create-retrieve cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        featureFlagArbitrary(),
        async (flagDto) => {
          // Arrange
          const repository = new InMemoryFlagRepository();
          const useCase = new CreateFlagUseCase(repository);
          
          // Act
          const created = await useCase.execute(flagDto);
          const retrieved = await repository.findByKey(created.key);
          
          // Assert
          expect(retrieved).toBeDefined();
          expect(retrieved!.key).toBe(created.key);
          expect(retrieved!.name).toBe(created.name);
          expect(retrieved!.description).toBe(created.description);
          expect(retrieved!.enabled).toBe(created.enabled);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property 8: Percentage Strategy Consistency

```typescript
/**
 * Feature: feature-flags-manager, Property 8: Percentage Strategy Consistency
 */
describe('Property: Percentage Strategy Consistency', () => {
  it('should return same result for same user across multiple evaluations', async () => {
    await fc.assert(
      fc.asyncProperty(
        flagKeyArbitrary(),
        fc.integer({ min: 0, max: 100 }),
        fc.uuid(),
        fc.integer({ min: 2, max: 10 }),
        async (key, percentage, userId, evaluationCount) => {
          // Arrange
          const flag = createFlagWithPercentageStrategy(key, percentage);
          const evaluator = new StrategyEvaluator();
          const context = { userId };
          
          // Act
          const results = await Promise.all(
            Array(evaluationCount).fill(null).map(() => 
              evaluator.evaluate(flag, context)
            )
          );
          
          // Assert - all results should be identical
          const firstResult = results[0];
          expect(results.every(r => r === firstResult)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property 31: Configuration Serialization Round-Trip

```typescript
/**
 * Feature: feature-flags-manager, Property 31: Configuration Serialization Round-Trip
 */
describe('Property: Configuration Serialization Round-Trip', () => {
  it('should preserve flag data through serialize-parse-serialize cycle', async () => {
    await fc.assert(
      fc.property(
        fc.array(featureFlagArbitrary(), { minLength: 1, maxLength: 20 }),
        (flags) => {
          // Arrange
          const parser = new FlagConfigParser();
          
          // Act
          const json1 = parser.serialize(flags);
          const parsed = parser.parse(json1);
          const json2 = parser.serialize(parsed);
          
          // Assert - serialization should be idempotent
          expect(json1).toBe(json2);
          expect(parsed).toEqual(flags);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Examples

#### Unit Test: Duplicate Key Rejection

```typescript
describe('CreateFlagUseCase', () => {
  it('should reject duplicate flag key with descriptive error', async () => {
    // Arrange
    const repository = new InMemoryFlagRepository();
    const useCase = new CreateFlagUseCase(repository);
    const flagDto = { key: 'my-flag', name: 'My Flag', enabled: false };
    
    // Act
    await useCase.execute(flagDto);
    
    // Assert
    await expect(useCase.execute(flagDto)).rejects.toThrow(
      'Feature flag with key \'my-flag\' already exists'
    );
  });
});
```

#### Unit Test: Health Check with Unhealthy Database

```typescript
describe('HealthController', () => {
  it('should return 503 when PostgreSQL is unhealthy', async () => {
    // Arrange
    const mockDbConnection = {
      isConnected: jest.fn().mockResolvedValue(false),
    };
    const controller = new HealthController(mockDbConnection, mockRedis);
    
    // Act
    const response = await controller.check();
    
    // Assert
    expect(response.statusCode).toBe(503);
    expect(response.status).toBe('unhealthy');
    expect(response.checks.database).toBe('down');
  });
});
```

### Integration Test Examples

#### Integration Test: PostgreSQL Repository

```typescript
describe('FlagRepositoryPostgres (Integration)', () => {
  let repository: FlagRepositoryPostgres;
  let connection: Connection;
  
  beforeAll(async () => {
    connection = await createTestDatabaseConnection();
    repository = new FlagRepositoryPostgres(connection);
  });
  
  afterAll(async () => {
    await connection.close();
  });
  
  beforeEach(async () => {
    await connection.query('TRUNCATE TABLE feature_flags CASCADE');
  });
  
  it('should persist and retrieve flag from PostgreSQL', async () => {
    // Arrange
    const flag = new FeatureFlag({
      key: 'test-flag',
      name: 'Test Flag',
      enabled: true,
    });
    
    // Act
    await repository.save(flag);
    const retrieved = await repository.findByKey('test-flag');
    
    // Assert
    expect(retrieved).toBeDefined();
    expect(retrieved!.key).toBe('test-flag');
    expect(retrieved!.enabled).toBe(true);
  });
});
```

### End-to-End Test Examples

#### E2E Test: Complete Flag Lifecycle

```typescript
describe('Feature Flags API (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Get auth token
    authToken = await getTestAuthToken(app, 'admin');
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('should complete full flag lifecycle: create, retrieve, update, delete', async () => {
    // Create
    const createResponse = await request(app.getHttpServer())
      .post('/api/feature-flags')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        key: 'e2e-test-flag',
        name: 'E2E Test Flag',
        enabled: false,
      })
      .expect(201);
    
    expect(createResponse.body.key).toBe('e2e-test-flag');
    
    // Retrieve
    const getResponse = await request(app.getHttpServer())
      .get('/api/feature-flags/e2e-test-flag')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(getResponse.body.enabled).toBe(false);
    
    // Update
    await request(app.getHttpServer())
      .put('/api/feature-flags/e2e-test-flag')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ enabled: true })
      .expect(200);
    
    // Verify update
    const updatedResponse = await request(app.getHttpServer())
      .get('/api/feature-flags/e2e-test-flag')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(updatedResponse.body.enabled).toBe(true);
    
    // Delete
    await request(app.getHttpServer())
      .delete('/api/feature-flags/e2e-test-flag')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(204);
    
    // Verify deletion
    await request(app.getHttpServer())
      .get('/api/feature-flags/e2e-test-flag')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});
```

### Test Coverage Requirements

**Minimum Coverage Targets:**
- Overall: 80%
- Domain Layer: 90% (critical business logic)
- Application Layer: 85%
- Infrastructure Layer: 75%
- API Controllers: 80%

**Coverage Exclusions:**
- Configuration files
- Type definitions
- Test files themselves
- Generated code

### Testing Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clarity**: Test names should clearly describe what is being tested
3. **Arrange-Act-Assert**: Follow AAA pattern for test structure
4. **Fast Execution**: Unit tests should run in milliseconds
5. **Deterministic**: Tests should produce same results every time
6. **Meaningful Assertions**: Assert on behavior, not implementation details
7. **Test Data Builders**: Use factory functions for test data creation
8. **In-Memory Implementations**: Use in-memory repositories for unit tests
9. **Test Containers**: Use Docker containers for integration tests
10. **Property Test Shrinking**: Let fast-check find minimal failing examples

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run property tests
        run: npm run test:property
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Run e2e tests
        run: npm run test:e2e
      
      - name: Check coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Test Commands

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=\\.spec\\.ts$",
    "test:property": "jest --testPathPattern=\\.property\\.spec\\.ts$",
    "test:integration": "jest --testPathPattern=\\.integration\\.spec\\.ts$",
    "test:e2e": "jest --testPathPattern=\\.e2e\\.spec\\.ts$ --runInBand",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Objectives:**
- Set up monorepo structure
- Install and configure fflags-lib
- Create JWT package
- Set up Docker infrastructure

**Deliverables:**
1. NX workspace configuration
2. fflags-lib integration with PostgreSQL and Redis
3. JWT package in `libs/infrastructure/@org/jwt`
4. Docker Compose setup with PostgreSQL and Redis
5. Database migrations for fflags-lib schema
6. Basic health check endpoint

**Testing:**
- Integration tests for fflags-lib connection
- Unit tests for JWT package
- Docker container health checks

### Phase 2: Core Domain Extensions (Week 3-4)

**Objectives:**
- Implement advanced strategies (if needed)
- Build metrics collection system
- Create analytics engine

**Deliverables:**
1. Strategy evaluator with percentage, user-based, time-based strategies
2. Metrics collector with batching and retry logic
3. Analytics engine with aggregation queries
4. Value objects (FlagKey, RolloutPercentage, TimeWindow)
5. Domain events for evaluation tracking

**Testing:**
- Property tests for strategy consistency
- Property tests for metrics accuracy
- Unit tests for value object validation
- Integration tests for metrics persistence

### Phase 3: API Backend (Week 5-6)

**Objectives:**
- Build NestJS REST API
- Implement authentication and authorization
- Add validation and error handling

**Deliverables:**
1. Feature flags CRUD endpoints
2. Evaluation endpoint
3. Metrics and analytics endpoints
4. JWT authentication middleware
5. Role-based access control guards
6. OpenAPI/Swagger documentation

**Testing:**
- E2E tests for all endpoints
- Property tests for input validation
- Unit tests for controllers and guards
- Integration tests for authentication flow

### Phase 4: Web Frontend (Week 7-8)

**Objectives:**
- Build Next.js web application
- Implement flag management UI
- Add analytics dashboards

**Deliverables:**
1. Authentication pages (login)
2. Dashboard with flag list
3. Flag creation and editing forms
4. Strategy configuration UI
5. Metrics and analytics charts
6. Responsive design for mobile

**Testing:**
- Component tests with React Testing Library
- E2E tests with Playwright
- Visual regression tests
- Accessibility tests

### Phase 5: Configuration Management (Week 9)

**Objectives:**
- Implement JSON parser and serializer
- Add bulk import/export functionality

**Deliverables:**
1. JSON schema validator
2. Configuration parser with error reporting
3. Bulk import API endpoint
4. Bulk export API endpoint
5. CLI tool for configuration management

**Testing:**
- Property tests for round-trip serialization
- Unit tests for schema validation
- E2E tests for bulk operations

### Phase 6: Observability (Week 10)

**Objectives:**
- Add comprehensive logging
- Implement metrics collection
- Set up monitoring

**Deliverables:**
1. Structured logging with context
2. Prometheus metrics endpoint
3. Performance monitoring
4. Error tracking integration
5. Alerting rules

**Testing:**
- Integration tests for metrics endpoint
- Unit tests for logging utilities
- Load tests for performance validation

## Security Considerations

### Authentication

- JWT tokens with RS256 signing (asymmetric)
- Token expiration: 1 hour (configurable)
- Secure token storage in frontend (httpOnly cookies recommended)
- Token refresh mechanism for long sessions

### Authorization

- Role-based access control (admin, viewer)
- Principle of least privilege
- Audit logging for sensitive operations

### Data Protection

- Encrypt sensitive data at rest (if needed)
- Use TLS for all API communications
- Sanitize user inputs to prevent injection attacks
- Rate limiting on API endpoints

### Infrastructure Security

- PostgreSQL: Use strong passwords, restrict network access
- Redis: Enable authentication, use TLS
- Docker: Run containers as non-root users
- Environment variables: Never commit secrets to version control

## Performance Considerations

### Caching Strategy

- Redis cache for flag configurations (TTL: 5 minutes)
- Analytics results cache (TTL: 60 seconds)
- Cache invalidation on flag updates
- Cache warming on application startup

### Database Optimization

- Indexes on frequently queried columns (flag_key, timestamp)
- Connection pooling (max 20 connections)
- Query optimization for analytics aggregations
- Partitioning for metrics_events table (by timestamp)

### API Performance

- Response compression (gzip)
- Pagination for list endpoints (default: 10 items)
- Async processing for metrics collection
- Circuit breaker for external dependencies

### Scalability

- Horizontal scaling: Stateless API servers
- Database read replicas for analytics queries
- Redis cluster for high availability
- Load balancing with health checks

## Monitoring and Alerting

### Key Metrics

1. **Availability**: API uptime, database connectivity
2. **Performance**: Response time (p50, p95, p99), throughput
3. **Errors**: Error rate, error types, failed requests
4. **Business**: Total flags, active flags, evaluation count

### Alerts

- API response time > 500ms (p95)
- Error rate > 1%
- Database connection failures
- Redis unavailability
- Disk space > 80%

### Dashboards

- System health overview
- API performance metrics
- Flag usage statistics
- Error tracking and trends

## Deployment Strategy

### Environments

1. **Development**: Local Docker Compose
2. **Staging**: Kubernetes cluster with test data
3. **Production**: Kubernetes cluster with HA setup

### Deployment Process

1. Run all tests in CI pipeline
2. Build Docker images
3. Push images to container registry
4. Deploy to staging environment
5. Run smoke tests
6. Deploy to production with rolling update
7. Monitor metrics and logs

### Rollback Plan

- Keep previous 3 versions of Docker images
- Automated rollback on health check failures
- Database migration rollback scripts
- Feature flags for gradual rollout

## Maintenance and Operations

### Database Maintenance

- Regular backups (daily full, hourly incremental)
- Backup retention: 30 days
- Vacuum and analyze PostgreSQL weekly
- Monitor table sizes and growth

### Metrics Retention

- Raw events: 90 days
- Aggregated data: 1 year
- Archived data: 3 years (cold storage)

### Dependency Updates

- Security patches: Apply immediately
- Minor updates: Monthly
- Major updates: Quarterly with testing

## Future Enhancements

### Potential Features

1. **Multi-tenancy**: Support multiple organizations
2. **Webhooks**: Notify external systems on flag changes
3. **A/B Testing**: Built-in experiment tracking
4. **Gradual Rollout**: Automatic percentage increase
5. **Flag Dependencies**: Flags that depend on other flags
6. **Audit Trail**: Complete history of flag changes
7. **SDK Libraries**: Client libraries for multiple languages
8. **Real-time Updates**: WebSocket support for live flag changes
9. **Flag Scheduling**: Schedule flag activations
10. **Advanced Analytics**: ML-based insights and recommendations

### Technical Debt Prevention

- Regular code reviews
- Refactoring sprints every quarter
- Documentation updates with code changes
- Performance profiling and optimization
- Security audits bi-annually

## Conclusion

This design document provides a comprehensive blueprint for implementing the Feature Flags Manager system. The architecture leverages fflags-lib as the core engine while extending it with advanced metrics, analytics, and user interfaces. The dual testing strategy ensures both correctness and robustness, while the phased implementation roadmap provides a clear path to delivery.

Key success factors:
- Proper integration with fflags-lib without modifying its source
- Comprehensive property-based testing for critical logic
- Scalable architecture with caching and async processing
- Security-first approach with JWT authentication
- Observable system with metrics and logging
- Clear separation of concerns following hexagonal architecture

The system is designed to be maintainable, testable, and extensible, following industry best practices and modern software engineering principles.


=============

# Implementation Plan: Feature Flags Manager

## Overview

Este plan de implementación desglosa el Feature Flags Manager en tareas incrementales y ejecutables. El sistema se construye sobre fflags-lib (paquete npm existente) y lo extiende con capacidades avanzadas de métricas, analytics, API REST y frontend web.

**Stack Tecnológico:**
- Backend: NestJS, TypeScript, fflags-lib
- Frontend: Next.js 14+, React 18+, TailwindCSS
- Infrastructure: PostgreSQL 15+, Redis 7+, Docker
- Testing: Jest, fast-check (property-based testing)

**Arquitectura:** Hexagonal (Ports & Adapters) con Domain-Driven Design

**Fases de Implementación:**
1. Foundation (Semana 1-2)
2. Core Domain Extensions (Semana 3-4)
3. API Backend (Semana 5-6)
4. Web Frontend (Semana 7-8)
5. Configuration Management (Semana 9)
6. Observability (Semana 10)

## Tasks

### Phase 1: Foundation

- [x] 1. Set up NX monorepo structure and base configuration
  - Create NX workspace if not exists
  - Configure TypeScript with strict mode
  - Set up ESLint and Prettier
  - Configure path aliases for clean imports
  - _Requirements: Infrastructure setup_

- [x] 2. Create JWT authentication package
  - [x] 2.1 Create library structure at `libs/infrastructure/@org/jwt`
    - Generate NX library with `nx g @nx/node:library jwt --directory=libs/infrastructure/@org`
    - Set up barrel exports in index.ts
    - _Requirements: 8.1, 13.1_
  
  - [x] 2.2 Implement JWT service with sign, verify, and decode methods
    - Support both RS256 (asymmetric) and HS256 (symmetric) algorithms
    - Implement JwtPayload interface with sub, email, role, iat, exp
    - Add configurable token expiration (default: 1 hour)
    - _Requirements: 8.4, 13.2, 13.3, 13.5_
  
  - [x] 2.3 Write property test for JWT token generation and verification round-trip
    - **Property 27: JWT Token Generation and Verification**
    - **Validates: Requirements 13.5**
  
  - [x] 2.4 Write unit tests for JWT service
    - Test token expiration handling
    - Test invalid token rejection
    - Test malformed token handling
    - _Requirements: 8.3, 13.4_

- [x] 3. Install and configure fflags-lib package
  - [x] 3.1 Install fflags-lib npm package
    - Run `npm install fflags-lib` (or equivalent package name)
    - Verify package installation and exports
    - _Requirements: Integration with fflags-lib_
  
  - [x] 3.2 Create fflags-lib configuration module
    - Create FflagsConfig interface with database and redis settings
    - Implement configuration factory for different environments
    - Set up environment variable mapping
    - _Requirements: 4.1, 4.2_
  
  - [x] 3.3 Create wrapper service for fflags-lib ManagerService
    - Implement IFlagManager interface
    - Wrap fflags-lib CRUD operations (create, get, getAll, activate, deactivate, delete)
    - Add error handling and logging
    - _Requirements: 1.3, 1.5, 1.6, 1.7_

- [x] 4. Set up Docker infrastructure
  - [x] 4.1 Create Docker Compose configuration
    - Define PostgreSQL 15+ service with persistent volume
    - Define Redis 7+ service with persistent volume
    - Configure network and port mappings
    - Add health checks for both services
    - _Requirements: 4.1, 4.2_
  
  - [x] 4.2 Create database initialization scripts
    - Set up fflags-lib schema (if migrations needed)
    - Create extensions table for metrics and analytics
    - Add indexes for performance optimization
    - _Requirements: 4.1, 5.3_
  
  - [x] 4.3 Configure Redis for caching
    - Set up Redis connection with authentication
    - Configure TTL defaults for different cache types
    - Implement cache key patterns
    - _Requirements: 4.2, 4.5_

- [x] 5. Create NestJS API application structure
  - [x] 5.1 Generate NestJS application in monorepo
    - Run `nx g @nx/nest:application api --directory=apps`
    - Configure application module with global pipes and filters
    - Set up environment configuration with @nestjs/config
    - _Requirements: 7.1_
  
  - [x] 5.2 Implement health check endpoint
    - Create HealthController with GET /health endpoint
    - Check PostgreSQL connection status
    - Check Redis connection status
    - Return structured health response with status codes
    - _Requirements: 7.10_
  
  - [x] 5.3 Write integration tests for health check
    - Test healthy state (all services up)
    - Test unhealthy state (database down)
    - Test unhealthy state (Redis down)
    - _Requirements: 7.10_

- [x] 6. Checkpoint - Verify foundation setup
  - Ensure Docker containers start successfully
  - Verify fflags-lib connects to PostgreSQL and Redis
  - Verify health check endpoint returns 200 OK
  - Ensure all tests pass, ask the user if questions arise.


### Phase 2: Core Domain Extensions

- [x] 7. Create domain value objects
  - [x] 7.1 Implement FlagKey value object
    - Add validation for kebab-case format (regex: ^[a-z0-9]+(?:-[a-z0-9]+)*$)
    - Add length validation (max 255 characters)
    - Implement equals and toString methods
    - _Requirements: 1.9, 16.4_
  
  - [x] 7.2 Write property test for FlagKey validation
    - **Property 6: Kebab-Case Validation**
    - **Validates: Requirements 1.9, 16.4**
  
  - [x] 7.3 Implement RolloutPercentage value object
    - Add validation for range 0-100
    - Add validation for integer values only
    - Implement isFullRollout and isNoRollout helper methods
    - _Requirements: 2.2, 16.5_
  
  - [x] 7.4 Write property test for RolloutPercentage bounds validation
    - **Property 35: Rollout Percentage Bounds**
    - **Validates: Requirements 16.5**
  
  - [x] 7.5 Implement TimeWindow value object
    - Add validation for start < end
    - Add validation for end not in future
    - Implement contains and getDurationInHours methods
    - Implement static fromPreset factory for '1h', '24h', '7d', '30d'
    - _Requirements: 2.4, 5.4, 6.5_
  
  - [x] 7.6 Write unit tests for TimeWindow value object
    - Test validation rules
    - Test preset factory method
    - Test contains method with various timestamps
    - _Requirements: 2.4, 5.4_

- [x] 8. Implement advanced strategy evaluator
  - [x] 8.1 Create Strategy interfaces and types
    - Define PercentageStrategy, UserBasedStrategy, TimeBasedStrategy interfaces
    - Define CompositeStrategy with AND/OR operators
    - Create EvaluationContext interface
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.8_
  
  - [x] 8.2 Implement PercentageStrategy evaluator with consistent hashing
    - Use SHA-256 hash of userId for deterministic bucket assignment
    - Ensure same user always gets same result for same percentage
    - Handle edge cases (0%, 100%, missing userId)
    - _Requirements: 2.2, 2.5_
  
  - [x] 8.3 Write property test for percentage strategy consistency
    - **Property 8: Percentage Strategy Consistency**
    - **Validates: Requirements 2.2, 2.5**
  
  - [x] 8.4 Implement UserBasedStrategy evaluator
    - Check if userId exists in whitelist
    - Return enabled for whitelisted users, disabled otherwise
    - Handle missing userId gracefully
    - _Requirements: 2.3, 2.6_
  
  - [x] 8.5 Write property test for user whitelist evaluation
    - **Property 9: User Whitelist Evaluation**
    - **Validates: Requirements 2.3, 2.6**
  
  - [x] 8.6 Implement TimeBasedStrategy evaluator
    - Check if current timestamp is within [startTime, endTime] window
    - Handle timezone considerations
    - Validate ISO 8601 timestamp format
    - _Requirements: 2.4, 2.7, 16.6_
  
  - [x] 8.7 Write property test for time window evaluation
    - **Property 10: Time Window Evaluation**
    - **Validates: Requirements 2.4, 2.7**
  
  - [x] 8.8 Write property test for ISO 8601 timestamp validation
    - **Property 36: ISO 8601 Timestamp Validation**
    - **Validates: Requirements 16.6**
  
  - [x] 8.9 Implement CompositeStrategy evaluator
    - Support AND operator (all sub-strategies must be enabled)
    - Support OR operator (at least one sub-strategy must be enabled)
    - Handle nested composite strategies recursively
    - _Requirements: 2.8_
  
  - [x] 8.10 Write property test for composite strategy logic
    - **Property 11: Composite Strategy Logic**
    - **Validates: Requirements 2.8**
  
  - [x] 8.11 Implement main StrategyEvaluator with exception handling
    - Integrate all strategy types
    - Add try-catch for evaluation errors
    - Return false on exception (fail-safe)
    - Log errors without crashing
    - _Requirements: 3.1, 3.2, 16.7_
  
  - [x] 8.12 Write property test for evaluation exception handling
    - **Property 37: Evaluation Exception Handling**
    - **Validates: Requirements 16.7**

- [x] 9. Build metrics collection system
  - [x] 9.1 Create MetricEvent entity
    - Define properties: id, flagKey, result, userId, context, timestamp
    - Add validation for flagKey format
    - Implement constructor with validation
    - _Requirements: 3.5, 5.1, 5.2_
  
  - [x] 9.2 Create metrics_events database table
    - Define schema with columns: id, flag_key, result, user_id, context (JSONB), timestamp
    - Add foreign key to feature_flags table
    - Create indexes on flag_key, timestamp, and composite (flag_key, timestamp)
    - _Requirements: 5.3_
  
  - [x] 9.3 Implement MetricsCollector service with batching
    - Implement in-memory buffer for events (max 100 events)
    - Implement time-based flush (every 10 seconds)
    - Implement async persistence to PostgreSQL
    - Add retry logic with exponential backoff (3 attempts)
    - _Requirements: 5.1, 5.2, 5.5, 5.6_
  
  - [x] 9.4 Implement circuit breaker for database failures
    - Track failure count and last failure time
    - Open circuit after 5 consecutive failures
    - Attempt reset after 60 seconds
    - _Requirements: 5.6, 16.2_
  
  - [x] 9.5 Write property test for evaluation generates metric event
    - **Property 13: Evaluation Generates Metric Event**
    - **Validates: Requirements 3.5, 5.1, 5.2**
  
  - [x] 9.6 Write integration tests for metrics persistence
    - Test batch insertion to PostgreSQL
    - Test retry logic on failure
    - Test circuit breaker behavior
    - _Requirements: 5.5, 5.6_

- [x] 10. Create analytics engine
  - [x] 10.1 Create AnalyticsAggregate entity
    - Define properties: id, flagKey, timeWindow, windowStart, windowEnd, totalEvaluations, enabledCount, disabledCount, uniqueUsers
    - Implement computed properties: enabledRatio, successRate
    - _Requirements: 5.7, 5.8, 6.1, 6.2, 6.3_
  
  - [x] 10.2 Create analytics_aggregates database table
    - Define schema with pre-aggregated data columns
    - Add unique constraint on (flag_key, time_window, window_start)
    - Create index on (flag_key, time_window, window_start)
    - _Requirements: 6.1_
  
  - [x] 10.3 Implement AnalyticsEngine service
    - Implement calculateUsageStats method with aggregation queries
    - Implement findUnusedFlags method (zero evaluations in N days)
    - Implement generateTimeSeries method with time-based grouping
    - Implement exportAnalytics method (JSON format)
    - _Requirements: 5.7, 5.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.8_
  
  - [x] 10.4 Write property test for metrics aggregation accuracy
    - **Property 15: Metrics Aggregation Accuracy**
    - **Validates: Requirements 5.7, 6.1**
  
  - [x] 10.5 Write property test for success rate calculation
    - **Property 16: Success Rate Calculation**
    - **Validates: Requirements 5.8, 6.3**
  
  - [x] 10.6 Write property test for unique user counting
    - **Property 17: Unique User Counting**
    - **Validates: Requirements 6.2**
  
  - [x] 10.7 Write property test for unused flag detection
    - **Property 18: Unused Flag Detection**
    - **Validates: Requirements 6.4**
  
  - [x] 10.8 Write property test for time series data grouping
    - **Property 19: Time Series Data Grouping**
    - **Validates: Requirements 6.5**
  
  - [x] 10.9 Write property test for analytics export round-trip
    - **Property 20: Analytics Export Round-Trip**
    - **Validates: Requirements 6.8**
  
  - [x] 10.10 Implement Redis caching for analytics results
    - Cache analytics results with 60-second TTL
    - Use cache key pattern: `analytics:{flagKey}:{window}`
    - Invalidate cache on flag updates
    - _Requirements: 4.5, 6.6_
  
  - [x] 10.11 Write integration tests for analytics engine
    - Test aggregation queries with real data
    - Test caching behavior
    - Test cache invalidation
    - _Requirements: 6.1, 6.6_

- [x] 11. Checkpoint - Verify core domain extensions
  - Ensure all value objects validate correctly
  - Verify strategy evaluator works for all strategy types
  - Verify metrics collection batches and persists events
  - Verify analytics engine calculates correct statistics
  - Ensure all tests pass, ask the user if questions arise.


### Phase 3: API Backend

- [ ] 12. Create DTOs with validation
  - [x] 12.1 Create CreateFlagDto with class-validator decorators
    - Add @IsString, @Matches for key (kebab-case regex)
    - Add @IsString for name
    - Add @IsOptional, @IsString for description
    - Add @IsBoolean for enabled
    - Add @IsOptional for strategy
    - _Requirements: 1.3, 1.9, 7.9, 16.1_
  
  - [x] 12.2 Create UpdateFlagDto with partial validation
    - Make all fields optional except key
    - Reuse validation decorators from CreateFlagDto
    - _Requirements: 1.5, 7.9_
  
  - [x] 12.3 Create StrategyDto with nested validation
    - Add @IsEnum for type field
    - Add @IsOptional, @Min(0), @Max(100) for rolloutPercentage
    - Add @IsOptional for whitelist array
    - Add @IsOptional for startTime and endTime (ISO 8601 strings)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 16.5, 16.6_
  
  - [x] 12.4 Create PaginationDto with defaults
    - Add @IsOptional, @Min(1) for page (default: 1)
    - Add @IsOptional, @Min(1), @Max(100) for limit (default: 10)
    - _Requirements: 1.8, 7.4_
  
  - [x] 12.5 Create EvaluationContextDto
    - Add @IsOptional for userId
    - Add @IsOptional for attributes object
    - Add @IsOptional for timestamp
    - _Requirements: 3.1, 3.2_
  
  - [x] 12.6 Write unit tests for API input validation
    - **Validates: Requirements 7.9, 16.1**

- [x] 13. Implement JWT authentication guards
  - [x] 13.1 Create JwtAuthGuard using @nestjs/jwt
    - Implement CanActivate interface
    - Extract and verify JWT token from Authorization header
    - Attach decoded user to request object
    - Return 401 for missing or invalid tokens
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [x] 13.2 Write unit tests for JWT authentication
    - **Validates: Requirements 8.1, 8.2**
  
  - [x] 13.3 Write unit tests for JWT token validation
    - **Validates: Requirements 8.3**
  
  - [x] 13.4 Write unit tests for JWT user context extraction
    - **Validates: Requirements 8.3**
    - **Validates: Requirements 8.4**
  
  - [x] 13.2 Create RolesGuard for RBAC
    - Implement CanActivate interface
    - Check user role from JWT payload
    - Compare against required roles from @Roles decorator
    - Return 403 for insufficient permissions
    - _Requirements: 8.7, 8.8, 8.9_
  
  - [x] 13.3 Write unit tests for role-based access control
    - **Validates: Requirements 8.7, 8.8, 8.9**
  
  - [x] 13.4 Create @Roles decorator
    - Custom decorator to specify required roles
    - Store metadata for RolesGuard to read
    - _Requirements: 8.7_

- [x] 14. Implement Feature Flags CRUD endpoints
  - [x] 14.1 Create FeatureFlagsController
  - [x] 14.2 Implement POST /api/feature-flags (create flag)
  - [x] 14.3 Write unit tests for CRUD operations
  - [x] 14.4 Implement GET /api/feature-flags/:key (get single flag)
  - [x] 14.5 Implement GET /api/feature-flags (list all flags)
    - Added graceful handling for 'No feature flags found' to return empty list
  - [x] 14.6 Write property tests for CRUD operations (Refactored to unit tests)
  
  - [x] 14.8 Implement PUT /api/feature-flags/:key (update flag)
  - [x] 14.9 Write property test for flag state transitions
  - [x] 14.10 Write property test for cache invalidation on update
  - [x] 14.11 Implement DELETE /api/feature-flags/:key (delete flag)
  - [x] 14.12 Write property test for flag deletion
  - [x] 14.13 Write property test for timestamp metadata

- [x] 15. Implement flag evaluation endpoint
  - [x] 15.1 Implement POST /api/feature-flags/:key/evaluate
    - Add @Post(':key/evaluate') decorator
    - Accept EvaluationContextDto in request body
    - Retrieve flag from fflags-lib (with Redis cache)
    - Apply strategy evaluation using StrategyEvaluator
    - Record evaluation event with MetricsCollector
    - Return 200 OK with { enabled: boolean }
    - Return false for non-existent flags (fail-safe)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.7_
  
  - [x]* 15.2 Write property test for non-existent flag default
    - **Property 12: Non-Existent Flag Default**
    - **Validates: Requirements 3.3**
  
  - [x]* 15.3 Write property test for evaluation counter increment
    - **Property 34: Evaluation Counter Increment**
    - **Validates: Requirements 15.9**
  
  - [x] 15.4 Implement graceful degradation for Redis failures
    - Add try-catch around Redis cache access
    - Fall back to direct database query if Redis unavailable
    - Log warning for Redis failures
    - _Requirements: 4.7, 16.3_
  
  - [x]* 15.5 Write integration test for Redis fallback behavior
    - Test evaluation with Redis down
    - Verify fallback to database works
    - _Requirements: 4.7, 16.3_

- [ ] 16. Implement metrics and analytics endpoints
  - [ ] 16.1 Implement GET /api/feature-flags/:key/metrics
    - Add @Get(':key/metrics') decorator
    - Accept @Query('window') parameter for time window
    - Call MetricsCollector.getMetricsByFlag
    - Return 200 OK with FlagMetrics response
    - _Requirements: 5.7, 5.8, 7.8_
  
  - [ ] 16.2 Implement GET /api/feature-flags/:key/analytics
    - Add @Get(':key/analytics') decorator
    - Accept @Query('window') parameter for time window
    - Call AnalyticsEngine.calculateUsageStats
    - Call AnalyticsEngine.generateTimeSeries
    - Return 200 OK with combined analytics response
    - Use Redis cache with 60-second TTL
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 16.3 Write integration tests for metrics and analytics endpoints
    - Test metrics endpoint with real data
    - Test analytics endpoint with caching
    - Test time window filtering
    - _Requirements: 5.7, 6.1_

- [ ] 17. Implement global error handling
  - [ ] 17.1 Create GlobalExceptionFilter
    - Catch all unhandled exceptions
    - Map exceptions to appropriate HTTP status codes
    - Return structured error responses with descriptive messages
    - Log errors with error ID for tracking
    - Never expose internal implementation details
    - _Requirements: 7.11, 16.1_
  
  - [ ]* 17.2 Write property test for API error messages
    - **Property 22: API Error Messages**
    - **Validates: Requirements 7.11**
  
  - [ ] 17.3 Create custom exception classes
    - FlagNotFoundException (404)
    - DuplicateFlagKeyException (409)
    - ValidationException (400)
    - UnauthorizedException (401)
    - ForbiddenException (403)
    - ServiceUnavailableException (503)
    - _Requirements: 7.11_
  
  - [ ]* 17.4 Write unit tests for exception filter
    - Test each exception type maps to correct status code
    - Test error response format
    - Test error logging
    - _Requirements: 7.11_

- [ ] 18. Add OpenAPI/Swagger documentation
  - [ ] 18.1 Install and configure @nestjs/swagger
    - Add SwaggerModule setup in main.ts
    - Configure API metadata (title, description, version)
    - Set up JWT bearer authentication scheme
    - _Requirements: 7.12_
  
  - [ ] 18.2 Add Swagger decorators to DTOs and controllers
    - Add @ApiProperty to all DTO fields
    - Add @ApiOperation to all endpoints
    - Add @ApiResponse for all status codes
    - Add @ApiBearerAuth for protected endpoints
    - _Requirements: 7.12_
  
  - [ ] 18.3 Generate and verify Swagger UI
    - Access Swagger UI at /api/docs
    - Verify all endpoints are documented
    - Test API calls through Swagger UI
    - _Requirements: 7.12_

- [ ] 19. Checkpoint - Verify API backend
  - Ensure all CRUD endpoints work correctly
  - Verify JWT authentication and RBAC work
  - Verify evaluation endpoint with all strategy types
  - Verify metrics and analytics endpoints return correct data
  - Test error handling for all error scenarios
  - Ensure all tests pass, ask the user if questions arise.


### Phase 4: Web Frontend

- [ ] 20. Set up Next.js application structure
  - [ ] 20.1 Generate Next.js application in monorepo
    - Use NX generator to create Next.js app at `apps/web`
    - Configure App Router (Next.js 14+)
    - Set up TypeScript configuration
    - _Requirements: 9.1_
  
  - [ ] 20.2 Install and configure dependencies
    - Install TailwindCSS and configure
    - Install @tanstack/react-query for data fetching
    - Install axios or fetch wrapper for API calls
    - Install chart library for analytics (e.g., recharts)
    - _Requirements: 9.1, 11.1_
  
  - [ ] 20.3 Create API client service
    - Implement typed API client with all endpoints
    - Add JWT token management (localStorage or cookies)
    - Add request/response interceptors
    - Add error handling
    - _Requirements: 8.5, 9.1_
  
  - [ ] 20.4 Set up React Query configuration
    - Configure QueryClient with defaults
    - Set up query cache and stale time
    - Add global error handling
    - _Requirements: 9.1_

- [ ] 21. Implement authentication flow
  - [ ] 21.1 Create login page at /login
    - Create login form with email and password fields
    - Implement form validation
    - Call authentication API endpoint
    - Store JWT token on successful login
    - Redirect to dashboard after login
    - _Requirements: 8.5, 9.2_
  
  - [ ] 21.2 Create useAuth hook
    - Implement login, logout, and token management
    - Decode JWT to extract user information
    - Provide user context to components
    - Handle token expiration
    - _Requirements: 8.5, 8.6_
  
  - [ ] 21.3 Create ProtectedRoute component
    - Check for valid JWT token
    - Redirect to login if not authenticated
    - Show loading state during authentication check
    - _Requirements: 8.5_
  
  - [ ]* 21.4 Write component tests for authentication flow
    - Test login form submission
    - Test token storage
    - Test protected route redirection
    - _Requirements: 8.5_

- [ ] 22. Create dashboard and flag list
  - [ ] 22.1 Create dashboard page at /dashboard
    - Implement layout with navigation
    - Add header with user info and logout button
    - Add sidebar with navigation links
    - _Requirements: 9.3, 9.4_
  
  - [ ] 22.2 Create FlagList component
    - Fetch flags using useFlags hook with React Query
    - Display flags in table or card layout
    - Show flag key, name, status (enabled/disabled)
    - Add toggle switch for quick enable/disable (admin only)
    - Add delete button (admin only)
    - Add search/filter functionality
    - _Requirements: 9.3, 9.4, 9.5, 9.6_
  
  - [ ] 22.3 Implement useFlags hook
    - Use React Query to fetch flags from API
    - Handle loading and error states
    - Implement pagination
    - Add refetch on window focus
    - _Requirements: 9.3_
  
  - [ ] 22.4 Implement flag toggle functionality
    - Call API to activate/deactivate flag
    - Optimistic UI update
    - Invalidate query cache on success
    - Show error toast on failure
    - _Requirements: 9.5_
  
  - [ ]* 22.5 Write component tests for FlagList
    - Test flag rendering
    - Test toggle functionality
    - Test delete functionality
    - Test search/filter
    - _Requirements: 9.3, 9.5_

- [ ] 23. Create flag creation and editing forms
  - [ ] 23.1 Create flag creation page at /flags/new
    - Add form with fields: key, name, description, enabled
    - Add strategy configuration section
    - Implement form validation (kebab-case for key, required fields)
    - Call API to create flag on submit
    - Redirect to dashboard on success
    - _Requirements: 9.7, 9.8_
  
  - [ ] 23.2 Create FlagForm component
    - Reusable form for create and edit modes
    - Support all flag fields with validation
    - Handle form state with controlled inputs
    - Show validation errors inline
    - _Requirements: 9.7, 9.8_
  
  - [ ] 23.3 Create StrategyConfig component
    - Dropdown to select strategy type
    - Conditional fields based on strategy type:
      - Percentage: slider for rollout percentage (0-100)
      - User-based: textarea for whitelist (comma-separated)
      - Time-based: date/time pickers for start and end
      - Composite: nested strategy builder
    - Validate strategy-specific fields
    - _Requirements: 9.9, 10.1, 10.2, 10.3_
  
  - [ ] 23.4 Create flag detail/edit page at /flags/[key]
    - Fetch flag data by key
    - Pre-populate FlagForm with existing data
    - Call API to update flag on submit
    - Show success/error messages
    - _Requirements: 9.8_
  
  - [ ]* 23.5 Write component tests for flag forms
    - Test form validation
    - Test strategy configuration
    - Test create and update flows
    - _Requirements: 9.7, 9.8, 9.9_

- [ ] 24. Implement analytics dashboard
  - [ ] 24.1 Create analytics page at /analytics/[key]
    - Fetch metrics and analytics data for flag
    - Display key statistics (total evaluations, success rate, unique users)
    - Add time window selector (1h, 24h, 7d, 30d)
    - _Requirements: 11.1, 11.2, 11.3_
  
  - [ ] 24.2 Create MetricsChart component
    - Display time-series data as line chart
    - Show evaluations over time
    - Support different time windows
    - Add tooltips with detailed information
    - _Requirements: 11.4_
  
  - [ ] 24.3 Create AnalyticsDashboard component
    - Display usage statistics cards
    - Show success rate with visual indicator
    - Show unique users count
    - Show trend indicator (increasing/decreasing/stable)
    - _Requirements: 11.2, 11.3_
  
  - [ ] 24.4 Implement useFlagMetrics and useFlagAnalytics hooks
    - Use React Query with 30-second refetch interval
    - Handle loading and error states
    - Cache results appropriately
    - _Requirements: 11.1_
  
  - [ ]* 24.5 Write component tests for analytics components
    - Test chart rendering with mock data
    - Test time window selection
    - Test statistics display
    - _Requirements: 11.1, 11.4_

- [ ] 25. Add responsive design and accessibility
  - [ ] 25.1 Implement responsive layouts with TailwindCSS
    - Mobile-first design approach
    - Breakpoints for tablet and desktop
    - Responsive navigation (hamburger menu on mobile)
    - _Requirements: 9.10_
  
  - [ ] 25.2 Add accessibility features
    - Semantic HTML elements
    - ARIA labels for interactive elements
    - Keyboard navigation support
    - Focus management for modals and forms
    - Color contrast compliance (WCAG AA)
    - _Requirements: 9.11_
  
  - [ ] 25.3 Add loading states and error boundaries
    - Skeleton loaders for data fetching
    - Error boundary component for error handling
    - Toast notifications for user feedback
    - _Requirements: 9.1_
  
  - [ ]* 25.4 Write accessibility tests
    - Test keyboard navigation
    - Test screen reader compatibility
    - Test color contrast
    - _Requirements: 9.11_

- [ ] 26. Implement role-based UI features
  - [ ] 26.1 Create role-based component visibility
    - Hide create/edit/delete buttons for viewer role
    - Show read-only views for viewers
    - Display role indicator in UI
    - _Requirements: 8.7, 9.6_
  
  - [ ] 26.2 Add permission checks in components
    - Use useAuth hook to get user role
    - Conditionally render admin-only features
    - Show appropriate error messages for unauthorized actions
    - _Requirements: 8.7_
  
  - [ ]* 26.3 Write tests for role-based UI
    - Test admin sees all features
    - Test viewer sees read-only features
    - Test unauthorized action handling
    - _Requirements: 8.7_

- [ ] 27. Checkpoint - Verify web frontend
  - Ensure authentication flow works end-to-end
  - Verify flag list displays and updates correctly
  - Verify flag creation and editing forms work
  - Verify analytics dashboard displays correct data
  - Test responsive design on different screen sizes
  - Test accessibility with keyboard navigation
  - Ensure all tests pass, ask the user if questions arise.


### Phase 5: Configuration Management

- [ ] 28. Implement JSON configuration parser
  - [ ] 28.1 Define JSON schema interfaces
    - Create FlagConfigJson interface with all flag properties
    - Create BulkConfigJson interface with version and flags array
    - Add TypeScript types for strategy configurations
    - _Requirements: 14.1, 14.3_
  
  - [ ] 28.2 Implement FlagConfigParser class
    - Implement parse method to convert JSON string to flag objects
    - Implement serialize method to convert flags to JSON string
    - Add JSON.parse error handling with line number extraction
    - Format output JSON with 2-space indentation
    - _Requirements: 14.1, 14.4, 14.5_
  
  - [ ]* 28.3 Write property test for configuration parsing
    - **Property 28: Configuration Parsing**
    - **Validates: Requirements 14.1**
  
  - [ ]* 28.4 Write property test for parse error details
    - **Property 29: Configuration Parse Error Details**
    - **Validates: Requirements 14.2**
  
  - [ ] 28.5 Implement JSON schema validation
    - Validate required fields (key, name, enabled)
    - Validate field types (string, boolean, number)
    - Validate flag key format (kebab-case)
    - Validate rollout percentage bounds (0-100)
    - Validate ISO 8601 timestamps for time-based strategies
    - Return descriptive validation errors with field names
    - _Requirements: 14.3, 16.1_
  
  - [ ]* 28.6 Write property test for configuration schema validation
    - **Property 30: Configuration Schema Validation**
    - **Validates: Requirements 14.3**
  
  - [ ]* 28.7 Write property test for configuration serialization round-trip
    - **Property 31: Configuration Serialization Round-Trip**
    - **Validates: Requirements 14.4, 14.5, 14.8**

- [ ] 29. Implement bulk import/export API endpoints
  - [ ] 29.1 Implement POST /api/feature-flags/import (bulk import)
    - Add @Post('import') decorator
    - Add @UseGuards(RolesGuard), @Roles('admin')
    - Accept JSON file or JSON string in request body
    - Parse configuration using FlagConfigParser
    - Validate all flags before importing
    - Create flags in transaction (all or nothing)
    - Return summary: { imported: number, failed: number, errors: [] }
    - _Requirements: 14.6, 14.9_
  
  - [ ]* 29.2 Write property test for bulk import completeness
    - **Property 32: Bulk Import Completeness**
    - **Validates: Requirements 14.6**
  
  - [ ] 29.3 Implement GET /api/feature-flags/export (bulk export)
    - Add @Get('export') decorator
    - Fetch all flags from database
    - Serialize to JSON using FlagConfigParser
    - Return JSON response with Content-Disposition header
    - Support query parameter for filtering by keys
    - _Requirements: 14.7_
  
  - [ ]* 29.4 Write property test for bulk export completeness
    - **Property 33: Bulk Export Completeness**
    - **Validates: Requirements 14.7**
  
  - [ ]* 29.5 Write integration tests for import/export
    - Test import with valid configuration
    - Test import with invalid configuration
    - Test export and re-import round-trip
    - Test transaction rollback on partial failure
    - _Requirements: 14.6, 14.7, 14.9_

- [ ] 30. Create CLI tool for configuration management
  - [ ] 30.1 Create CLI application structure
    - Generate Node.js CLI app in monorepo
    - Install commander.js for CLI framework
    - Set up TypeScript compilation
    - Add shebang for executable
    - _Requirements: 14.10_
  
  - [ ] 30.2 Implement 'import' command
    - Add command: `fflags import <file>`
    - Read JSON file from filesystem
    - Call import API endpoint with authentication
    - Display progress and results
    - Handle errors gracefully
    - _Requirements: 14.10_
  
  - [ ] 30.3 Implement 'export' command
    - Add command: `fflags export <output-file>`
    - Call export API endpoint with authentication
    - Write JSON to filesystem
    - Display success message
    - Handle errors gracefully
    - _Requirements: 14.10_
  
  - [ ] 30.4 Implement 'validate' command
    - Add command: `fflags validate <file>`
    - Read JSON file from filesystem
    - Validate using FlagConfigParser (no API call)
    - Display validation results
    - Exit with appropriate status code
    - _Requirements: 14.10_
  
  - [ ] 30.5 Add CLI configuration file support
    - Support .fflagsrc.json for API URL and credentials
    - Support environment variables for configuration
    - Add --api-url and --token CLI flags
    - _Requirements: 14.10_
  
  - [ ]* 30.6 Write integration tests for CLI commands
    - Test import command with valid file
    - Test export command
    - Test validate command with invalid file
    - Test error handling
    - _Requirements: 14.10_

- [ ] 31. Add configuration management UI in frontend
  - [ ] 31.1 Create import page at /config/import
    - Add file upload component
    - Add JSON text area for paste
    - Show validation results before import
    - Display import progress and results
    - _Requirements: 14.11_
  
  - [ ] 31.2 Create export functionality in dashboard
    - Add "Export All" button in dashboard
    - Add "Export Selected" for multi-select
    - Trigger file download with JSON content
    - Show success notification
    - _Requirements: 14.11_
  
  - [ ] 31.3 Add configuration preview component
    - Display parsed configuration in readable format
    - Show validation errors with highlighting
    - Allow editing before import
    - _Requirements: 14.11_
  
  - [ ]* 31.4 Write component tests for configuration UI
    - Test file upload and parsing
    - Test validation error display
    - Test export functionality
    - _Requirements: 14.11_

- [ ] 32. Checkpoint - Verify configuration management
  - Ensure JSON parser handles valid and invalid configurations
  - Verify bulk import creates all flags correctly
  - Verify bulk export produces valid JSON
  - Test CLI tool commands work end-to-end
  - Test configuration UI in frontend
  - Ensure all tests pass, ask the user if questions arise.


### Phase 6: Observability

- [ ] 33. Implement structured logging
  - [ ] 33.1 Configure logging library (Winston or Pino)
    - Install and configure logging library
    - Set up log levels (debug, info, warn, error, fatal)
    - Configure log format (JSON for production, pretty for development)
    - Add timestamp and context to all logs
    - _Requirements: 15.1_
  
  - [ ] 33.2 Create logging service with context
    - Implement logger wrapper with contextual information
    - Add request ID tracking for request tracing
    - Add user ID and flag key to log context
    - Implement log sanitization (remove sensitive data)
    - _Requirements: 15.1, 15.2_
  
  - [ ] 33.3 Add logging to all critical operations
    - Log flag creation, updates, deletions
    - Log evaluation requests with context
    - Log authentication attempts (success and failure)
    - Log authorization failures
    - Log errors with stack traces and error IDs
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ] 33.4 Configure log output destinations
    - Console output for development
    - File output for production (with rotation)
    - Optional integration with log aggregation service
    - _Requirements: 15.1_
  
  - [ ]* 33.5 Write unit tests for logging service
    - Test log formatting
    - Test context injection
    - Test sensitive data sanitization
    - _Requirements: 15.1, 15.2_

- [ ] 34. Implement Prometheus metrics
  - [ ] 34.1 Install and configure Prometheus client
    - Install prom-client library
    - Create metrics registry
    - Set up default metrics (CPU, memory, event loop)
    - _Requirements: 15.4_
  
  - [ ] 34.2 Define custom application metrics
    - Counter: total_flag_evaluations (labels: flag_key, result)
    - Counter: total_api_requests (labels: method, endpoint, status_code)
    - Histogram: api_request_duration_seconds (labels: method, endpoint)
    - Gauge: active_flags_count
    - Gauge: total_flags_count
    - Counter: cache_hits and cache_misses (labels: cache_type)
    - _Requirements: 15.4, 15.5, 15.6_
  
  - [ ] 34.3 Implement metrics collection middleware
    - Intercept all HTTP requests
    - Record request duration
    - Increment request counters
    - Update metrics on response
    - _Requirements: 15.5_
  
  - [ ] 34.4 Add metrics to evaluation flow
    - Increment evaluation counter on each evaluation
    - Record cache hit/miss metrics
    - Track evaluation duration
    - _Requirements: 15.6_
  
  - [ ] 34.5 Implement GET /metrics endpoint
    - Add @Get('metrics') in dedicated controller
    - Return Prometheus-formatted metrics
    - No authentication required (internal endpoint)
    - _Requirements: 15.4_
  
  - [ ]* 34.6 Write integration tests for metrics endpoint
    - Test metrics format
    - Test metric values after operations
    - Test custom metrics registration
    - _Requirements: 15.4_

- [ ] 35. Set up performance monitoring
  - [ ] 35.1 Add request timing middleware
    - Measure total request processing time
    - Log slow requests (> 500ms)
    - Add timing headers to responses
    - _Requirements: 15.7_
  
  - [ ] 35.2 Implement database query performance tracking
    - Log slow queries (> 100ms)
    - Track query count per request
    - Add query timing to metrics
    - _Requirements: 15.7_
  
  - [ ] 35.3 Add cache performance monitoring
    - Track cache hit rate
    - Monitor cache size and memory usage
    - Log cache evictions
    - _Requirements: 15.8_
  
  - [ ]* 35.4 Write performance tests
    - Load test evaluation endpoint (1000 req/s)
    - Measure p50, p95, p99 latencies
    - Verify performance meets requirements
    - _Requirements: 15.7_

- [ ] 36. Implement error tracking and alerting
  - [ ] 36.1 Set up error tracking integration (optional)
    - Configure Sentry or similar service (if available)
    - Capture unhandled exceptions
    - Add context to error reports
    - Group similar errors
    - _Requirements: 15.3_
  
  - [ ] 36.2 Define alerting rules
    - Alert on API error rate > 1%
    - Alert on API response time p95 > 500ms
    - Alert on database connection failures
    - Alert on Redis unavailability
    - Alert on disk space > 80%
    - _Requirements: 15.9_
  
  - [ ] 36.3 Create alerting configuration file
    - Document alerting rules in YAML or JSON
    - Include thresholds and notification channels
    - Add runbook links for common issues
    - _Requirements: 15.9_

- [ ] 37. Create monitoring dashboards
  - [ ] 37.1 Create Grafana dashboard configuration (optional)
    - System health overview panel
    - API performance metrics (latency, throughput)
    - Flag usage statistics
    - Error rate and types
    - Cache performance metrics
    - _Requirements: 15.10_
  
  - [ ] 37.2 Document monitoring setup
    - Create MONITORING.md with setup instructions
    - Document key metrics and their meanings
    - Add troubleshooting guide
    - Include example Prometheus queries
    - _Requirements: 15.10_

- [ ] 38. Checkpoint - Verify observability
  - Ensure structured logging works across all components
  - Verify Prometheus metrics are collected and exposed
  - Test performance monitoring captures slow requests
  - Verify error tracking captures exceptions
  - Review monitoring dashboard (if implemented)
  - Ensure all tests pass, ask the user if questions arise.


### Phase 7: Integration and Documentation

- [ ] 39. End-to-end integration testing
  - [ ] 39.1 Create E2E test suite with complete workflows
    - Test complete flag lifecycle: create → evaluate → update → delete
    - Test authentication and authorization flows
    - Test metrics collection and analytics generation
    - Test bulk import/export round-trip
    - Test error scenarios and recovery
    - _Requirements: All requirements_
  
  - [ ] 39.2 Set up E2E test environment
    - Use Docker Compose for isolated test environment
    - Seed test data for consistent tests
    - Clean up data after each test
    - _Requirements: Testing infrastructure_
  
  - [ ]* 39.3 Run all E2E tests and verify passing
    - Execute complete E2E test suite
    - Verify all scenarios pass
    - Fix any integration issues
    - _Requirements: All requirements_

- [ ] 40. Performance and load testing
  - [ ] 40.1 Create load test scenarios
    - Test evaluation endpoint under load (target: 1000 req/s)
    - Test concurrent flag updates
    - Test analytics queries with large datasets
    - Measure database and Redis performance
    - _Requirements: 15.7, Performance requirements_
  
  - [ ] 40.2 Run load tests and optimize bottlenecks
    - Execute load tests with realistic data volumes
    - Identify performance bottlenecks
    - Optimize slow queries and operations
    - Verify performance meets requirements
    - _Requirements: 15.7_
  
  - [ ]* 40.3 Document performance benchmarks
    - Record baseline performance metrics
    - Document optimization techniques applied
    - Create performance regression test suite
    - _Requirements: 15.7_

- [ ] 41. Security hardening
  - [ ] 41.1 Implement rate limiting
    - Add rate limiting middleware to API
    - Configure limits per endpoint (e.g., 100 req/min)
    - Return 429 Too Many Requests when exceeded
    - _Requirements: Security requirements_
  
  - [ ] 41.2 Add input sanitization
    - Sanitize all user inputs to prevent injection attacks
    - Validate and escape special characters
    - Use parameterized queries for database operations
    - _Requirements: 16.1, Security requirements_
  
  - [ ] 41.3 Configure CORS and security headers
    - Set up CORS with allowed origins
    - Add security headers (Helmet.js)
    - Configure CSP (Content Security Policy)
    - _Requirements: Security requirements_
  
  - [ ] 41.4 Review and secure environment variables
    - Ensure no secrets in version control
    - Use .env.example for documentation
    - Validate required environment variables on startup
    - _Requirements: Security requirements_
  
  - [ ]* 41.5 Perform security audit
    - Run npm audit and fix vulnerabilities
    - Review authentication and authorization logic
    - Test for common security issues (OWASP Top 10)
    - _Requirements: Security requirements_

- [ ] 42. Create comprehensive documentation
  - [ ] 42.1 Create README.md with project overview
    - Project description and features
    - Architecture overview diagram
    - Technology stack
    - Quick start guide
    - _Requirements: Documentation_
  
  - [ ] 42.2 Create SETUP.md with installation instructions
    - Prerequisites (Node.js, Docker, etc.)
    - Step-by-step setup instructions
    - Environment variable configuration
    - Database migration steps
    - _Requirements: Documentation_
  
  - [ ] 42.3 Create API.md with API documentation
    - All endpoints with request/response examples
    - Authentication and authorization details
    - Error codes and messages
    - Rate limiting information
    - Link to Swagger UI
    - _Requirements: 7.12, Documentation_
  
  - [ ] 42.4 Create DEVELOPMENT.md with developer guide
    - Project structure explanation
    - Development workflow
    - Testing strategy and commands
    - Code style and conventions
    - Contribution guidelines
    - _Requirements: Documentation_
  
  - [ ] 42.5 Create DEPLOYMENT.md with deployment guide
    - Environment setup (dev, staging, production)
    - Docker deployment instructions
    - Kubernetes deployment (if applicable)
    - Monitoring and alerting setup
    - Backup and recovery procedures
    - _Requirements: Documentation_
  
  - [ ] 42.6 Create ARCHITECTURE.md with technical details
    - Detailed architecture diagrams
    - Component interaction flows
    - Database schema documentation
    - Design decisions and rationale
    - _Requirements: Documentation_

- [ ] 43. Final verification and cleanup
  - [ ] 43.1 Run complete test suite
    - Execute all unit tests
    - Execute all property-based tests
    - Execute all integration tests
    - Execute all E2E tests
    - Verify 80%+ code coverage
    - _Requirements: Testing requirements_
  
  - [ ] 43.2 Verify all requirements are met
    - Review requirements document
    - Check each requirement has corresponding implementation
    - Verify all acceptance criteria are satisfied
    - _Requirements: All requirements_
  
  - [ ] 43.3 Code quality review
    - Run linter and fix issues
    - Run formatter (Prettier)
    - Remove unused code and dependencies
    - Add missing code comments
    - _Requirements: Code quality_
  
  - [ ] 43.4 Update package.json scripts
    - Add convenient npm scripts for common tasks
    - Document all available scripts
    - Test all scripts work correctly
    - _Requirements: Developer experience_
  
  - [ ] 43.5 Create release notes
    - Document all features implemented
    - List known limitations
    - Add migration guide (if applicable)
    - Include changelog
    - _Requirements: Documentation_

- [ ] 44. Final checkpoint - System ready for deployment
  - All tests pass (unit, property, integration, E2E)
  - Code coverage meets 80% threshold
  - All documentation is complete and accurate
  - Security audit completed with no critical issues
  - Performance benchmarks meet requirements
  - Docker containers build and run successfully
  - System is ready for production deployment
  - Ensure all tests pass, ask the user if questions arise.

## Notes

### Tasks Marked with `*` (Optional)

Tasks marked with `*` are optional and can be skipped for faster MVP delivery. These include:
- Property-based tests (though highly recommended for correctness)
- Unit tests for specific edge cases
- Integration tests for non-critical paths
- Performance tests beyond basic validation
- Optional monitoring integrations (Sentry, Grafana)

### Requirements Traceability

Each task references specific requirements from the requirements document using the format `_Requirements: X.Y_`. This ensures full traceability from requirements to implementation.

### Property-Based Tests

37 correctness properties are defined in the design document. Each property has a corresponding test task that validates universal behaviors across multiple generated inputs using fast-check.

### Checkpoints

Checkpoints are included at the end of each phase to ensure incremental validation. At each checkpoint:
1. Verify all phase deliverables are complete
2. Run all tests and ensure they pass
3. Manually test key functionality
4. Ask the user if any questions or issues arise before proceeding

### Implementation Order

Tasks are ordered to:
1. Build foundation first (infrastructure, core libraries)
2. Implement domain logic before API layer
3. Build API before frontend
4. Add configuration management after core features
5. Add observability throughout but finalize at end
6. Perform integration and documentation last

### Testing Strategy

The system uses a dual testing approach:
- **Unit Tests**: For specific examples, edge cases, and concrete scenarios
- **Property-Based Tests**: For universal properties that should hold across all inputs

This combination provides comprehensive coverage and catches both specific bugs and general correctness issues.

### Estimated Timeline

- Phase 1 (Foundation): 1-2 weeks
- Phase 2 (Core Domain): 2 weeks
- Phase 3 (API Backend): 2 weeks
- Phase 4 (Web Frontend): 2 weeks
- Phase 5 (Configuration): 1 week
- Phase 6 (Observability): 1 week
- Phase 7 (Integration): 1 week

**Total: ~10 weeks** for complete implementation with all optional tasks.

For MVP (skipping optional tasks): ~6-7 weeks.

