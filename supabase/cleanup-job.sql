-- Daily cleanup job for old guest records and storage
-- Runs daily at noon to clean up guests whose visit_date was more than 1 day ago
-- Also removes associated storage files (profile photos and children photos)

-- Enable the pg_cron extension for scheduled jobs
create extension if not exists pg_cron;

-- Function to clean up storage files for a guest record
create or replace function public.cleanup_guest_storage(guest_record public.guests)
returns void
language plpgsql
security definer
as $$
declare
  child_record public.guest_children;
begin
  -- Delete guest profile photo from storage if it exists
  if guest_record.photo_path is not null then
    perform storage.delete_object('guest-photos', guest_record.photo_path);
  end if;
  
  -- Delete children photos from storage
  for child_record in 
    select * from public.guest_children 
    where guest_id = guest_record.id 
    and photo_path is not null
  loop
    perform storage.delete_object('guest-photos', child_record.photo_path);
  end loop;
end;
$$;

-- Main cleanup function with archiving
create or replace function public.cleanup_old_guests()
returns void
language plpgsql
security definer
as $$
declare
  guest_record public.guests;
  cleanup_count integer := 0;
  archive_count integer := 0;
  storage_cleanup_count integer := 0;
begin
  -- Log the start of cleanup
  raise notice 'Starting daily guest cleanup at %', now();
  
  -- Find and process guests whose visit_date is more than 1 day ago
  for guest_record in
    select * from public.guests
    where visit_date < current_date - interval '1 day'
  loop
    -- Archive the guest record before deletion
    begin
      insert into public.guest_archive (
        original_guest_id,
        first_name,
        last_name_initial,
        final_status,
        visit_date,
        did_visit
      ) values (
        guest_record.id,
        guest_record.first_name,
        left(guest_record.last_name, 1),  -- First letter of last name
        guest_record.status,
        guest_record.visit_date,
        coalesce(guest_record.is_used, false)  -- True if they actually visited
      );
      
      archive_count := archive_count + 1;
    exception when others then
      raise warning 'Failed to archive guest %: %', guest_record.id, sqlerrm;
    end;
    
    -- Clean up storage files for this guest
    begin
      perform public.cleanup_guest_storage(guest_record);
      storage_cleanup_count := storage_cleanup_count + 1;
    exception when others then
      -- Log storage cleanup errors but continue with database cleanup
      raise warning 'Failed to cleanup storage for guest %: %', guest_record.id, sqlerrm;
    end;
    
    -- Delete the guest record (children will be deleted via CASCADE)
    delete from public.guests where id = guest_record.id;
    cleanup_count := cleanup_count + 1;
  end loop;
  
  -- Log the results
  raise notice 'Guest cleanup completed: % records archived, % records deleted, % storage cleanups attempted', 
    archive_count, cleanup_count, storage_cleanup_count;
    
  -- Insert cleanup log entry
  insert into public.cleanup_logs (cleanup_date, records_deleted, storage_cleanups, records_archived)
  values (current_date, cleanup_count, storage_cleanup_count, archive_count);
end;
$$;

-- Optional: Create a cleanup log table to track cleanup history
create table if not exists public.cleanup_logs (
  id uuid primary key default gen_random_uuid(),
  cleanup_date date not null default current_date,
  records_deleted integer not null default 0,
  storage_cleanups integer not null default 0,
  records_archived integer not null default 0,
  created_at timestamptz not null default now()
);

-- Grant necessary permissions for the cleanup function
grant execute on function public.cleanup_old_guests() to postgres;
grant execute on function public.cleanup_guest_storage(public.guests) to postgres;

-- Schedule the cleanup job to run daily at noon (12:00 PM)
-- Note: Times are in UTC, adjust as needed for your timezone
select cron.schedule(
  'daily-guest-cleanup',           -- job name
  '0 12 * * *',                   -- cron expression (daily at 12:00 PM UTC)
  'select public.cleanup_old_guests();'  -- SQL to execute
);

-- Alternative: If you want to run at noon in a specific timezone (e.g., Central Time)
-- You would adjust the hour accordingly. For example, for Central Time (UTC-6):
-- select cron.schedule(
--   'daily-guest-cleanup',
--   '0 18 * * *',                 -- 6 PM UTC = 12 PM Central Time
--   'select public.cleanup_old_guests();'
-- );

-- To check scheduled jobs:
-- select * from cron.job;

-- To unschedule the job (if needed):
-- select cron.unschedule('daily-guest-cleanup');

-- Manual execution for testing:
-- select public.cleanup_old_guests();
