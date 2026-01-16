# Guest Cleanup Job Setup

This document explains how to set up the automated daily cleanup job for old guest records in your Supabase database.

## Overview

The cleanup job automatically:
- **Archives** guest records where `visit_date` is more than 1 day in the past
- **Removes** full guest records and associated children records (via CASCADE delete)
- **Deletes** profile photos from Supabase Storage
- **Deletes** children photos from Supabase Storage

### Archive Table
Before deletion, key information is preserved in the `guest_archive` table:
- First name (full)
- Last name initial (privacy protection)
- Final status (approved, denied, etc.)
- Visit date
- Whether they actually visited (`did_visit` based on `is_used` field)

## Setup Instructions

### 1. Enable pg_cron Extension

First, enable the `pg_cron` extension in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Search for `pg_cron`
4. Enable the extension

### 2. Run the Cleanup Job SQL

Execute the cleanup job SQL in your Supabase SQL Editor:

**Option A: Simple Version (Recommended)**
```sql
-- Run the contents of supabase/cleanup-job-simple.sql
```

**Option B: Full Version with Logging**
```sql
-- Run the contents of supabase/cleanup-job.sql
```

### 3. Adjust Timezone (If Needed)

The job is scheduled for **12:00 PM UTC** by default. To run at noon in your local timezone:

**Central Time (UTC-6):**
```sql
select cron.schedule(
  'daily-guest-cleanup',
  '0 18 * * *',  -- 6 PM UTC = 12 PM Central
  'select public.cleanup_old_guests();'
);
```

**Eastern Time (UTC-5):**
```sql
select cron.schedule(
  'daily-guest-cleanup',
  '0 17 * * *',  -- 5 PM UTC = 12 PM Eastern
  'select public.cleanup_old_guests();'
);
```

**Pacific Time (UTC-8):**
```sql
select cron.schedule(
  'daily-guest-cleanup',
  '0 20 * * *',  -- 8 PM UTC = 12 PM Pacific
  'select public.cleanup_old_guests();'
);
```

## How It Works

### Cleanup Logic
1. **Identifies old records**: Finds guests where `visit_date < current_date - 1 day`
2. **Archives key data**: Saves essential information to `guest_archive` table
3. **Removes storage files**: Deletes profile and children photos from `guest-photos` bucket
4. **Deletes database records**: Removes guest and children records
5. **Returns results**: Provides cleanup summary with archive and deletion counts

### Safety Features
- **Date validation**: Ensures cutoff date is reasonable
- **Error handling**: Continues processing even if individual records fail
- **Detailed logging**: Reports success/failure counts
- **Transaction safety**: Each guest cleanup is isolated

### Example Output
```json
{
  "success": true,
  "cleanup_date": "2025-11-08",
  "cutoff_date": "2025-11-07",
  "records_archived": 15,
  "records_deleted": 15,
  "errors": 0,
  "message": "Archived 15 and cleaned up 15 guest records with 0 errors"
}
```

## Management Commands

### View Scheduled Jobs
```sql
select * from cron.job;
```

### View Job History
```sql
select * from cron.job_run_details 
order by start_time desc 
limit 10;
```

### Manual Test Run
```sql
select public.cleanup_old_guests();
```

### Query Archive Data
```sql
-- View recent archived guests
select * from public.guest_archive 
order by archived_at desc 
limit 20;

-- Count archived guests by visit date
select visit_date, count(*) as guest_count,
       sum(case when did_visit then 1 else 0 end) as actual_visitors
from public.guest_archive 
group by visit_date 
order by visit_date desc;

-- View archived guests by status
select final_status, count(*) as count
from public.guest_archive 
group by final_status;
```

### Unschedule Job
```sql
select cron.unschedule('daily-guest-cleanup');
```

### Reschedule Job (Different Time)
```sql
-- First unschedule
select cron.unschedule('daily-guest-cleanup');

-- Then reschedule with new time
select cron.schedule(
  'daily-guest-cleanup',
  '0 15 * * *',  -- 3 PM UTC
  'select public.cleanup_old_guests();'
);
```

## Monitoring

### Check Job Status
```sql
-- View recent job runs
select 
  jobname,
  schedule,
  start_time,
  end_time,
  status,
  return_message
from cron.job_run_details 
where jobname = 'daily-guest-cleanup'
order by start_time desc
limit 5;
```

### Monitor Cleanup Results
The cleanup function returns detailed JSON with:
- Number of records deleted
- Number of errors encountered
- Cutoff date used
- Success/failure status

## Troubleshooting

### Job Not Running
1. **Check if pg_cron is enabled**: `select * from pg_extension where extname = 'pg_cron';`
2. **Verify job is scheduled**: `select * from cron.job where jobname = 'daily-guest-cleanup';`
3. **Check job history**: `select * from cron.job_run_details where jobname = 'daily-guest-cleanup';`

### Storage Cleanup Errors
- **Permission issues**: Ensure the function has proper storage permissions
- **File not found**: Normal if files were already deleted manually
- **Bucket access**: Verify `guest-photos` bucket exists and is accessible

### Database Cleanup Errors
- **Foreign key constraints**: Should not occur due to CASCADE deletes
- **Permission issues**: Ensure function has DELETE permissions on tables

## Security Considerations

- **Function security**: Uses `SECURITY DEFINER` to run with elevated privileges
- **Limited scope**: Only deletes records based on visit_date criteria
- **Error isolation**: Individual record failures don't stop the entire cleanup
- **Audit trail**: Job run history provides cleanup audit trail

## Customization

### Change Retention Period
To keep records for a different period, modify the cutoff calculation:

```sql
-- Keep for 3 days instead of 1
cutoff_date := current_date - interval '3 days';

-- Keep for 1 week
cutoff_date := current_date - interval '1 week';
```

### Add Additional Cleanup Logic
You can extend the cleanup function to:
- Archive records instead of deleting
- Clean up additional related data
- Send cleanup notifications
- Update cleanup statistics

### Disable Cleanup Temporarily
```sql
-- Unschedule the job
select cron.unschedule('daily-guest-cleanup');

-- Re-enable later
select cron.schedule(
  'daily-guest-cleanup',
  '0 12 * * *',
  'select public.cleanup_old_guests();'
);
```

## Best Practices

1. **Test first**: Run manual cleanup before scheduling
2. **Monitor initially**: Check job runs for the first week
3. **Backup strategy**: Ensure you have database backups
4. **Document changes**: Keep track of any customizations
5. **Regular review**: Periodically check cleanup effectiveness

---

**Note**: This cleanup is permanent. Ensure your backup strategy accounts for the automatic deletion of old guest records.
