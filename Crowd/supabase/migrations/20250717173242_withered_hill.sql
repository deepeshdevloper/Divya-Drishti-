/*
  # Insert Demo Data for Divya Drishti (दिव्य  दृष्टि)

  1. Demo Users
    - Admin, Police, Volunteer, Medical, Security users
    - Each with proper roles and permissions
    - Realistic profile information

  2. Zone Data  
    - 5 main ghats in Ujjain for Simhastha
    - Proper coordinates and capacity information
    - Facilities and descriptions

  3. Sample Crowd Data
    - Historical crowd counts for testing
    - Realistic patterns based on time of day

  4. Sample Alerts
    - Various alert types for demonstration
    - Different priorities and statuses
*/
ALTER TABLE crowd_counts 
DROP CONSTRAINT crowd_counts_source_check;

ALTER TABLE crowd_counts 
ADD CONSTRAINT crowd_counts_source_check 
CHECK (source IN ('video', 'image', 'cctv', 'demo', 'manual'));

-- Insert demo users with proper UUIDs
INSERT INTO users (id, email, role, assigned_zones, profile, permissions) VALUES
(
  gen_random_uuid(),
  'admin@simhastha.org',
  'admin',
  ARRAY['ram-ghat', 'mahakal-ghat', 'bhairav-ghat', 'narsingh-ghat', 'kshipra-ghat'],
  '{
    "name": "Dr. Rajesh Kumar",
    "department": "Event Management",
    "contact": "+91-9876543210",
    "shift": "All Day",
    "badgeNumber": "ADM001"
  }'::jsonb,
  '{
    "canViewAllZones": true,
    "canManageDetection": true,
    "canAcknowledgeAlerts": true,
    "canExportData": true,
    "canManageUsers": true,
    "canAccessPredictions": true,
    "canControlEvacuation": true
  }'::jsonb
),
(
  gen_random_uuid(),
  'police@simhastha.org',
  'police',
  ARRAY['ram-ghat', 'mahakal-ghat', 'bhairav-ghat'],
  '{
    "name": "Inspector Priya Sharma",
    "department": "Ujjain Police",
    "contact": "+91-9876543211",
    "shift": "Day Shift (6 AM - 6 PM)",
    "badgeNumber": "POL001"
  }'::jsonb,
  '{
    "canViewAllZones": true,
    "canManageDetection": false,
    "canAcknowledgeAlerts": true,
    "canExportData": true,
    "canManageUsers": false,
    "canAccessPredictions": true,
    "canControlEvacuation": true
  }'::jsonb
),
(
  gen_random_uuid(),
  'volunteer@simhastha.org',
  'volunteer',
  ARRAY['narsingh-ghat', 'kshipra-ghat'],
  '{
    "name": "Amit Patel",
    "department": "Crowd Management",
    "contact": "+91-9876543212",
    "shift": "Morning Shift (4 AM - 12 PM)",
    "badgeNumber": "VOL001"
  }'::jsonb,
  '{
    "canViewAllZones": false,
    "canManageDetection": false,
    "canAcknowledgeAlerts": false,
    "canExportData": false,
    "canManageUsers": false,
    "canAccessPredictions": false,
    "canControlEvacuation": false
  }'::jsonb
),
(
  gen_random_uuid(),
  'medical@simhastha.org',
  'volunteer',
  ARRAY['ram-ghat', 'mahakal-ghat'],
  '{
    "name": "Dr. Sunita Verma",
    "department": "Medical Emergency",
    "contact": "+91-9876543213",
    "shift": "Night Shift (6 PM - 6 AM)",
    "badgeNumber": "MED001"
  }'::jsonb,
  '{
    "canViewAllZones": true,
    "canManageDetection": false,
    "canAcknowledgeAlerts": true,
    "canExportData": false,
    "canManageUsers": false,
    "canAccessPredictions": false,
    "canControlEvacuation": false
  }'::jsonb
),
(
  gen_random_uuid(),
  'security@simhastha.org',
  'police',
  ARRAY['bhairav-ghat', 'narsingh-ghat'],
  '{
    "name": "Constable Ravi Singh",
    "department": "Security",
    "contact": "+91-9876543214",
    "shift": "Evening Shift (2 PM - 10 PM)",
    "badgeNumber": "SEC001"
  }'::jsonb,
  '{
    "canViewAllZones": false,
    "canManageDetection": false,
    "canAcknowledgeAlerts": true,
    "canExportData": false,
    "canManageUsers": false,
    "canAccessPredictions": false,
    "canControlEvacuation": true
  }'::jsonb
);

