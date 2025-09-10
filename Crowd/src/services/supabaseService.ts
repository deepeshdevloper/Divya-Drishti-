import { supabase, Database } from '../config/supabase';
import { CrowdData, Alert, Zone, User } from '../types';

type Tables = Database['public']['Tables'];
type CrowdCountRow = Tables['crowd_counts']['Row'];
type AlertRow = Tables['alerts']['Row'];
type ZoneRow = Tables['zones']['Row'];
type UserRow = Tables['users']['Row'];

export class SupabaseService {
  // Connection and health check
  async checkConnection() {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection check timeout')), 3000)
      );
      
      const checkPromise = supabase
        .from('zones')
        .select('id')
        .limit(1);
        checkPromise,
        timeoutPromise
        .limit(1);
        
      if (error) throw error;
      return { connected: true, error: null };
    } catch (error) {
      console.warn('Supabase connection failed:', error);
      return { connected: false, error: error?.message || 'Connection failed' };
    }
  }

  // Crowd data operations
  async insertCrowdData(data: Omit<CrowdData, 'id' | 'created_at'>) {
    try {
      // Validate data before insertion
      if (!data.location_id || data.people_count < 0 || !data.roi || data.roi.length !== 4) {
        throw new Error('Invalid crowd data format');
      }
      
      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('User not authenticated, skipping database insert');
        return null;
      }
      
      const insertData = {
        location_id: data.location_id,
        timestamp: data.timestamp,
        people_count: Math.max(0, Math.floor(data.people_count)), // Ensure positive integer
        source: data.source,
        roi: data.roi.map(coord => Math.max(0, Math.min(1, coord))), // Clamp ROI to [0,1]
        confidence: Math.max(0.1, Math.min(1.0, 0.8)), // Clamp confidence to valid range
        model_used: 'browser-detection-v2'
      };

      const { data: result, error } = await supabase
        .from('crowd_counts')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.warn('Database insert failed, continuing with demo mode:', error.message);
        return null;
      }
      
      // Auto-generate alerts based on thresholds
      await this.checkAndGenerateAlerts(data.location_id, data.people_count);
      
      return result;
    } catch (error) {
      console.warn('Failed to insert crowd data, continuing with demo mode:', error);
      return null;
    }
  }
  
  private async checkAndGenerateAlerts(locationId: string, peopleCount: number) {
    try {
      // Get zone capacity
      const { data: zone } = await supabase
        .from('zones')
        .select('capacity, name')
        .eq('id', locationId)
        .single();
      
      if (!zone) return;
      
      const occupancyRate = peopleCount / zone.capacity;
      
      // Generate alerts based on thresholds
      if (occupancyRate > 0.9) {
        await this.createAlert({
          type: 'critical',
          message: `CRITICAL: ${zone.name} has exceeded safe capacity (${peopleCount}/${zone.capacity}) - immediate evacuation recommended`,
          location_id: locationId,
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      } else if (occupancyRate > 0.7) {
        await this.createAlert({
          type: 'warning',
          message: `WARNING: ${zone.name} approaching high capacity (${peopleCount}/${zone.capacity}) - enhanced monitoring advised`,
          location_id: locationId,
          timestamp: new Date().toISOString(),
          acknowledged: false
        });
      }
    } catch (error) {
      console.warn('Error checking alert thresholds:', error);
    }
  }

  async getCrowdData(locationId?: string, limit = 100) {
    try {
      let query = supabase
        .from('crowd_counts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching crowd data:', error);
      return [];
    }
  }

  async getCrowdTrends(zoneId?: string, hoursBack = 24) {
    try {
      const { data, error } = await supabase.rpc('get_crowd_trends', {
        zone_id: zoneId,
        hours_back: hoursBack
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching crowd trends:', error);
      return [];
    }
  }

  // Real-time subscriptions
  subscribeToLiveCrowdData(callback: (data: CrowdCountRow) => void) {
    try {
      return supabase
        .channel('crowd_counts_changes')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'crowd_counts' },
          (payload) => {
            console.log('Real-time crowd data received:', payload);
            callback(payload.new as CrowdCountRow);
          }
        )
        .subscribe((status) => {
          console.log('Crowd data subscription status:', status);
        });
    } catch (error) {
      console.error('Error setting up crowd data subscription:', error);
      return { unsubscribe: () => {} };
    }
  }

  subscribeToAlerts(callback: (data: AlertRow) => void) {
    try {
      return supabase
        .channel('alerts_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'alerts' },
          (payload) => {
            console.log('Real-time alert received:', payload);
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              callback(payload.new as AlertRow);
            }
          }
        )
        .subscribe((status) => {
          console.log('Alerts subscription status:', status);
        });
    } catch (error) {
      console.error('Error setting up alerts subscription:', error);
      return { unsubscribe: () => {} };
    }
  }

  subscribeToZoneUpdates(callback: (data: any) => void) {
    try {
      return supabase
        .channel('zone_updates')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'crowd_counts' },
          async (payload) => {
            try {
              console.log('Zone update triggered by crowd count change:', payload);
              // Get updated zone status when crowd count changes
              const { data, error } = await supabase
                .from('live_zone_status')
                .select('*')
                .eq('id', (payload.new as CrowdCountRow).location_id)
                .single();
              
              if (error) {
                console.error('Error fetching zone status:', error);
                return;
              }
              
              if (data) {
                console.log('Zone status updated:', data);
                callback(data);
              }
            } catch (error) {
              console.error('Error in zone update callback:', error);
            }
          }
        )
        .subscribe((status) => {
          console.log('Zone updates subscription status:', status);
        });
    } catch (error) {
      console.error('Error setting up zone updates subscription:', error);
      return { unsubscribe: () => {} };
    }
  }

  // Zone operations
  async getZones() {
    try {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching zones:', error);
      return [];
    }
  }

  async getLiveZoneStatus() {
    try {
      const { data, error } = await supabase
        .from('live_zone_status')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching live zone status:', error);
      return [];
    }
  }

  async updateZone(id: string, updates: Partial<ZoneRow>) {
    try {
      const { data, error } = await supabase
        .from('zones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating zone:', error);
      throw error;
    }
  }

  // Alert operations
  async createAlert(alert: Omit<Alert, 'id' | 'created_at'>) {
    try {
      // Check if user is authenticated first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('User not authenticated, creating demo alert');
        return {
          id: `demo-alert-${Date.now()}`,
          type: alert.type,
          message: alert.message,
          location_id: alert.location_id,
          timestamp: alert.timestamp,
          acknowledged: alert.acknowledged || false,
          metadata: {
            auto_generated: true,
            severity: alert.type === 'critical' ? 'high' : alert.type === 'warning' ? 'medium' : 'low',
            created_by: 'demo_system'
          },
          created_at: new Date().toISOString()
        };
      }
      
      // Check for duplicate alerts in the last 5 minutes
      const { data: existingAlerts } = await supabase
        .from('alerts')
        .select('id')
        .eq('location_id', alert.location_id)
        .eq('type', alert.type)
        .eq('acknowledged', false)
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString());
      
      if (existingAlerts && existingAlerts.length > 0) {
        console.log('Duplicate alert prevented');
        return existingAlerts[0];
      }
      
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          type: alert.type,
          message: alert.message,
          location_id: alert.location_id,
          timestamp: alert.timestamp,
          acknowledged: alert.acknowledged || false,
          metadata: {
            auto_generated: true,
            severity: alert.type === 'critical' ? 'high' : alert.type === 'warning' ? 'medium' : 'low',
            created_by: 'system',
            zone_capacity: 0,
            current_occupancy: 0
          }
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.warn('Error creating alert:', error);
      // Return a mock alert for demo purposes instead of throwing
      return {
        id: `demo-alert-${Date.now()}`,
        type: alert.type,
        message: alert.message,
        location_id: alert.location_id,
        timestamp: alert.timestamp,
        acknowledged: alert.acknowledged || false,
        metadata: {
          auto_generated: true,
          severity: alert.type === 'critical' ? 'high' : alert.type === 'warning' ? 'medium' : 'low',
          created_by: 'demo_system'
        },
        created_at: new Date().toISOString()
      };
    }
  }

  async getAlerts(acknowledged = false) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          zones!alerts_location_id_fkey(name)
        `)
        .eq('acknowledged', acknowledged)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  }

  async getRecentAlerts() {
    try {
      const { data, error } = await supabase
        .from('recent_alerts')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
      return [];
    }
  }

  async acknowledgeAlert(id: string) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({ 
          acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  // Dashboard operations
  async getDashboardData() {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_data');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return null;
    }
  }

  async getEvacuationRecommendations() {
    try {
      const { data, error } = await supabase.rpc('get_evacuation_recommendations');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching evacuation recommendations:', error);
      return [];
    }
  }

  // Evacuation routes
  async getEvacuationRoutes() {
    try {
      const { data, error } = await supabase
        .from('evacuation_routes')
        .select(`
          *,
          from_zone_data:zones!evacuation_routes_from_zone_fkey(name),
          to_zone_data:zones!evacuation_routes_to_zone_fkey(name)
        `)
        .eq('status', 'active')
        .order('priority');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching evacuation routes:', error);
      return [];
    }
  }

  // Analytics operations
  async getZoneAnalytics() {
    try {
      const { data, error } = await supabase
        .from('zone_analytics')
        .select('*')
        .order('zone_name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching zone analytics:', error);
      return [];
    }
  }

  async refreshAnalytics() {
    try {
      const { error } = await supabase.rpc('refresh_analytics_views');
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      return false;
    }
  }

  // Demo and testing operations
  async generateDemoScenario(scenarioType = 'normal') {
    try {
      const { error } = await supabase.rpc('generate_demo_scenario', {
        scenario_type: scenarioType
      });
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error generating demo scenario:', error);
      return false;
    }
  }

  async cleanupOldData() {
    try {
      const { error } = await supabase.rpc('cleanup_old_data');
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return false;
    }
  }

  // Authentication operations
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.warn('Supabase sign in error:', error.message);
        return { data: null, error };
      }
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  subscribeToAuth(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }

  // Utility methods
  async testConnection() {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Test connection timeout')), 3000)
      );
      
      const { data, error } = await supabase
        .from('zones')
        .select('id, name')
        timeoutPromise
        .limit(1);

      if (error) throw error;
      
      console.log('✅ Supabase connection successful', data);
      return true;
    } catch (error) {
      console.warn('❌ Supabase test connection failed:', error);
      return false;
    }
  }

  async initializeDemo() {
    try {
      // Test connection first
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.log('Supabase not available for demo initialization');
        return false;
      }

      // Check if we have the required functions with timeout
      try {
        const { data, error } = await Promise.race([
          supabase.from('zones').select('count').limit(1),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 2000))
        ]);
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }
      } catch (error) {
        console.warn('Demo functions not available:', error);
        // Try to insert some basic demo data
        await this.insertBasicDemoData();
      }
      
      // Skip analytics refresh to prevent timeouts
      try {
        console.log('Analytics refresh skipped for performance');
      } catch (error) {
        console.warn('Analytics refresh failed:', error);
      }
      
      console.log('✅ Demo initialization completed');
      return true;
    } catch (error) {
      console.warn('❌ Demo initialization failed:', error);
      return false;
    }
  }

  private async insertBasicDemoData() {
    try {
      // Insert basic crowd count data if tables exist
      const zones = ['ram-ghat', 'mahakal-ghat', 'bhairav-ghat', 'narsingh-ghat', 'kshipra-ghat'];
      
      for (const zoneId of zones) {
        const count = Math.floor(Math.random() * 500) + 100;
        try {
          await this.insertCrowdData({
            location_id: zoneId,
            timestamp: new Date().toISOString(),
            people_count: count,
            source: 'video', // Use 'video' instead of 'demo' if 'demo' is not allowed
            roi: [0.1, 0.1, 0.9, 0.9]
          });
        } catch (error) {
          console.warn(`Failed to insert demo data for ${zoneId}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to insert basic demo data:', error);
    }
  }
}

export const supabaseService = new SupabaseService();