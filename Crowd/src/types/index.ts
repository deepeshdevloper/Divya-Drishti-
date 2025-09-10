// Global type declarations for performance optimizer
declare global {
  interface Window {
    performanceOptimizer?: {
      isSystemStressed: () => boolean;
      cleanupMemory: () => void;
      emergencyStop: () => void;
      isEmergencyMode: () => boolean;
      queueTask: (task: () => Promise<void>) => void;
      throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => (...args: Parameters<T>) => void;
      debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => (...args: Parameters<T>) => void;
      getMetrics: () => any;
    };
    ModelLoader?: any;
  }
}

export interface CrowdData {
  id?: string;
  location_id: string;
  timestamp: string;
  people_count: number;
  source: 'video' | 'image' | 'cctv';
  roi: [number, number, number, number];
  created_at?: string;
}

export interface Zone {
  id: string;
  name: string;
  coordinates: [number, number][];
  current_count: number;
  capacity: number;
  status: 'safe' | 'moderate' | 'critical';
  last_updated: string;
}

export interface EvacuationRoute {
  id: string;
  from_zone: string;
  to_zone: string;
  path: [number, number][];
  estimated_time: number;
  status: 'active' | 'blocked' | 'recommended';
}

export interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  location_id: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'police' | 'volunteer';
  assigned_zones: string[];
  permissions: UserPermissions;
  profile: UserProfile;
}

export interface UserPermissions {
  canViewAllZones: boolean;
  canManageDetection: boolean;
  canAcknowledgeAlerts: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
  canAccessPredictions: boolean;
  canControlEvacuation: boolean;
}

export interface UserProfile {
  name: string;
  department?: string;
  contact?: string;
  shift?: string;
  badgeNumber?: string;
}

export interface DetectionResult {
  boxes: number[][];
  scores: number[];
  classes: number[];
  count: number;
}