-- Insert Divya Drishti (दिव्य  दृष्टि) zones (Ujjain ghats)
INSERT INTO zones (id, name, coordinates, capacity, description, facilities) VALUES
(
  'ram-ghat',
  'Ram Ghat',
  '[[23.1770, 75.7890], [23.1775, 75.7895], [23.1780, 75.7890], [23.1775, 75.7885]]'::jsonb,
  500,
  'Main bathing ghat with excellent facilities for pilgrims',
  ARRAY['medical_center', 'police_station', 'accessibility_ramp', 'drinking_water', 'toilets']
),
(
  'mahakal-ghat',
  'Mahakal Ghat',
  '[[23.1760, 75.7880], [23.1765, 75.7885], [23.1770, 75.7880], [23.1765, 75.7875]]'::jsonb,
  800,
  'Sacred ghat near Mahakaleshwar Temple with high capacity',
  ARRAY['medical_center', 'police_station', 'temple_access', 'parking', 'food_stalls']
),
(
  'bhairav-ghat',
  'Bhairav Ghat',
  '[[23.1750, 75.7870], [23.1755, 75.7875], [23.1760, 75.7870], [23.1755, 75.7865]]'::jsonb,
  900,
  'Large capacity ghat with comprehensive facilities',
  ARRAY['medical_center', 'police_station', 'food_stalls', 'parking', 'lost_found']
),
(
  'narsingh-ghat',
  'Narsingh Ghat',
  '[[23.1740, 75.7860], [23.1745, 75.7865], [23.1750, 75.7860], [23.1745, 75.7855]]'::jsonb,
  600,
  'Peaceful ghat with accessibility features for divyangjan',
  ARRAY['medical_center', 'accessibility_ramp', 'wheelchair_access', 'drinking_water']
),
(
  'kshipra-ghat',
  'Kshipra Ghat',
  '[[23.1780, 75.7900], [23.1785, 75.7905], [23.1790, 75.7900], [23.1785, 75.7895]]'::jsonb,
  700,
  'Modern ghat with excellent infrastructure and parking',
  ARRAY['police_station', 'parking', 'food_stalls', 'atm', 'information_center']
);

-- Insert evacuation routes between zones
INSERT INTO evacuation_routes (from_zone, to_zone, path, estimated_time, capacity, status, priority) VALUES
(
  'bhairav-ghat',
  'narsingh-ghat',
  '[[23.1755, 75.7870], [23.1750, 75.7865], [23.1745, 75.7860]]'::jsonb,
  5,
  1000,
  'active',
  1
),
(
  'mahakal-ghat',
  'kshipra-ghat',
  '[[23.1765, 75.7880], [23.1770, 75.7885], [23.1775, 75.7890], [23.1780, 75.7895]]'::jsonb,
  7,
  800,
  'active',
  2
),
(
  'ram-ghat',
  'narsingh-ghat',
  '[[23.1775, 75.7890], [23.1770, 75.7885], [23.1760, 75.7875], [23.1750, 75.7865]]'::jsonb,
  8,
  600,
  'active',
  3
),
(
  'bhairav-ghat',
  'kshipra-ghat',
  '[[23.1755, 75.7870], [23.1765, 75.7880], [23.1775, 75.7890], [23.1785, 75.7900]]'::jsonb,
  10,
  500,
  'active',
  4
);

-- Insert sample crowd data for the last 24 hours
DO $$
DECLARE
  zone_ids text[] := ARRAY['ram-ghat', 'mahakal-ghat', 'bhairav-ghat', 'narsingh-ghat', 'kshipra-ghat'];
  zone_id text;
  hour_offset integer;
  base_count integer;
  crowd_multiplier numeric;
  final_count integer;
  sample_time timestamp;
