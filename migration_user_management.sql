-- User management functions (SECURITY DEFINER)
-- Only guus@pulltheplug.be can call these
-- Run in Supabase SQL Editor

-- List all users
CREATE OR REPLACE FUNCTION admin_list_users()
RETURNS TABLE(id uuid, email text, created_at timestamptz, last_sign_in_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()) != 'guus@pulltheplug.be' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
    SELECT u.id, u.email::text, u.created_at, u.last_sign_in_at
    FROM auth.users u
    ORDER BY u.created_at;
END;
$$;

-- Create a new user
CREATE OR REPLACE FUNCTION admin_create_user(p_email text, p_password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public, extensions
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()) != 'guus@pulltheplug.be' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM auth.users u WHERE u.email = p_email) THEN
    RAISE EXCEPTION 'User with this email already exists';
  END IF;

  new_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, confirmation_token, raw_app_meta_data, raw_user_meta_data
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_id, 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')),
    now(), now(), now(), '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb
  );

  -- Create identity record (required by Supabase Auth)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    new_id, new_id,
    jsonb_build_object('sub', new_id::text, 'email', p_email),
    'email', new_id::text, now(), now(), now()
  );

  RETURN new_id;
END;
$$;

-- Delete a user
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  IF (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()) != 'guus@pulltheplug.be' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;

  DELETE FROM auth.identities WHERE user_id = p_user_id;
  DELETE FROM auth.sessions WHERE user_id = p_user_id;
  DELETE FROM auth.refresh_tokens WHERE user_id::uuid = p_user_id;
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;
