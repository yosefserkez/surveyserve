/*
  # Fix survey library access for authenticated users

  1. Security Changes
    - Update the surveys table RLS policy to properly allow authenticated users to read surveys
    - The current policy may be too restrictive for authenticated users

  This resolves the issue where logged-in researchers cannot access the survey library.
*/

-- Drop the existing policy and recreate it with proper permissions
DROP POLICY IF EXISTS "Anyone can read surveys" ON surveys;

-- Create a new policy that explicitly allows both anonymous and authenticated users
CREATE POLICY "Public can read surveys"
  ON surveys
  FOR SELECT
  TO public
  USING (true);

-- Also ensure authenticated users can read surveys specifically
CREATE POLICY "Authenticated users can read surveys"
  ON surveys
  FOR SELECT
  TO authenticated
  USING (true);