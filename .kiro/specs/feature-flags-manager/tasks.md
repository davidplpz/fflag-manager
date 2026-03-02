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

- [ ] 4. Set up Docker infrastructure
  - [ ] 4.1 Create Docker Compose configuration
    - Define PostgreSQL 15+ service with persistent volume
    - Define Redis 7+ service with persistent volume
    - Configure network and port mappings
    - Add health checks for both services
    - _Requirements: 4.1, 4.2_
  
  - [ ] 4.2 Create database initialization scripts
    - Set up fflags-lib schema (if migrations needed)
    - Create extensions table for metrics and analytics
    - Add indexes for performance optimization
    - _Requirements: 4.1, 5.3_
  
  - [ ] 4.3 Configure Redis for caching
    - Set up Redis connection with authentication
    - Configure TTL defaults for different cache types
    - Implement cache key patterns
    - _Requirements: 4.2, 4.5_

- [ ] 5. Create NestJS API application structure
  - [ ] 5.1 Generate NestJS application in monorepo
    - Run `nx g @nx/nest:application api --directory=apps`
    - Configure application module with global pipes and filters
    - Set up environment configuration with @nestjs/config
    - _Requirements: 7.1_
  
  - [ ] 5.2 Implement health check endpoint
    - Create HealthController with GET /health endpoint
    - Check PostgreSQL connection status
    - Check Redis connection status
    - Return structured health response with status codes
    - _Requirements: 7.10_
  
  - [ ] 5.3 Write integration tests for health check
    - Test healthy state (all services up)
    - Test unhealthy state (database down)
    - Test unhealthy state (Redis down)
    - _Requirements: 7.10_

- [ ] 6. Checkpoint - Verify foundation setup
  - Ensure Docker containers start successfully
  - Verify fflags-lib connects to PostgreSQL and Redis
  - Verify health check endpoint returns 200 OK
  - Ensure all tests pass, ask the user if questions arise.


### Phase 2: Core Domain Extensions

- [ ] 7. Create domain value objects
  - [ ] 7.1 Implement FlagKey value object
    - Add validation for kebab-case format (regex: ^[a-z0-9]+(?:-[a-z0-9]+)*$)
    - Add length validation (max 255 characters)
    - Implement equals and toString methods
    - _Requirements: 1.9, 16.4_
  
  - [ ] 7.2 Write property test for FlagKey validation
    - **Property 6: Kebab-Case Validation**
    - **Validates: Requirements 1.9, 16.4**
  
  - [ ] 7.3 Implement RolloutPercentage value object
    - Add validation for range 0-100
    - Add validation for integer values only
    - Implement isFullRollout and isNoRollout helper methods
    - _Requirements: 2.2, 16.5_
  
  - [ ] 7.4 Write property test for RolloutPercentage bounds validation
    - **Property 35: Rollout Percentage Bounds**
    - **Validates: Requirements 16.5**
  
  - [ ] 7.5 Implement TimeWindow value object
    - Add validation for start < end
    - Add validation for end not in future
    - Implement contains and getDurationInHours methods
    - Implement static fromPreset factory for '1h', '24h', '7d', '30d'
    - _Requirements: 2.4, 5.4, 6.5_
  
  - [ ] 7.6 Write unit tests for TimeWindow value object
    - Test validation rules
    - Test preset factory method
    - Test contains method with various timestamps
    - _Requirements: 2.4, 5.4_

