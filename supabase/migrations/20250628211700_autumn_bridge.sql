/*
  # Add INSERT policy for researchers table

  1. Security Changes
    - Add INSERT policy for `researchers` table
    - Allow authenticated users to create their own researcher profile
    - Policy ensures users can only insert records with their own auth.uid()

  This resolves the RLS violation error (42501) that occurs during user signup
  when attempting to create a researcher profile.
*/

CREATE POLICY "Authenticated users can create their own researcher profile"
  ON researchers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);