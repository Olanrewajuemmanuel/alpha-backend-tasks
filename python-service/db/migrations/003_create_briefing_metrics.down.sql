-- Drop constraints
ALTER TABLE briefing_metrics DROP CONSTRAINT IF EXISTS uq_briefing_metrics_name_per_briefing;
ALTER TABLE briefing_metrics DROP CONSTRAINT IF EXISTS ck_briefing_metrics_name_nonempty;
ALTER TABLE briefing_metrics DROP CONSTRAINT IF EXISTS ck_briefing_metrics_value_nonempty;
ALTER TABLE briefing_metrics DROP CONSTRAINT IF EXISTS ck_briefing_metrics_order_nonneg;

-- Drop indexes
DROP INDEX IF EXISTS idx_briefing_metrics_order;
DROP INDEX IF EXISTS idx_briefing_metrics_briefing_id;

-- Drop the table
DROP TABLE IF EXISTS briefing_metrics;
