/*
  # Views and Functions for Divya Drishti (दिव्य  दृष्टि) System

  1. Views
    - `live_zone_status` - Real-time zone status with current counts
    - `recent_alerts` - Recent alerts with zone information
    - `zone_analytics` - Zone statistics and analytics

  2. Functions
    - `get_dashboard_data()` - Dashboard summary data
    - `get_evacuation_recommendations()` - Smart evacuation suggestions
    - `get_crowd_trends()` - Crowd trend analysis
    - `generate_demo_scenario()` - Demo data generation
    - `cleanup_old_data()` - Data maintenance
*/

-- Live zone status view with current crowd counts
CREATE OR REPLACE VIEW live_zone_status AS
SELECT 
    z.id,
    z.name,
    z.coordinates,
    z.capacity,
    z.facilities,
    COALESCE(latest_counts.current_count, 0) as current_count,
    CASE 
        WHEN COALESCE(latest_counts.current_count, 0)::numeric / z.capacity > 0.9 THEN 'critical'
        WHEN COALESCE(latest_counts.current_count, 0)::numeric / z.capacity > 0.6 THEN 'moderate'
        ELSE 'safe'
    END as status,
    ROUND((COALESCE(latest_counts.current_count, 0)::numeric / z.capacity * 100), 1) as occupancy_rate,
    COALESCE(latest_counts.last_updated, z.created_at) as last_updated,
    COALESCE(latest_counts.last_source, 'system') as last_source
FROM zones z
LEFT JOIN (
    SELECT DISTINCT ON (location_id)
        location_id,
        people_count as current_count,
        timestamp as last_updated,
        source as last_source
    FROM crowd_counts
    ORDER BY location_id, timestamp DESC
) latest_counts ON z.id = latest_counts.location_id;

-- Recent alerts view with zone names
CREATE OR REPLACE VIEW recent_alerts AS
SELECT 
    a.*,
    z.name as zone_name,
    u.email as acknowledged_by_email
FROM alerts a
JOIN zones z ON a.location_id = z.id
LEFT JOIN users u ON a.acknowledged_by = u.id
WHERE a.timestamp > now() - interval '24 hours'
ORDER BY a.timestamp DESC;

-- Zone analytics view for performance metrics
CREATE OR REPLACE VIEW zone_analytics AS
SELECT 
    z.id as zone_id,
    z.name as zone_name,
    z.capacity,
    COUNT(cc.id) as total_readings,
    ROUND(AVG(cc.people_count), 0) as avg_count,
    MAX(cc.people_count) as max_count,
    MIN(cc.people_count) as min_count,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cc.people_count) as median_count,
    COUNT(CASE WHEN cc.people_count::numeric / z.capacity > 0.9 THEN 1 END) as critical_readings,
    COUNT(CASE WHEN cc.people_count::numeric / z.capacity BETWEEN 0.6 AND 0.9 THEN 1 END) as moderate_readings,
    COUNT(CASE WHEN cc.people_count::numeric / z.capacity < 0.6 THEN 1 END) as safe_readings,
    MAX(cc.timestamp) as last_reading
FROM zones z
LEFT JOIN crowd_counts cc ON z.id = cc.location_id 
    AND cc.timestamp > now() - interval '7 days'
GROUP BY z.id, z.name, z.capacity;

-- Function to get dashboard summary data
CREATE OR REPLACE FUNCTION get_dashboard_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    total_people integer;
    critical_zones integer;
    active_alerts integer;
    system_status text;
BEGIN
    -- Calculate totals
    SELECT COALESCE(SUM(current_count), 0) INTO total_people FROM live_zone_status;
    SELECT COUNT(*) INTO critical_zones FROM live_zone_status WHERE status = 'critical';
    SELECT COUNT(*) INTO active_alerts FROM alerts WHERE NOT acknowledged AND timestamp > now() - interval '1 hour';
    
    -- Determine system status
    IF critical_zones > 2 THEN
        system_status := 'critical';
    ELSIF critical_zones > 0 THEN
        system_status := 'warning';
    ELSE
        system_status := 'normal';
    END IF;
    
    -- Build result
    result := jsonb_build_object(
        'total_people', total_people,
        'critical_zones', critical_zones,
        'active_alerts', active_alerts,
        'system_status', system_status,
        'last_updated', now(),
        'zones', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'name', name,
                    'current_count', current_count,
                    'capacity', capacity,
                    'status', status,
                    'occupancy_rate', occupancy_rate
                )
            ) FROM live_zone_status
        )
    );
    
    RETURN result;
END;
$$;

-- Function to get evacuation recommendations
CREATE OR REPLACE FUNCTION get_evacuation_recommendations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    rec record;
    recommendations jsonb[] := '{}';
