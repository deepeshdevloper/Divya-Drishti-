import { supabaseService } from './supabaseService';
import { User, UserPermissions, UserProfile } from '../types';

export class AuthService {
  // Demo users with different roles and permissions
  private demoUsers = [
    {
      email: 'admin@simhastha.org',
      password: 'admin123',
      role: 'admin' as const,
      profile: {
        name: 'Dr. Rajesh Kumar',
        department: 'Event Management',
        contact: '+91-9876543210',
        shift: 'All Day',
        badgeNumber: 'ADM001'
      },
      assigned_zones: ['ram-ghat', 'mahakal-ghat', 'bhairav-ghat', 'narsingh-ghat', 'kshipra-ghat'],
      permissions: {
        canViewAllZones: true,
        canManageDetection: true,
        canAcknowledgeAlerts: true,
        canExportData: true,
        canManageUsers: true,
        canAccessPredictions: true,
        canControlEvacuation: true,
      }
    },
    {
      email: 'police@simhastha.org',
      password: 'police123',
      role: 'police' as const,
      profile: {
        name: 'Inspector Priya Sharma',
        department: 'Ujjain Police',
        contact: '+91-9876543211',
        shift: 'Day Shift (6 AM - 6 PM)',
        badgeNumber: 'POL001'
      },
      assigned_zones: ['ram-ghat', 'mahakal-ghat', 'bhairav-ghat'],
      permissions: {
        canViewAllZones: true,
        canManageDetection: false,
        canAcknowledgeAlerts: true,
        canExportData: true,
        canManageUsers: false,
        canAccessPredictions: true,
        canControlEvacuation: true,
      }
    },
    {
      email: 'volunteer@simhastha.org',
      password: 'volunteer123',
      role: 'volunteer' as const,
      profile: {
        name: 'Amit Patel',
        department: 'Crowd Management',
        contact: '+91-9876543212',
        shift: 'Morning Shift (4 AM - 12 PM)',
        badgeNumber: 'VOL001'
      },
      assigned_zones: ['narsingh-ghat', 'kshipra-ghat'],
      permissions: {
        canViewAllZones: false,
        canManageDetection: false,
        canAcknowledgeAlerts: false,
        canExportData: false,
        canManageUsers: false,
        canAccessPredictions: false,
        canControlEvacuation: false,
      }
    },
    {
      email: 'medical@simhastha.org',
      password: 'medical123',
      role: 'volunteer' as const,
      profile: {
        name: 'Dr. Sunita Verma',
        department: 'Medical Emergency',
        contact: '+91-9876543213',
        shift: 'Night Shift (6 PM - 6 AM)',
        badgeNumber: 'MED001'
      },
      assigned_zones: ['ram-ghat', 'mahakal-ghat'],
      permissions: {
        canViewAllZones: true,
        canManageDetection: false,
        canAcknowledgeAlerts: true,
        canExportData: false,
        canManageUsers: false,
        canAccessPredictions: false,
        canControlEvacuation: false,
      }
    },
    {
      email: 'security@simhastha.org',
      password: 'security123',
      role: 'police' as const,
      profile: {
        name: 'Constable Ravi Singh',
        department: 'Security',
        contact: '+91-9876543214',
        shift: 'Evening Shift (2 PM - 10 PM)',
        badgeNumber: 'SEC001'
      },
      assigned_zones: ['bhairav-ghat', 'narsingh-ghat'],
      permissions: {
        canViewAllZones: false,
        canManageDetection: false,
        canAcknowledgeAlerts: true,
        canExportData: false,
        canManageUsers: false,
        canAccessPredictions: false,
        canControlEvacuation: true,
      }
    }
  ];

  async authenticate(email: string, password: string): Promise<User> {
    // First try Supabase authentication
    try {
      const { data, error } = await supabaseService.signIn(email, password);
      if (data?.user) {
        // Try to get user profile from database
        const profile = await supabaseService.getUserProfile(data.user.id);
        if (profile) {
          return this.mapSupabaseUserToAppUser(profile);
        } else {
          return this.mapSupabaseUserToAppUser(data.user);
        }
      } else if (error) {
        console.log('Supabase auth failed, trying demo users:', error.message);
      }
    } catch (error) {
      console.log('Supabase auth failed, trying demo users:', error.message || error);
    }

    // Fallback to demo users
    const demoUser = this.demoUsers.find(u => u.email === email && u.password === password);
    if (!demoUser) {
      throw new Error('Invalid credentials');
    }

    return {
      id: `demo-${demoUser.role}-${Date.now()}`,
      email: demoUser.email,
      role: demoUser.role,
      assigned_zones: demoUser.assigned_zones,
      permissions: demoUser.permissions,
      profile: demoUser.profile
    };
  }

  private mapSupabaseUserToAppUser(userData: any): User {
    // If we have a full user profile from database, use it
    if (userData.role && userData.profile) {
      return {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        assigned_zones: userData.assigned_zones || [],
        permissions: userData.permissions || this.getDefaultPermissions(userData.role),
        profile: userData.profile
      };
    }
    
    // Fallback for basic auth user
    return {
      id: userData.id,
      email: userData.email,
      role: 'admin', // Default role, should be determined from user metadata
      assigned_zones: [],
      permissions: this.getDefaultPermissions('admin'),
      profile: {
        name: userData.email.split('@')[0],
        department: 'System',
        contact: '',
        shift: 'All Day',
        badgeNumber: 'SYS001'
      }
    };
  }

  private getDefaultPermissions(role: string): UserPermissions {
    switch (role) {
      case 'admin':
        return {
          canViewAllZones: true,
          canManageDetection: true,
          canAcknowledgeAlerts: true,
          canExportData: true,
          canManageUsers: true,
          canAccessPredictions: true,
          canControlEvacuation: true,
        };
      case 'police':
        return {
          canViewAllZones: true,
          canManageDetection: false,
          canAcknowledgeAlerts: true,
          canExportData: true,
          canManageUsers: false,
          canAccessPredictions: true,
          canControlEvacuation: true,
        };
      default: // volunteer
        return {
          canViewAllZones: false,
          canManageDetection: false,
          canAcknowledgeAlerts: false,
          canExportData: false,
          canManageUsers: false,
          canAccessPredictions: false,
          canControlEvacuation: false,
        };
    }
  }

  getDemoUsers() {
    return this.demoUsers.map(user => ({
      email: user.email,
      role: user.role,
      profile: user.profile
    }));
  }
}

export const authService = new AuthService();