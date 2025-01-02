-- Add language column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'fr';

-- Add check constraint for valid languages
ALTER TABLE profiles 
ADD CONSTRAINT valid_language CHECK (language IN ('fr', 'en', 'zh'));