- [ ] 8. Implement advanced strategy evaluator
  - [ ] 8.1 Create Strategy interfaces and types
    - Define PercentageStrategy, UserBasedStrategy, TimeBasedStrategy interfaces
    - Define CompositeStrategy with AND/OR operators
    - Create EvaluationContext interface
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.8_
  
  - [ ] 8.2 Implement PercentageStrategy evaluator with consistent hashing
    - Use SHA-256 hash of userId for deterministic bucket assignment
    - Ensure same user always gets same result for same percentage
    - Handle edge cases (0%, 100%, missing userId)
    - _Requirements: 2.2, 2.5_
  
  - [ ] 8.3 Write property test for percentage strategy consistency
    - **Property 8: Percentage Strategy Consistency**
    - **Validates: Requirements 2.2, 2.5**
  
  - [ ] 8.4 Implement UserBasedStrategy evaluator
    - Check if userId exists in whitelist
    - Return enabled for whitelisted users, disabled otherwise
    - Handle missing userId gracefully
    - _Requirements: 2.3, 2.6_
  
  - [ ] 8.5 Write property test for user whitelist evaluation
    - **Property 9: User Whitelist Evaluation**
    - **Validates: Requirements 2.3, 2.6**
  
  - [ ] 8.6 Implement TimeBasedStrategy evaluator
    - Check if current timestamp is within [startTime, endTime] window
    - Handle timezone considerations
    - Validate ISO 8601 timestamp format
    - _Requirements: 2.4, 2.7, 16.6_
  
  - [ ] 8.7 Write property test for time window evaluation
    - **Property 10: Time Window Evaluation**
    - **Validates: Requirements 2.4, 2.7**
  
  - [ ] 8.8 Write property test for ISO 8601 timestamp validation
    - **Property 36: ISO 8601 Timestamp Validation**
    - **Validates: Requirements 16.6**
  
  - [ ] 8.9 Implement CompositeStrategy evaluator
    - Support AND operator (all sub-strategies must be enabled)
    - Support OR operator (at least one sub-strategy must be enabled)
    - Handle nested composite strategies recursively
    - _Requirements: 2.8_
  
  - [ ] 8.10 Write property test for composite strategy logic
    - **Property 11: Composite Strategy Logic**
    - **Validates: Requirements 2.8**
  
  - [ ] 8.11 Implement main StrategyEvaluator with exception handling
    - Integrate all strategy types
    - Add try-catch for evaluation errors
    - Return false on exception (fail-safe)
    - Log errors without crashing
    - _Requirements: 3.1, 3.2, 16.7_
  
  - [ ] 8.12 Write property test for evaluation exception handling
    - **Property 37: Evaluation Exception Handling**
    - **Validates: Requirements 16.7**

- [ ] 9. Build metrics collection system
  - [ ] 9.1 Create MetricEvent entity
    - Define properties: id, flagKey, result, userId, context, timestamp
    - Add validation for flagKey format
    - Implement constructor with validation
    - _Requirements: 3.5, 5.1, 5.2_
  
  - [ ] 9.2 Create metrics_events database table
    - Define schema with columns: id, flag_key, result, user_id, context (JSONB), timestamp
    - Add foreign key to feature_flags table
    - Create indexes on flag_key, timestamp, and composite (flag_key, timestamp)
    - _Requirements: 5.3_
  
  - [ ] 9.3 Implement MetricsCollector service with batching
    - Implement in-memory buffer for events (max 100 events)
    - Implement time-based flush (every 10 seconds)
    - Implement async persistence to PostgreSQL
    - Add retry logic with exponential backoff (3 attempts)
    - _Requirements: 5.1, 5.2, 5.5, 5.6_
  
  - [ ] 9.4 Implement circuit breaker for database failures
    - Track failure count and last failure time
    - Open circuit after 5 consecutive failures
    - Attempt reset after 60 seconds
    - _Requirements: 5.6, 16.2_
  
  - [ ] 9.5 Write property test for evaluation generates metric event
    - **Property 13: Evaluation Generates Metric Event**
    - **Validates: Requirements 3.5, 5.1, 5.2**
  
  - [ ] 9.6 Write integration tests for metrics persistence
    - Test batch insertion to PostgreSQL
    - Test retry logic on failure
    - Test circuit breaker behavior
    - _Requirements: 5.5, 5.6_

- [ ] 10. Create analytics engine
  - [ ] 10.1 Create AnalyticsAggregate entity
    - Define properties: id, flagKey, timeWindow, windowStart, windowEnd, totalEvaluations, enabledCount, disabledCount, uniqueUsers
    - Implement computed properties: enabledRatio, successRate
    - _Requirements: 5.7, 5.8, 6.1, 6.2, 6.3_
  
  - [ ] 10.2 Create analytics_aggregates database table
    - Define schema with pre-aggregated data columns
    - Add unique constraint on (flag_key, time_window, window_start)
    - Create index on (flag_key, time_window, window_start)
    - _Requirements: 6.1_
  
  - [ ] 10.3 Implement AnalyticsEngine service
    - Implement calculateUsageStats method with aggregation queries
    - Implement findUnusedFlags method (zero evaluations in N days)
    - Implement generateTimeSeries method with time-based grouping
    - Implement exportAnalytics method (JSON format)
    - _Requirements: 5.7, 5.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.8_
  
  - [ ] 10.4 Write property test for metrics aggregation accuracy
    - **Property 15: Metrics Aggregation Accuracy**
    - **Validates: Requirements 5.7, 6.1**
  
  - [ ] 10.5 Write property test for success rate calculation
    - **Property 16: Success Rate Calculation**
    - **Validates: Requirements 5.8, 6.3**
  
  - [ ] 10.6 Write property test for unique user counting
    - **Property 17: Unique User Counting**
    - **Validates: Requirements 6.2**
  
  - [ ] 10.7 Write property test for unused flag detection
    - **Property 18: Unused Flag Detection**
    - **Validates: Requirements 6.4**
  
  - [ ] 10.8 Write property test for time series data grouping
    - **Property 19: Time Series Data Grouping**
    - **Validates: Requirements 6.5**
  
  - [ ] 10.9 Write property test for analytics export round-trip
    - **Property 20: Analytics Export Round-Trip**
    - **Validates: Requirements 6.8**
  
  - [ ] 10.10 Implement Redis caching for analytics results
    - Cache analytics results with 60-second TTL
    - Use cache key pattern: `analytics:{flagKey}:{window}`
    - Invalidate cache on flag updates
    - _Requirements: 4.5, 6.6_
  
  - [ ] 10.11 Write integration tests for analytics engine
    - Test aggregation queries with real data
    - Test caching behavior
    - Test cache invalidation
    - _Requirements: 6.1, 6.6_

