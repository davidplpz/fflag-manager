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
