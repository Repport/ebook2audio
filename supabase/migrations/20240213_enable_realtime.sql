
-- Enable realtime for text_conversions table
ALTER TABLE text_conversions REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE text_conversions;

