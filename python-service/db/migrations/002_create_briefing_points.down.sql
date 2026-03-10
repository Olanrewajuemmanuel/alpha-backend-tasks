-- Drop constraints
ALTER TABLE briefing_points DROP CONSTRAINT IF EXISTS uq_briefing_points_order;
ALTER TABLE briefing_points DROP CONSTRAINT IF EXISTS ck_briefing_points_type_valid;
ALTER TABLE briefing_points DROP CONSTRAINT IF EXISTS ck_briefing_points_content_nonempty;
ALTER TABLE briefing_points DROP CONSTRAINT IF EXISTS ck_briefing_points_order_nonneg;

-- Drop indexes
DROP INDEX IF EXISTS idx_briefing_points_type_order;
DROP INDEX IF EXISTS idx_briefing_points_briefing_id;

-- Drop the table
DROP TABLE IF EXISTS briefing_points;
