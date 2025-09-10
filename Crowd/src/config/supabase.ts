import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using demo mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'simhastha-2028-crowd-monitoring',
    },
  },
});

// Enhanced database schema types with complete coverage
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'police' | 'volunteer';
          assigned_zones: string[];
          profile: {
            name: string;
            department?: string;
            contact?: string;
            shift?: string;
            badgeNumber?: string;
          };
          permissions: {
            canViewAllZones: boolean;
            canManageDetection: boolean;
            canAcknowledgeAlerts: boolean;
            canExportData: boolean;
            canManageUsers: boolean;
            canAccessPredictions: boolean;
            canControlEvacuation: boolean;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          email: string;
          role: 'admin' | 'police' | 'volunteer';
          assigned_zones?: string[];
          profile?: any;
          permissions?: any;
        };
        Update: {
          email?: string;
          role?: 'admin' | 'police' | 'volunteer';
          assigned_zones?: string[];
          profile?: any;
          permissions?: any;
          updated_at?: string;
        };
      };
      zones: {
        Row: {
          id: string;
          name: string;
          coordinates: number[][];
          capacity: number;
          description?: string;
          facilities: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          coordinates: number[][];
          capacity: number;
          description?: string;
          facilities?: string[];
        };
        Update: {
          name?: string;
          coordinates?: number[][];
          capacity?: number;
          description?: string;
          facilities?: string[];
          updated_at?: string;
        };
      };
      crowd_counts: {
        Row: {
          id: string;
          location_id: string;
          timestamp: string;
          people_count: number;
          source: 'video' | 'image' | 'cctv';
          roi: number[];
          confidence: number;
          model_used: string;
          created_at: string;
        };
        Insert: {
          location_id: string;
          timestamp?: string;
          people_count: number;
          source: 'video' | 'image' | 'cctv';
          roi: number[];
          confidence?: number;
          model_used?: string;
        };
        Update: {
          location_id?: string;
          timestamp?: string;
          people_count?: number;
          source?: 'video' | 'image' | 'cctv';
          roi?: number[];
          confidence?: number;
          model_used?: string;
        };
      };
      alerts: {
        Row: {
          id: string;
          type: 'info' | 'warning' | 'critical';
          message: string;
          location_id: string;
          timestamp: string;
          acknowledged: boolean;
          acknowledged_by?: string;
          acknowledged_at?: string;
          metadata: any;
          created_at: string;
        };
        Insert: {
          type: 'info' | 'warning' | 'critical';
          message: string;
          location_id: string;
          timestamp?: string;
          acknowledged?: boolean;
          metadata?: any;
        };
        Update: {
          acknowledged?: boolean;
          acknowledged_by?: string;
          acknowledged_at?: string;
          metadata?: any;
        };
      };
      evacuation_routes: {
        Row: {
          id: string;
          from_zone: string;
          to_zone: string;
          path: number[][];
          estimated_time: number;
          capacity: number;
          status: 'active' | 'blocked' | 'maintenance';
          priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          from_zone: string;
          to_zone: string;
          path: number[][];
          estimated_time?: number;
          capacity?: number;
          status?: 'active' | 'blocked' | 'maintenance';
          priority?: number;
        };
        Update: {
          from_zone?: string;
          to_zone?: string;
          path?: number[][];
          estimated_time?: number;
          capacity?: number;
          status?: 'active' | 'blocked' | 'maintenance';
          priority?: number;
          updated_at?: string;
        };
      };
    };
    Views: {
      live_zone_status: {
        Row: {
          id: string;
          name: string;
          coordinates: number[][];
          capacity: number;
          facilities: string[];
          current_count: number;
          status: 'safe' | 'moderate' | 'critical';
          occupancy_rate: number;
          last_updated: string;
          last_source: string;
        };
      };
      recent_alerts: {
        Row: {
          id: string;
          type: 'info' | 'warning' | 'critical';
          message: string;
          location_id: string;
          timestamp: string;
          acknowledged: boolean;
          zone_name: string;
          acknowledged_by_email?: string;
        };
      };
      zone_analytics: {
        Row: {
          zone_id: string;
          zone_name: string;
          capacity: number;
          total_readings: number;
          avg_count: number;
          max_count: number;
          min_count: number;
          median_count: number;
          critical_readings: number;
          moderate_readings: number;
          safe_readings: number;
          last_reading: string;
        };
      };
    };
    Functions: {
      get_dashboard_data: {
        Args: {};
        Returns: any;
      };
      get_evacuation_recommendations: {
        Args: {};
        Returns: any;
      };
      get_crowd_trends: {
        Args: {
          zone_id?: string;
          hours_back?: number;
        };
        Returns: any;
      };
      generate_demo_scenario: {
        Args: {
          scenario_type?: string;
        };
        Returns: void;
      };
      cleanup_old_data: {
        Args: {};
        Returns: void;
      };
      refresh_analytics_views: {
        Args: {};
        Returns: void;
      };
    };
  };
}

// Helper function to check Supabase connection
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('zones').select('count').limit(1);
    if (error) throw error;
    return { connected: true, error: null };
  } catch (error) {
    console.error('Supabase connection error:', error);
    return { connected: false, error: error.message };
  }
};

// Helper function to setup real-time subscriptions
export const setupRealtimeSubscription = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  let subscription = supabase.channel(`realtime-${table}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: table,
      filter: filter
    }, callback);

  if (table === 'crowd_counts') {
    subscription = subscription.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'crowd_counts'
    }, callback);
  }

  return subscription.subscribe();
};

// Helper function to get user profile with role
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

// Helper function to check user permissions
export const checkUserPermission = async (userId: string, permission: string) => {
  const profile = await getUserProfile(userId);
  return profile?.permissions?.[permission] || false;
};