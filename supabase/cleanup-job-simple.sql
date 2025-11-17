-- Simple weekly cleanup job for old guest records
-- Archives and deletes guests whose visit_date was older than today
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
  -- Cutoff date is today's date
  cutoff_date := current_date;
  
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
        first_name,
        last_name_initial,
        final_status,
        visit_date,
        gathering_time,
        did_visit
      ) values (
        guest_record.first_name,
        left(guest_record.last_name, 1),  -- First letter of last name
        guest_record.status,
        guest_record.visit_date,
        guest_record.gathering_time,
        coalesce(guest_record.is_used, false)  -- True if they actually visited
      );
      
      archive_count := archive_count + 1;
      
      -- Delete guest profile photo from storage
      PERFORM net.http_delete(
          url := (
              SELECT (current_setting('anon.base_url') || '/storage/v1/object/guest_photos/' || guest_record.photo_path)
          ),
          headers := jsonb_build_object(
              'Authorization', 'Bearer ' || current_setting('request.jwt.claim.service_role_key')
          )
      );

      -- Delete children photos from storage
      DECLARE child_photo_path text;
      BEGIN
        FOREACH child_photo_path IN ARRAY guest_record.child_photos
        LOOP

          CONTINUE WHEN child_photo_path IS NULL;

          CONTINUE WHEN child_photo_path = '';

          PERFORM net.http_delete(
            url := (
                SELECT (current_setting('anon.base_url') || '/storage/v1/object/guest_photos/' || child_photo_path)
            ),
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('request.jwt.claim.service_role_key')
            )
          );
        END LOOP;
      END;
      
      -- Delete the guest record (children deleted via CASCADE)
      delete from public.guests where id = guest_record.id;
      
      cleanup_count := cleanup_count + 1;
      
    exception when others then
      error_count := error_count + 1;
      -- Log error but continue
      raise warning 'Failed to cleanup guest % %. Visit Date:%. Error: %', 
        guest_record.first_name, left(guest_record.last_name, 1), guest_record.visit_date, sqlerrm;
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

-- Schedule weekly cleanup at 6:00 AM UTC on Monday
select cron.schedule(
  'weekly-guest-cleanup',
  '0 6 * * 1',  -- Daily at 6:00 AM UTC on Monday
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
