
-- Enable the required extensions if not already enabled
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule the cleanup function to run daily at midnight UTC
select
  cron.schedule(
    'cleanup-expired-conversions',
    '0 0 * * *',
    $$
    select
      net.http_post(
        url:='https://yivnximszyzjebpjygrg.supabase.co/functions/v1/cleanup-expired',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpdm54aW1zenl6amVicGp5Z3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0MDg3MjgsImV4cCI6MjA1Mzk4NDcyOH0.6gJlyoy7zYbQZ4eFZuxbzegCsN8AIN6t6nh-5-tmEdw"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
  );