BEGIN
  -- Generate crowd data for each zone for the last 24 hours
  FOREACH zone_id IN ARRAY zone_ids LOOP
    FOR hour_offset IN 0..23 LOOP
      sample_time := NOW() - (hour_offset || ' hours')::interval;
      
      -- Base crowd count varies by zone
      base_count := CASE zone_id
        WHEN 'ram-ghat' THEN 200
        WHEN 'mahakal-ghat' THEN 300
        WHEN 'bhairav-ghat' THEN 350
        WHEN 'narsingh-ghat' THEN 150
        WHEN 'kshipra-ghat' THEN 250
        ELSE 200
      END;
      
      -- Time-based multiplier (Simhastha patterns)
      crowd_multiplier := CASE 
        WHEN EXTRACT(hour FROM sample_time) BETWEEN 4 AND 8 THEN 2.2  -- Early morning bathing
        WHEN EXTRACT(hour FROM sample_time) BETWEEN 17 AND 21 THEN 2.5 -- Evening aarti
        WHEN EXTRACT(hour FROM sample_time) BETWEEN 22 AND 23 OR EXTRACT(hour FROM sample_time) BETWEEN 0 AND 3 THEN 0.2 -- Night
        ELSE 1.3 -- Day time
      END;
      
      -- Add some randomness
      final_count := GREATEST(0, FLOOR(base_count * crowd_multiplier * (0.8 + random() * 0.4)));
      
      -- Insert crowd count data
      INSERT INTO crowd_counts (location_id, timestamp, people_count, source, roi, confidence, model_used)
      VALUES (
        zone_id,
        sample_time,
        final_count,
        'demo',
        ARRAY[0.1, 0.1, 0.9, 0.9],
        0.8 + random() * 0.15,
        'demo-generator'
      );
    END LOOP;
  END LOOP;
END $$;

-- Insert sample alerts
INSERT INTO alerts (type, message, location_id, timestamp, acknowledged, metadata) VALUES
(
  'warning',
  'Moderate crowd buildup detected - monitor closely for potential capacity issues',
  'ram-ghat',
  NOW() - interval '15 minutes',
  false,
  '{"severity": "medium", "auto_generated": true}'::jsonb
),
(
  'critical',
  'Critical capacity reached - immediate evacuation procedures recommended',
  'bhairav-ghat',
  NOW() - interval '8 minutes',
  false,
  '{"severity": "high", "auto_generated": true, "evacuation_suggested": true}'::jsonb
),
(
  'info',
  'Normal crowd flow restored after temporary congestion',
  'mahakal-ghat',
  NOW() - interval '25 minutes',
  true,
  '{"severity": "low", "auto_generated": true}'::jsonb
),
(
  'warning',
  'Weather conditions may affect crowd patterns - increased monitoring recommended',
  'kshipra-ghat',
  NOW() - interval '45 minutes',
  false,
  '{"severity": "medium", "weather_related": true}'::jsonb
),
(
  'info',
  'Accessibility facilities operational and available for divyangjan pilgrims',
  'narsingh-ghat',
  NOW() - interval '2 hours',
  true,
  '{"severity": "low", "facility_status": "operational"}'::jsonb
);

-- Insert current crowd data to populate live_zone_status view
INSERT INTO crowd_counts (location_id, timestamp, people_count, source, roi, confidence, model_used) VALUES
('ram-ghat', NOW(), 245, 'demo', ARRAY[0.1, 0.1, 0.9, 0.9], 0.85, 'demo-current'),
('mahakal-ghat', NOW(), 720, 'demo', ARRAY[0.1, 0.1, 0.9, 0.9], 0.82, 'demo-current'),
('bhairav-ghat', NOW(), 950, 'demo', ARRAY[0.1, 0.1, 0.9, 0.9], 0.88, 'demo-current'),
('narsingh-ghat', NOW(), 180, 'demo', ARRAY[0.1, 0.1, 0.9, 0.9], 0.79, 'demo-current'),
('kshipra-ghat', NOW(), 420, 'demo', ARRAY[0.1, 0.1, 0.9, 0.9], 0.83, 'demo-current');