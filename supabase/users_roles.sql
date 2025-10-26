-- SQL commands for setting up user roles
-- Run these commands in the SQL Editor to update user roles

-- For a pre-approver
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "pre_approver"}'
where email = 'preapprover@example.com';

-- For a pending approver
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "pending_approver"}'
where email = 'approver@example.com';

-- For a user with both roles
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "pre_approver,pending_approver"}'
where email = 'both@example.com';

-- For an admin
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'
where email = 'admin@example.com';
