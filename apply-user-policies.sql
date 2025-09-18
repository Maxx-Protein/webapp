-- Fix for user creation issue
-- Add missing INSERT policy for users table

-- Drop existing policies on users table to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Managers can insert users" ON users;

-- Create new policies for user insertion
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') = 'admin'
  );

CREATE POLICY "Managers can insert users" ON users
  FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'role') = 'manager'
  );

-- Refresh schema
NOTIFY pgrst, 'reload schema';

-- To verify that the policies have been applied correctly, run:
-- SELECT p.polname AS policyname, c.relname AS tablename, p.polroles AS roles, p.polcmd AS cmd
-- FROM pg_policy p 
-- JOIN pg_class c ON p.polrelid = c.oid 
-- WHERE c.relname = 'users';