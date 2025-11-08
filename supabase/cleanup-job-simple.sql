-- Simple daily cleanup job for old guest records
-- Deletes guests whose visit_date was more than 1 day ago
-- Also removes associated storage files

-- Enable pg_cron extension
create extension if not exists pg_cron;

-- Main cleanup function with archiving and safety checks
create or replace function public.cleanup_old_guests()
returns json
language plpgsql
security definer
as $$
declare
  guest_record record;
  cleanup_count integer := 0;
  archive_count integer := 0;
  error_count integer := 0;
  cutoff_date date;
begin
  -- Calculate cutoff date (more than 1 day ago)
  cutoff_date := current_date - interval '1 day';
  
  -- Safety check: don't run if cutoff date seems wrong
  if cutoff_date > current_date then
    return json_build_object(
      'success', false,
      'message', 'Invalid cutoff date calculated',
      'cutoff_date', cutoff_date
    );
  end if;
  
  -- Process each old guest record
  for guest_record in
    select g.id, g.photo_path, g.first_name, g.last_name, g.visit_date, g.status, g.is_used,
           array_agg(gc.photo_path) filter (where gc.photo_path is not null) as child_photos
    from public.guests g
    left join public.guest_children gc on g.id = gc.guest_id
    where g.visit_date < cutoff_date
    group by g.id, g.photo_path, g.first_name, g.last_name, g.visit_date, g.status, g.is_used
  loop
    begin
      -- Archive the guest record before deletion
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
      
      -- Delete guest profile photo from storage
      if guest_record.photo_path is not null then
        perform storage.delete_object('guest-photos', guest_record.photo_path);
      end if;
      
      -- Delete children photos from storage
      if guest_record.child_photos is not null then
        perform storage.delete_object('guest-photos', unnest(guest_record.child_photos));
      end if;
      
      -- Delete the guest record (children deleted via CASCADE)
      delete from public.guests where id = guest_record.id;
      
      cleanup_count := cleanup_count + 1;
      
    exception when others then
      error_count := error_count + 1;
      -- Log error but continue
      raise warning 'Failed to cleanup guest % %: %', 
        guest_record.first_name, guest_record.last_name, sqlerrm;
    end;
  end loop;
  
  -- Return results
  return json_build_object(
    'success', true,
    'cleanup_date', current_date,
    'cutoff_date', cutoff_date,
    'records_archived', archive_count,
    'records_deleted', cleanup_count,
    'errors', error_count,
    'message', format('Archived %s and cleaned up %s guest records with %s errors', archive_count, cleanup_count, error_count)
  );
end;
$$;

-- Grant permissions
grant execute on function public.cleanup_old_guests() to postgres;

-- Schedule daily cleanup at noon UTC
-- Adjust the hour if you need a different timezone:
-- For Central Time (UTC-6): use '0 18 * * *' (6 PM UTC = 12 PM CT)
-- For Eastern Time (UTC-5): use '0 17 * * *' (5 PM UTC = 12 PM ET)
-- For Pacific Time (UTC-8): use '0 20 * * *' (8 PM UTC = 12 PM PT)
select cron.schedule(
  'daily-guest-cleanup',
  '0 12 * * *',  -- Daily at 12:00 PM UTC
  'select public.cleanup_old_guests();'
);

-- View scheduled jobs
-- select * from cron.job;

-- View job run history  
-- select * from cron.job_run_details order by start_time desc limit 10;

-- Manual test (run this to test the function)
-- select public.cleanup_old_guests();

-- To unschedule (if needed)
-- select cron.unschedule('daily-guest-cleanup');
