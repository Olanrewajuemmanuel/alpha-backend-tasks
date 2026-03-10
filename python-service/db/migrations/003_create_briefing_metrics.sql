-- Create briefing_metrics table
CREATE TABLE briefing_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_briefing_metrics_briefing_id ON briefing_metrics(briefing_id);
CREATE INDEX idx_briefing_metrics_order ON briefing_metrics(display_order);

-- Add check constraints for data integrity
ALTER TABLE briefing_metrics ADD CONSTRAINT ck_briefing_metrics_name_nonempty 
    CHECK (char_length(name) >= 1);
ALTER TABLE briefing_metrics ADD CONSTRAINT ck_briefing_metrics_value_nonempty 
    CHECK (char_length(value) >= 1);
ALTER TABLE briefing_metrics ADD CONSTRAINT ck_briefing_metrics_order_nonneg 
    CHECK (display_order >= 0);

-- Add unique constraint for metric names per briefing (already defined in model)
ALTER TABLE briefing_metrics ADD CONSTRAINT uq_briefing_metrics_name_per_briefing 
    UNIQUE (briefing_id, name);
