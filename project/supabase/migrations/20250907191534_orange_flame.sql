/*
  # PLENATHEGRAPHER Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `role` (text, default 'user')
      - `created_at` (timestamp)
    - `collections`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `pin_hash` (text)
      - `created_at` (timestamp)
    - `images`
      - `id` (uuid, primary key)
      - `collection_id` (uuid, foreign key)
      - `title` (text)
      - `image_url` (text)
      - `created_at` (timestamp)
    - `purchase_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `image_id` (uuid, foreign key)
      - `details` (jsonb)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
    - `messages`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text)
      - `message` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their own data
    - Add policies for admin access to all data
    - Add policies for public access where appropriate

  3. Storage
    - Create storage bucket for images
    - Set up storage policies for image access
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  pin_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read collection info (without PIN)"
  ON collections
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage collections"
  ON collections
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES collections(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read image info"
  ON images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage images"
  ON images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Purchase requests table
CREATE TABLE IF NOT EXISTS purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  image_id uuid REFERENCES images(id) ON DELETE CASCADE,
  details jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own purchase requests"
  ON purchase_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchase requests"
  ON purchase_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all purchase requests"
  ON purchase_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create messages"
  ON messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read all messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert sample data for development
INSERT INTO collections (id, title, description, pin_hash) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Wedding Collection', 'Beautiful wedding photography moments', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'), -- PIN: 1234
  ('550e8400-e29b-41d4-a716-446655440002', 'Portrait Sessions', 'Professional portrait photography', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'), -- PIN: 1234
  ('550e8400-e29b-41d4-a716-446655440003', 'Landscape Collection', 'Breathtaking landscape photography', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy') -- PIN: 1234
ON CONFLICT (id) DO NOTHING;

INSERT INTO images (collection_id, title, image_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Sunset Ceremony', 'wedding_001.jpg'),
  ('550e8400-e29b-41d4-a716-446655440001', 'First Dance', 'wedding_002.jpg'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Ring Exchange', 'wedding_003.jpg'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Executive Portrait', 'portrait_001.jpg'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Family Portrait', 'portrait_002.jpg'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Mountain Vista', 'landscape_001.jpg'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Ocean Sunrise', 'landscape_002.jpg');

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES
  ('images', 'images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can view images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'images');

CREATE POLICY "Admins can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'images' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create an admin user (replace email with your admin email)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
    INSERT INTO users (id, email, name, role)
    VALUES (
      gen_random_uuid(),
      'admin@plenathegrapher.com',
      'Admin User',
      'admin'
    );
  END IF;
END $$;