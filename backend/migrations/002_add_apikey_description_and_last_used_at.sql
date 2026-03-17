-- Add description and last_used_at columns to api_keys table
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS description VARCHAR(500);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;
