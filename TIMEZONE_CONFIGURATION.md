# Date & Time Configuration

## Overview

The system uses a simplified approach for visit dates while maintaining timezone awareness for system timestamps. This provides the best user experience for church scheduling.

## Date Handling Strategy

### Visit Dates (Simple Calendar Dates)
- **Storage**: Simple date strings (`YYYY-MM-DD`) in database `date` fields
- **Display**: Same calendar date for all users worldwide
- **User Experience**: "November 23rd" appears as "November 23rd" everywhere

### System Timestamps (Timezone-Aware)
- **Storage**: Full timestamps with timezone (`timestamptz`)
- **Fields**: `created_at`, `updated_at`, `expires_at`, `approved_at`, etc.
- **Display**: Can show in user's local time or church time as needed

### Pass Expiry Calculation
- **Logic**: Monday after visit date at 11:59 PM in church timezone
- **Storage**: `timestamptz` for proper timezone handling
- **Purpose**: Ensures passes expire consistently regardless of user location

## Database Schema

```sql
-- Simple date fields (no timezone)
visit_date date,           -- YYYY-MM-DD format
dob date,                 -- YYYY-MM-DD format

-- Timezone-aware timestamp fields
expires_at timestamptz,    -- Full timestamp with timezone
created_at timestamptz,    -- System creation time
updated_at timestamptz,    -- Last modification time
approved_at timestamptz,   -- Approval timestamp
```

## Benefits

✅ **User-Friendly**: Visit dates work like calendar appointments  
✅ **No Confusion**: "Dec 15th" is always "Dec 15th" regardless of location  
✅ **Reliable**: No timezone-related date shifting for visit dates  
✅ **Appropriate Complexity**: System timestamps use full timezone handling where needed  
✅ **Church-Focused**: Matches how churches think about service dates  

## Implementation Notes

- Visit dates are parsed and stored as simple strings
- Expiry calculation uses church timezone for consistency  
- Display functions automatically handle both date types
- No timezone conversion needed for visit date display
