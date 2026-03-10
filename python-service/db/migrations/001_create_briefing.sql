-- Create briefings table
CREATE TABLE briefings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    sector VARCHAR(100),
    analyst_name VARCHAR(255),
    summary TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    rendered_html TEXT,
    generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
 
-- Create index on ticker for performance
CREATE INDEX idx_briefings_ticker ON briefings(ticker);
 
-- Add check constraints for data integrity
ALTER TABLE briefings ADD CONSTRAINT ck_briefings_company_name_nonempty 
    CHECK (char_length(company_name) >= 1);
ALTER TABLE briefings ADD CONSTRAINT ck_briefings_ticker_nonempty 
    CHECK (char_length(ticker) >= 1);
ALTER TABLE briefings ADD CONSTRAINT ck_briefings_summary_nonempty 
    CHECK (char_length(summary) >= 1);
ALTER TABLE briefings ADD CONSTRAINT ck_briefings_recommendation_nonempty 
    CHECK (char_length(recommendation) >= 1);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
 
CREATE TRIGGER update_briefings_updated_at 
    BEFORE UPDATE ON briefings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();