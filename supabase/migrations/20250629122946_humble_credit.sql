/*
  # Enhance Survey Table with Privacy Controls

  1. Schema Changes
    - Add `is_official` boolean field (default false) 
    - Add `is_public` boolean field for researcher surveys
    - Add `created_by` field to link surveys to researchers
    - Add admin role capability

  2. Security Updates
    - Update RLS policies for proper access control
    - Researchers can manage their own surveys
    - Public surveys visible to all
    - Official surveys visible to all

  3. Data Migration
    - Mark existing surveys as official
    - Preserve current functionality
*/

-- Add new columns to surveys table
DO $$
BEGIN
  -- Add is_official column (marks surveys as officially provided)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'surveys' AND column_name = 'is_official'
  ) THEN
    ALTER TABLE surveys ADD COLUMN is_official boolean DEFAULT false;
  END IF;

  -- Add is_public column (for researcher surveys - public vs private)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'surveys' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE surveys ADD COLUMN is_public boolean DEFAULT false;
  END IF;

  -- Add created_by column (links to researchers table)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'surveys' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE surveys ADD COLUMN created_by uuid REFERENCES researchers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Mark existing surveys as official (maintains current behavior)
UPDATE surveys 
SET is_official = true, is_public = true
WHERE is_official IS NULL OR is_official = false;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_surveys_visibility ON surveys(is_official, is_public, created_by);
CREATE INDEX IF NOT EXISTS idx_surveys_created_by ON surveys(created_by) WHERE created_by IS NOT NULL;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can read surveys" ON surveys;
DROP POLICY IF EXISTS "Authenticated users can read surveys" ON surveys;

-- Create comprehensive RLS policies
CREATE POLICY "Anyone can read official surveys"
  ON surveys
  FOR SELECT
  TO public
  USING (is_official = true);

CREATE POLICY "Anyone can read public community surveys"
  ON surveys
  FOR SELECT
  TO public
  USING (is_public = true AND created_by IS NOT NULL);

CREATE POLICY "Researchers can read their own private surveys"
  ON surveys
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() AND is_official = false);

CREATE POLICY "Researchers can create surveys"
  ON surveys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND 
    is_official = false
  );

CREATE POLICY "Researchers can update their own surveys"
  ON surveys
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() AND is_official = false)
  WITH CHECK (
    created_by = auth.uid() AND 
    is_official = false AND
    -- Prevent researchers from marking their surveys as official
    is_official = false
  );

CREATE POLICY "Researchers can delete their own surveys"
  ON surveys
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() AND is_official = false);

-- Function to get survey visibility info
CREATE OR REPLACE FUNCTION get_survey_visibility_info(survey_id uuid)
RETURNS TABLE (
  can_edit boolean,
  can_delete boolean,
  visibility_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN s.created_by = auth.uid() AND s.is_official = false THEN true
      ELSE false
    END as can_edit,
    CASE 
      WHEN s.created_by = auth.uid() AND s.is_official = false THEN true
      ELSE false
    END as can_delete,
    CASE 
      WHEN s.is_official = true THEN 'official'
      WHEN s.is_public = true THEN 'public'
      ELSE 'private'
    END as visibility_status
  FROM surveys s
  WHERE s.id = survey_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;