BEGIN
    -- Find critical zones and recommend evacuation to safe zones
    FOR rec IN 
        SELECT 
            critical.id as from_zone,
            critical.name as from_name,
            critical.current_count,
            critical.capacity,
            safe.id as to_zone,
            safe.name as to_name,
            safe.capacity - safe.current_count as available_capacity
        FROM live_zone_status critical
        CROSS JOIN live_zone_status safe
        WHERE critical.status = 'critical' 
        AND safe.status = 'safe'
        AND safe.capacity - safe.current_count > 100
        ORDER BY critical.occupancy_rate DESC, safe.available_capacity DESC
        LIMIT 10
    LOOP
        recommendations := recommendations || jsonb_build_object(
            'from_zone', rec.from_zone,
            'from_name', rec.from_name,
            'to_zone', rec.to_zone,
            'to_name', rec.to_name,
            'people_to_move', LEAST(rec.current_count - rec.capacity, rec.available_capacity),
            'priority', CASE 
                WHEN rec.current_count::numeric / rec.capacity > 1.2 THEN 'critical'
                WHEN rec.current_count::numeric / rec.capacity > 1.0 THEN 'high'
                ELSE 'medium'
            END,
            'estimated_time', 5 + (random() * 10)::integer
        );
    END LOOP;
    
    result := jsonb_build_object(
        'recommendations', recommendations,
        'generated_at', now()
    );
    
    RETURN result;
END;
$$;

-- Function to get crowd trends for a zone
CREATE OR REPLACE FUNCTION get_crowd_trends(
    zone_id text DEFAULT NULL,
    hours_back integer DEFAULT 24
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    trend_data jsonb;
BEGIN
    -- Get trend data
    SELECT jsonb_agg(
        jsonb_build_object(
            'timestamp', timestamp,
            'people_count', people_count,
            'location_id', location_id,
            'source', source
        ) ORDER BY timestamp
    ) INTO trend_data
    FROM crowd_counts
    WHERE (zone_id IS NULL OR location_id = zone_id)
    AND timestamp > now() - (hours_back || ' hours')::interval;
    
    result := jsonb_build_object(
        'zone_id', zone_id,
        'hours_back', hours_back,
        'data_points', COALESCE(jsonb_array_length(trend_data), 0),
        'trends', COALESCE(trend_data, '[]'::jsonb),
        'generated_at', now()
    );
    
    RETURN result;
END;
$$;

-- Function to generate demo scenarios
CREATE OR REPLACE FUNCTION generate_demo_scenario(scenario_type text DEFAULT 'normal')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    zone_rec record;
    base_count integer;
    multiplier numeric;
BEGIN
    -- Set multiplier based on scenario type
    multiplier := CASE scenario_type
        WHEN 'peak_hour' THEN 2.5
        WHEN 'emergency' THEN 0.3
        WHEN 'night_mode' THEN 0.1
        ELSE 1.0
    END;
    
    -- Generate crowd data for each zone
    FOR zone_rec IN SELECT id, capacity FROM zones LOOP
        base_count := (zone_rec.capacity * 0.4 * multiplier * (0.8 + random() * 0.4))::integer;
        
        INSERT INTO crowd_counts (location_id, people_count, source, timestamp)
        VALUES (
            zone_rec.id,
            GREATEST(0, base_count),
            'demo',
            now()
        );
    END LOOP;
    
    -- Generate alerts for critical zones if needed
    IF scenario_type = 'peak_hour' THEN
        INSERT INTO alerts (type, message, location_id, timestamp)
        SELECT 
            'critical',
            'High crowd density detected during peak hours - monitor closely',
            id,
            now()
        FROM live_zone_status 
        WHERE status = 'critical'
        AND NOT EXISTS (
            SELECT 1 FROM alerts 
            WHERE location_id = live_zone_status.id 
            AND NOT acknowledged 
            AND timestamp > now() - interval '10 minutes'
        );
    END IF;
END;
$$;

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete crowd counts older than 7 days
    DELETE FROM crowd_counts 
    WHERE timestamp < now() - interval '7 days';
    
    -- Delete acknowledged alerts older than 30 days
    DELETE FROM alerts 
    WHERE acknowledged = true 
    AND acknowledged_at < now() - interval '30 days';
    
    -- Delete unacknowledged alerts older than 3 days
    DELETE FROM alerts 
    WHERE acknowledged = false 
    AND timestamp < now() - interval '3 days';
END;
$$;

-- Function to refresh materialized views (if we add any later)
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function can be used to refresh any materialized views
    -- Currently we're using regular views for real-time data
    -- But this provides a hook for future optimizations
    
    -- Example: REFRESH MATERIALIZED VIEW zone_summary_stats;
    
    -- For now, just return success
    RETURN;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;