- [ ] 11. Checkpoint - Verify core domain extensions
  - Ensure all value objects validate correctly
  - Verify strategy evaluator works for all strategy types
  - Verify metrics collection batches and persists events
  - Verify analytics engine calculates correct statistics
  - Ensure all tests pass, ask the user if questions arise.


### Phase 3: API Backend

- [ ] 12. Create DTOs with validation
  - [ ] 12.1 Create CreateFlagDto with class-validator decorators
    - Add @IsString, @Matches for key (kebab-case regex)
    - Add @IsString for name
    - Add @IsOptional, @IsString for description
    - Add @IsBoolean for enabled
    - Add @IsOptional for strategy
    - _Requirements: 1.3, 1.9, 7.9, 16.1_
  
  - [ ] 12.2 Create UpdateFlagDto with partial validation
    - Make all fields optional except key
    - Reuse validation decorators from CreateFlagDto
    - _Requirements: 1.5, 7.9_
  
  - [ ] 12.3 Create StrategyDto with nested validation
    - Add @IsEnum for type field
    - Add @IsOptional, @Min(0), @Max(100) for rolloutPercentage
    - Add @IsOptional for whitelist array
    - Add @IsOptional for startTime and endTime (ISO 8601 strings)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 16.5, 16.6_
  
  - [ ] 12.4 Create PaginationDto with defaults
    - Add @IsOptional, @Min(1) for page (default: 1)
    - Add @IsOptional, @Min(1), @Max(100) for limit (default: 10)
    - _Requirements: 1.8, 7.4_
  
  - [ ] 12.5 Create EvaluationContextDto
    - Add @IsOptional for userId
    - Add @IsOptional for attributes object
    - Add @IsOptional for timestamp
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 12.6 Write property test for API input validation
    - **Property 21: API Input Validation**
    - **Validates: Requirements 7.9, 16.1**

- [ ] 13. Implement JWT authentication guards
  - [ ] 13.1 Create JwtAuthGuard using @nestjs/jwt
    - Implement CanActivate interface
    - Extract and verify JWT token from Authorization header
    - Attach decoded user to request object
    - Return 401 for missing or invalid tokens
    - _Requirements: 8.1, 8.2, 8.3_
  
  - [ ]* 13.2 Write property test for JWT authentication required
    - **Property 23: JWT Authentication Required**
    - **Validates: Requirements 8.1, 8.2**
  
  - [ ]* 13.3 Write property test for JWT token validation
    - **Property 24: JWT Token Validation**
    - **Validates: Requirements 8.3**
  
  - [ ]* 13.4 Write property test for JWT user context extraction
    - **Property 25: JWT User Context Extraction**
    - **Validates: Requirements 8.4**
  
  - [ ] 13.2 Create RolesGuard for RBAC
    - Implement CanActivate interface
    - Check user role from JWT payload
    - Compare against required roles from @Roles decorator
    - Return 403 for insufficient permissions
    - _Requirements: 8.7, 8.8, 8.9_
  
  - [ ]* 13.3 Write property test for role-based access control
    - **Property 26: Role-Based Access Control**
    - **Validates: Requirements 8.7, 8.8, 8.9**
  
  - [ ] 13.4 Create @Roles decorator
    - Custom decorator to specify required roles
    - Store metadata for RolesGuard to read
    - _Requirements: 8.7_

