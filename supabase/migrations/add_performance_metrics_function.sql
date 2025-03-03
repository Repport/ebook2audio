
-- Create the custom function to calculate performance metrics
CREATE OR REPLACE FUNCTION get_performance_metrics()
RETURNS TABLE (
  operation TEXT,
  avg_duration_ms FLOAT,
  max_duration_ms FLOAT,
  min_duration_ms FLOAT,
  count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH performance_logs AS (
    SELECT 
      details->>'operation' AS operation,
      (details->>'duration_ms')::FLOAT AS duration_ms
    FROM 
      system_logs
    WHERE 
      event_type = 'performance'
      AND created_at > NOW() - INTERVAL '7 days'
      AND details->>'operation' IS NOT NULL
      AND details->>'duration_ms' IS NOT NULL
  )
  SELECT
    operation,
    ROUND(AVG(duration_ms)::NUMERIC, 2) AS avg_duration_ms,
    MAX(duration_ms) AS max_duration_ms,
    MIN(duration_ms) AS min_duration_ms,
    COUNT(*) AS count
  FROM 
    performance_logs
  GROUP BY 
    operation
  ORDER BY 
    avg_duration_ms DESC;
END;
$$;
