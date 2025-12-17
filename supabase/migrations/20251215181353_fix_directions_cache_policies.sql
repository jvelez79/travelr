-- Fix: Allow anon to insert into directions_cache
-- The cache is global and server-side, so anon needs to be able to write

-- Drop existing insert policy
DROP POLICY IF EXISTS "Authenticated users can insert directions cache" ON directions_cache;

-- Create new policy that allows both authenticated and anon
CREATE POLICY "Anyone can insert directions cache"
  ON directions_cache
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Also fix update policy for upsert to work
DROP POLICY IF EXISTS "Authenticated users can update directions cache" ON directions_cache;

CREATE POLICY "Anyone can update directions cache"
  ON directions_cache
  FOR UPDATE
  TO authenticated, anon
  USING (true);
