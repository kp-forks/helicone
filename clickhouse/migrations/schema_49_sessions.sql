CREATE TABLE session_rmt
(
    `session_id` String DEFAULT '',
    `session_name` String DEFAULT '',
    `response_id` Nullable(UUID),
    `response_created_at` Nullable(DateTime64(3)),
    `latency` Nullable(Int64),
    `status` Int64,
    `completion_tokens` Nullable(Int64),
    `completion_audio_tokens` Int64 DEFAULT 0,
    `cache_reference_id` UUID,
    `prompt_tokens` Nullable(Int64),
    `prompt_cache_write_tokens` Int64 DEFAULT 0,
    `prompt_cache_read_tokens` Int64 DEFAULT 0,
    `prompt_audio_tokens` Int64 DEFAULT 0,
    `model` LowCardinality(String) CODEC(ZSTD(1)),
    `request_id` UUID,
    `request_created_at` DateTime64(3),
    `user_id` LowCardinality(String) CODEC(ZSTD(1)),
    `organization_id` UUID,
    `proxy_key_id` Nullable(UUID),
    `threat` Nullable(Bool),
    `time_to_first_token` Nullable(Int64),
    `provider` LowCardinality(String) CODEC(ZSTD(1)),
    `target_url` Nullable(String),
    `country_code` Nullable(String),
    `cache_enabled` Bool DEFAULT false,
    `properties` Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    `scores` Map(LowCardinality(String), Int64) CODEC(ZSTD(1)),
    `request_body` String DEFAULT '' TTL toDateTime(request_created_at) + toIntervalMonth(3),
    `response_body` String DEFAULT '' TTL toDateTime(request_created_at) + toIntervalMonth(3),
    `assets` Array(String) CODEC(ZSTD(1)),
    `updated_at` DateTime64(3, 'UTC') DEFAULT now(),
    INDEX idx_properties_key mapKeys(properties) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_properties_value mapValues(properties) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_scores_key mapKeys(scores) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_scores_value mapValues(scores) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_request_body_bloom request_body TYPE ngrambf_v1(4, 1024, 1, 0) GRANULARITY 1,
    INDEX idx_response_body_bloom response_body TYPE ngrambf_v1(4, 1024, 1, 0) GRANULARITY 1
)
ENGINE = ReplacingMergeTree(updated_at)
PARTITION BY toYYYYMM(request_created_at)
PRIMARY KEY (organization_id, session_name, session_id, request_id)
ORDER BY (organization_id, session_name, session_id, request_id)
SETTINGS index_granularity = 8192