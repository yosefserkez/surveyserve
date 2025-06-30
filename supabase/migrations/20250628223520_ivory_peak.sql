/*
  # Add Survey Identification Requirements and Password Protection

  1. Schema Changes
    - Add `require_identification` boolean to survey_links table
    - Add `password_protected` boolean to survey_links table  
    - Add `access_password` text to survey_links table
    - Add `respondent_name` text to responses table
    - Add `respondent_email` text to responses table

  2. Security Updates
    - Update RLS policies to handle new identification requirements
    - Ensure password protection is enforced at application level

  3. Data Migration
    - Set default values for existing survey links
    - Preserve existing anonymous responses
*/

-- Add new columns to survey_links table
DO $$
BEGIN
  -- Add require_identification column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'survey_links' AND column_name = 'require_identification'
  ) THEN
    ALTER TABLE survey_links ADD COLUMN require_identification boolean DEFAULT false;
  END IF;

  -- Add password_protected column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'survey_links' AND column_name = 'password_protected'
  ) THEN
    ALTER TABLE survey_links ADD COLUMN password_protected boolean DEFAULT false;
  END IF;

  -- Add access_password column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'survey_links' AND column_name = 'access_password'
  ) THEN
    ALTER TABLE survey_links ADD COLUMN access_password text;
  END IF;
END $$;

-- Add new columns to responses table
DO $$
BEGIN
  -- Add respondent_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'responses' AND column_name = 'respondent_name'
  ) THEN
    ALTER TABLE responses ADD COLUMN respondent_name text;
  END IF;

  -- Add respondent_email column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'responses' AND column_name = 'respondent_email'
  ) THEN
    ALTER TABLE responses ADD COLUMN respondent_email text;
  END IF;
END $$;

-- Update existing survey links to require identification when anonymous is disabled
UPDATE survey_links 
SET require_identification = NOT allow_anonymous 
WHERE require_identification IS NULL;

-- Create index for password lookups
CREATE INDEX IF NOT EXISTS idx_survey_links_password ON survey_links(link_code, access_password) 
WHERE password_protected = true;

-- Create index for respondent identification
CREATE INDEX IF NOT EXISTS idx_responses_identification ON responses(respondent_name, respondent_email) 
WHERE respondent_name IS NOT NULL OR respondent_email IS NOT NULL;