- [ ] 14. Implement Feature Flags CRUD endpoints
  - [ ] 14.1 Create FeatureFlagsController
    - Add @Controller('api/feature-flags') decorator
    - Add @UseGuards(JwtAuthGuard) at controller level
    - Inject FlagManager service and MetricsCollector
    - _Requirements: 7.1, 8.1_
  
  - [ ] 14.2 Implement POST /api/feature-flags (create flag)
    - Add @Post() decorator
    - Add @UseGuards(RolesGuard), @Roles('admin')
    - Validate CreateFlagDto with ValidationPipe
    - Call fflags-lib wrapper to create flag
    - Return 201 Created with flag data
    - Return 400 for validation errors
    - Return 409 for duplicate key
    - _Requirements: 1.3, 1.4, 7.1, 7.9, 8.7_
  
  - [ ]* 14.3 Write property test for flag creation round-trip
    - **Property 1: Flag Creation Round-Trip**
    - **Validates: Requirements 1.3, 1.7, 4.1**
  
  - [ ]* 14.4 Write property test for duplicate key rejection
    - **Property 2: Duplicate Key Rejection**
    - **Validates: Requirements 1.4**
  
  - [ ] 14.5 Implement GET /api/feature-flags/:key (get single flag)
    - Add @Get(':key') decorator
    - Call fflags-lib wrapper to retrieve flag
    - Return 200 OK with flag data
    - Return 404 if flag not found
    - _Requirements: 1.7, 7.2_
  
  - [ ] 14.6 Implement GET /api/feature-flags (list all flags)
    - Add @Get() decorator
    - Accept PaginationDto query parameters
    - Call fflags-lib wrapper with pagination
    - Return 200 OK with paginated response
    - _Requirements: 1.8, 7.3, 7.4_
  
  - [ ]* 14.7 Write property test for pagination completeness
    - **Property 5: Pagination Completeness**
    - **Validates: Requirements 1.8**
  
  - [ ] 14.8 Implement PUT /api/feature-flags/:key (update flag)
    - Add @Put(':key') decorator
    - Add @UseGuards(RolesGuard), @Roles('admin')
    - Validate UpdateFlagDto with ValidationPipe
    - Call fflags-lib wrapper to update flag
    - Invalidate Redis cache for this flag
    - Return 200 OK with updated flag data
    - Return 404 if flag not found
    - _Requirements: 1.5, 4.3, 7.5, 8.7_
  
  - [ ]* 14.9 Write property test for flag state transitions
    - **Property 3: Flag State Transitions**
    - **Validates: Requirements 1.5**
  
  - [ ]* 14.10 Write property test for cache invalidation on update
    - **Property 14: Cache Invalidation on Update**
    - **Validates: Requirements 4.3**
  
  - [ ] 14.11 Implement DELETE /api/feature-flags/:key (delete flag)
    - Add @Delete(':key') decorator
    - Add @UseGuards(RolesGuard), @Roles('admin')
    - Call fflags-lib wrapper to delete flag
    - Return 204 No Content on success
    - Return 404 if flag not found
    - _Requirements: 1.6, 7.6, 8.7_
  
  - [ ]* 14.12 Write property test for flag deletion
    - **Property 4: Flag Deletion**
    - **Validates: Requirements 1.6, 4.4**
  
  - [ ]* 14.13 Write property test for timestamp metadata
    - **Property 7: Timestamp Metadata**
    - **Validates: Requirements 1.10**

- [ ] 15. Implement flag evaluation endpoint
  - [ ] 15.1 Implement POST /api/feature-flags/:key/evaluate
    - Add @Post(':key/evaluate') decorator
    - Accept EvaluationContextDto in request body
    - Retrieve flag from fflags-lib (with Redis cache)
    - Apply strategy evaluation using StrategyEvaluator
    - Record evaluation event with MetricsCollector
    - Return 200 OK with { enabled: boolean }
    - Return false for non-existent flags (fail-safe)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 7.7_
  
  - [ ]* 15.2 Write property test for non-existent flag default
    - **Property 12: Non-Existent Flag Default**
    - **Validates: Requirements 3.3**
  
  - [ ]* 15.3 Write property test for evaluation counter increment
    - **Property 34: Evaluation Counter Increment**
    - **Validates: Requirements 15.9**
  
  - [ ] 15.4 Implement graceful degradation for Redis failures
    - Add try-catch around Redis cache access
    - Fall back to direct database query if Redis unavailable
    - Log warning for Redis failures
    - _Requirements: 4.7, 16.3_
  
  - [ ]* 15.5 Write integration test for Redis fallback behavior
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

