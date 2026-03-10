-- Create briefing_points table
CREATE TABLE briefing_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
    point_type VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_briefing_points_briefing_id ON briefing_points(briefing_id);
CREATE INDEX idx_briefing_points_type_order ON briefing_points(point_type, display_order);

-- Add check constraints for data integrity
ALTER TABLE briefing_points ADD CONSTRAINT ck_briefing_points_type_valid 
    CHECK (point_type IN ('KEY_POINT', 'RISK'));
ALTER TABLE briefing_points ADD CONSTRAINT ck_briefing_points_content_nonempty 
    CHECK (char_length(content) >= 1);
ALTER TABLE briefing_points ADD CONSTRAINT ck_briefing_points_order_nonneg 
    CHECK (display_order >= 0);

-- Add unique constraint to prevent duplicate ordering within same briefing and type
ALTER TABLE briefing_points ADD CONSTRAINT uq_briefing_points_order 
    UNIQUE (briefing_id, point_type, display_order);
