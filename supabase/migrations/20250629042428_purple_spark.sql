/*
  # Add Survey Results Visibility Control

  1. Schema Changes
    - Add `show_results_to_respondent` boolean to survey_links table
    - Default to true to maintain current behavior

  2. Changes
    - Researchers can now control whether participants see their computed scores
    - Maintains backward compatibility with existing survey links
    - Allows for privacy-focused research where immediate feedback isn't desired
*/

-- Add show_results_to_respondent column to survey_links table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'survey_links' AND column_name = 'show_results_to_respondent'
  ) THEN
    ALTER TABLE survey_links ADD COLUMN show_results_to_respondent boolean DEFAULT true;
  END IF;
END $$;

-- Update existing survey links to show results by default (maintains current behavior)
UPDATE survey_links 
SET show_results_to_respondent = true 
WHERE show_results_to_respondent IS NULL;