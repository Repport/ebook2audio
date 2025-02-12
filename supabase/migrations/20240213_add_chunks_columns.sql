
-- Add columns for tracking chunk progress
ALTER TABLE text_conversions
ADD COLUMN processed_chunks INTEGER DEFAULT 0,
ADD COLUMN total_chunks INTEGER DEFAULT 0;
