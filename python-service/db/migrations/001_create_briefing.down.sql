-- Drop the trigger
DROP TRIGGER IF EXISTS update_briefings_updated_at ON briefings;

-- Drop the function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop the index
DROP INDEX IF EXISTS idx_briefings_ticker;

-- Drop constraints
ALTER TABLE briefings DROP CONSTRAINT IF EXISTS ck_briefings_company_name_nonempty;
ALTER TABLE briefings DROP CONSTRAINT IF EXISTS ck_briefings_ticker_nonempty;
ALTER TABLE briefings DROP CONSTRAINT IF EXISTS ck_briefings_summary_nonempty;
ALTER TABLE briefings DROP CONSTRAINT IF EXISTS ck_briefings_recommendation_nonempty;

-- Drop the table
DROP TABLE IF EXISTS briefings;