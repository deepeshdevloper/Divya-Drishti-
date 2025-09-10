/*
  # Initial Schema for Divya Drishti (दिव्य  दृष्टि) Crowd Monitoring System

  1. New Tables
    - `users` - User management with roles and permissions
    - `zones` - Geographic zones/ghats with capacity information
    - `crowd_counts` - Real-time crowd counting data from detection
    - `alerts` - System alerts and notifications
    - `evacuation_routes` - Predefined evacuation paths between zones

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure user data access

  3. Indexes
    - Performance indexes for real-time queries
    - Composite indexes for analytics
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table for authentication and role management
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'police', 'volunteer')),
  assigned_zones text[] DEFAULT '{}',
  profile jsonb DEFAULT '{}',
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Zones table for geographic areas/ghats
CREATE TABLE IF NOT EXISTS zones (
  id text PRIMARY KEY,
  name text NOT NULL,
  coordinates jsonb NOT NULL, -- Array of [lat, lng] coordinates for polygon
  capacity integer NOT NULL DEFAULT 500,
  description text,
  facilities text[] DEFAULT '{}', -- medical, police, accessibility, etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crowd counts table for real-time detection data
CREATE TABLE IF NOT EXISTS crowd_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id text NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  people_count integer NOT NULL DEFAULT 0,
  source text NOT NULL CHECK (source IN ('video', 'image', 'cctv')),
  roi numeric[] DEFAULT '{0.1, 0.1, 0.9, 0.9}', -- [x1, y1, x2, y2] normalized coordinates
  confidence numeric DEFAULT 0.8,
  model_used text DEFAULT 'browser-detection',
  created_at timestamptz DEFAULT now()
);

-- Alerts table for notifications and warnings
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('info', 'warning', 'critical')),
  message text NOT NULL,
  location_id text NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid REFERENCES users(id),
  acknowledged_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Evacuation routes table for emergency planning
CREATE TABLE IF NOT EXISTS evacuation_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_zone text NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  to_zone text NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  path jsonb NOT NULL, -- Array of [lat, lng] coordinates for route
  estimated_time integer DEFAULT 5, -- minutes
  capacity integer DEFAULT 1000, -- people per hour
  status text DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'maintenance')),
  priority integer DEFAULT 1, -- 1 = highest priority
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE crowd_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE evacuation_routes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (profile->>'role' = 'admin' OR role = 'admin')
    )
  );

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for zones table
CREATE POLICY "Everyone can read zones" ON zones
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can modify zones" ON zones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (profile->>'role' = 'admin' OR role = 'admin')
    )
  );

-- RLS Policies for crowd_counts table
CREATE POLICY "Users can read crowd data for assigned zones" ON crowd_counts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        (profile->>'role' = 'admin' OR role = 'admin') OR
        (profile->>'role' = 'police' OR role = 'police') OR
        location_id = ANY(assigned_zones)
      )
    )
  );

CREATE POLICY "Users can insert crowd data" ON crowd_counts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for alerts table
CREATE POLICY "Users can read alerts for assigned zones" ON alerts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        (profile->>'role' = 'admin' OR role = 'admin') OR
        (profile->>'role' = 'police' OR role = 'police') OR
        location_id = ANY(assigned_zones)
      )
    )
  );

CREATE POLICY "Users can create alerts" ON alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can acknowledge alerts" ON alerts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        (profile->>'role' = 'admin' OR role = 'admin') OR
        (profile->>'role' = 'police' OR role = 'police')
      )
    )
  );

-- RLS Policies for evacuation_routes table
CREATE POLICY "Everyone can read evacuation routes" ON evacuation_routes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and police can modify evacuation routes" ON evacuation_routes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        (profile->>'role' = 'admin' OR role = 'admin') OR
        (profile->>'role' = 'police' OR role = 'police')
      )
    )
  );

-- Create indexes for performance (marked as IMMUTABLE where needed)
CREATE INDEX IF NOT EXISTS idx_crowd_counts_location_time ON crowd_counts(location_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_crowd_counts_timestamp ON crowd_counts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_location_ack ON alerts(location_id, acknowledged, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_evacuation_routes_zones ON evacuation_routes(from_zone, to_zone);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql' IMMUTABLE;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evacuation_routes_updated_at BEFORE UPDATE ON evacuation_routes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();