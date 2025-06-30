/*
  # Fix Anonymous Survey Submissions

  1. Security Updates
    - Update RLS policies to allow anonymous users to submit survey responses
    - Ensure response_counts trigger can update counts for anonymous submissions
    - Add policy for anonymous users to insert responses
    - Update trigger function to run with elevated privileges

  2. Changes
    - Modified responses table policies to allow anonymous inserts
    - Updated trigger function to use SECURITY DEFINER
    - Added policy for response_counts table updates via trigger
*/

-- Allow anonymous users to insert responses
DROP POLICY IF EXISTS "Anyone can insert responses" ON responses;
CREATE POLICY "Anyone can insert responses" 
  ON responses 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

-- Ensure the trigger function runs with elevated privileges
CREATE OR REPLACE FUNCTION update_response_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update the response count
  INSERT INTO response_counts (survey_link_id, total_responses, last_updated)
  VALUES (NEW.survey_link_id, 1, now())
  ON CONFLICT (survey_link_id)
  DO UPDATE SET 
    total_responses = response_counts.total_responses + 1,
    last_updated = now();
  
  RETURN NEW;
END;
$$;

-- Allow the trigger function to update response_counts
DROP POLICY IF EXISTS "System can update response counts" ON response_counts;
CREATE POLICY "System can update response counts"
  ON response_counts
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);