-- Combined base schema from fflags-lib and extensions for metrics/analytics
-- Requirement 4.1: Persistencia en PostgreSQL
-- Requirement 5.3: Persistencia de Metric_Events

-- Base table for feature flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id VARCHAR(255) PRIMARY KEY, -- This corresponds to the flag_key
    name VARCHAR(255),           -- Added as extension over fflags-lib
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for tracking evaluations (Metrics_Collector extension)
CREATE TABLE IF NOT EXISTS metric_events (
    id SERIAL PRIMARY KEY,
    flag_key VARCHAR(255) NOT NULL,
    result BOOLEAN NOT NULL,
    user_id VARCHAR(255),
    context JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance (Requirement 4.2.3)
CREATE INDEX IF NOT EXISTS idx_feature_flags_is_active ON feature_flags(is_active);
CREATE INDEX IF NOT EXISTS idx_metric_events_flag_key ON metric_events(flag_key);
CREATE INDEX IF NOT EXISTS idx_metric_events_timestamp ON metric_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_metric_events_flag_timestamp ON metric_events(flag_key, timestamp);
