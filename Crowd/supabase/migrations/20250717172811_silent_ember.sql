/*
  # Real-time Setup for Divya Drishti (दिव्य  दृष्टि) System - Corrected Version

  Changes made:
  - Fixed IMMUTABLE flag on functions where appropriate
  - Removed IMMUTABLE from check_crowd_thresholds() since it modifies data
  - Adjusted function permissions
*/

-- Function to get real-time zone update (STABLE since it depends on database state)
CREATE OR REPLACE FUNCTION get_zone_realtime_update(zone_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT to_jsonb(lzs.*) INTO result
    FROM live_zone_status lzs
    WHERE lzs.id = zone_id;
    
    RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- Function to automatically generate alerts based on crowd thresholds
-- Changed from IMMUTABLE to VOLATILE (default) since it modifies data
CREATE OR REPLACE FUNCTION check_crowd_thresholds()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    zone_capacity integer;
    occupancy_rate numeric;
    existing_alert_count integer;
BEGIN
    -- Get zone capacity
    SELECT capacity INTO zone_capacity 
    FROM zones 
    WHERE id = NEW.location_id;
    
    -- Calculate occupancy rate
    occupancy_rate := NEW.people_count::numeric / zone_capacity;
    
    -- Check for existing unacknowledged alerts in last 10 minutes
    SELECT COUNT(*) INTO existing_alert_count
    FROM alerts
    WHERE location_id = NEW.location_id
    AND NOT acknowledged
    AND timestamp > now() - interval '10 minutes'
    AND type IN ('warning', 'critical');
    
    -- Generate critical alert if over 90% capacity and no recent alert
    IF occupancy_rate > 0.9 AND existing_alert_count = 0 THEN
        INSERT INTO alerts (type, message, location_id, timestamp)
        VALUES (
            'critical',
            format('CRITICAL: %s has exceeded safe capacity (%s/%s people) - immediate evacuation recommended', 
                   (SELECT name FROM zones WHERE id = NEW.location_id),
                   NEW.people_count,
                   zone_capacity),
            NEW.location_id,
            NEW.timestamp
        );
    -- Generate warning alert if over 70% capacity and no recent alert
    ELSIF occupancy_rate > 0.7 AND existing_alert_count = 0 THEN
        INSERT INTO alerts (type, message, location_id, timestamp)
        VALUES (
            'warning',
            format('WARNING: %s approaching high capacity (%s/%s people) - monitor closely', 
                   (SELECT name FROM zones WHERE id = NEW.location_id),
                   NEW.people_count,
                   zone_capacity),
            NEW.location_id,
            NEW.timestamp
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for automatic alert generation
DROP TRIGGER IF EXISTS trigger_check_crowd_thresholds ON crowd_counts;
CREATE TRIGGER trigger_check_crowd_thresholds
    AFTER INSERT ON crowd_counts
    FOR EACH ROW
    EXECUTE FUNCTION check_crowd_thresholds();

-- Function to validate crowd count data (VOLATILE as it modifies NEW)
CREATE OR REPLACE FUNCTION validate_crowd_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Ensure people_count is not negative
    IF NEW.people_count < 0 THEN
        NEW.people_count := 0;
    END IF;
    
    -- Ensure ROI coordinates are valid (between 0 and 1)
    IF array_length(NEW.roi, 1) = 4 THEN
        FOR i IN 1..4 LOOP
            IF NEW.roi[i] < 0 THEN
                NEW.roi[i] := 0;
            ELSIF NEW.roi[i] > 1 THEN
                NEW.roi[i] := 1;
            END IF;
        END LOOP;
    ELSE
        NEW.roi := ARRAY[0.1, 0.1, 0.9, 0.9];
    END IF;
    
    -- Set timestamp if not provided
    IF NEW.timestamp IS NULL THEN
        NEW.timestamp := now();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for data validation
DROP TRIGGER IF EXISTS trigger_validate_crowd_count ON crowd_counts;
CREATE TRIGGER trigger_validate_crowd_count
    BEFORE INSERT OR UPDATE ON crowd_counts
    FOR EACH ROW
    EXECUTE FUNCTION validate_crowd_count();

-- Function to auto-acknowledge old alerts (VOLATILE as it modifies data)
CREATE OR REPLACE FUNCTION auto_acknowledge_old_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Auto-acknowledge info alerts older than 1 hour
    UPDATE alerts 
    SET acknowledged = true, 
        acknowledged_at = now(),
        acknowledged_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
    WHERE type = 'info' 
    AND NOT acknowledged 
    AND timestamp < now() - interval '1 hour';
    
    -- Auto-acknowledge warning alerts older than 2 hours
    UPDATE alerts 
    SET acknowledged = true, 
        acknowledged_at = now(),
        acknowledged_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
    WHERE type = 'warning' 
    AND NOT acknowledged 
    AND timestamp < now() - interval '2 hours';
END;
$$;

-- Function to generate realistic demo data (VOLATILE as it modifies data)
CREATE OR REPLACE FUNCTION generate_realistic_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    zone_rec record;
    hour_of_day integer;
    base_multiplier numeric;
    random_factor numeric;
    final_count integer;
BEGIN
    hour_of_day := EXTRACT(hour FROM now());
    
    -- Time-based multipliers for Simhastha patterns
    base_multiplier := CASE 
        WHEN hour_of_day BETWEEN 4 AND 8 THEN 2.2  -- Early morning bathing peak
        WHEN hour_of_day BETWEEN 17 AND 21 THEN 2.5 -- Evening aarti peak
        WHEN hour_of_day BETWEEN 22 AND 23 OR hour_of_day BETWEEN 0 AND 3 THEN 0.2 -- Night
        ELSE 1.3 -- Day time
    END;
    
    FOR zone_rec IN SELECT id, name, capacity FROM zones LOOP
        random_factor := 0.7 + (random() * 0.6); -- 0.7 to 1.3
        
        -- Zone-specific adjustments
        IF zone_rec.id = 'mahakal-ghat' THEN
            base_multiplier := base_multiplier * 1.2; -- Most popular
        ELSIF zone_rec.id = 'bhairav-ghat' THEN
            base_multiplier := base_multiplier * 1.1; -- Second most popular
        END IF;
        
        final_count := (zone_rec.capacity * 0.35 * base_multiplier * random_factor)::integer;
        final_count := GREATEST(0, LEAST(final_count, zone_rec.capacity + 100)); -- Cap at capacity + overflow
        
        INSERT INTO crowd_counts (location_id, people_count, source, timestamp)
        VALUES (zone_rec.id, final_count, 'manual', now());
    END LOOP;
END;
$$;

-- Create a function to be called periodically for demo data (VOLATILE)
CREATE OR REPLACE FUNCTION maintain_demo_system()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Generate new demo data
    PERFORM generate_realistic_demo_data();
    
    -- Auto-acknowledge old alerts
    PERFORM auto_acknowledge_old_alerts();
    
    -- Cleanup old data (keep last 7 days)
    DELETE FROM crowd_counts 
    WHERE timestamp < now() - interval '7 days'
    AND source = 'demo';
END;
$$;

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE crowd_counts;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE zones;
ALTER PUBLICATION supabase_realtime ADD TABLE evacuation_routes;

-- Create indexes for real-time performance (using only immutable functions in predicates)
CREATE INDEX IF NOT EXISTS idx_crowd_counts_realtime ON crowd_counts(location_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_realtime ON alerts(location_id, acknowledged, timestamp DESC);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_zone_realtime_update(text) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_realistic_demo_data() TO service_role;
GRANT EXECUTE ON FUNCTION maintain_demo_system() TO service_role;
GRANT EXECUTE ON FUNCTION auto_acknowledge_old_alerts() TO service_role;