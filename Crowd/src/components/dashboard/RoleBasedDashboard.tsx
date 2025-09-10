import React, { useState, useEffect } from 'react';
import { AdminDashboard } from './AdminDashboard';
import { PoliceDashboard } from './PoliceDashboard';
import { VolunteerDashboard } from './VolunteerDashboard';
import { User, Zone, Alert, CrowdData } from '../../types';

interface RoleBasedDashboardProps {
  user: User;
  zones: Zone[];
  alerts: Alert[];
  crowdData: CrowdData[];
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  onLogout: () => void;
  onAlertAcknowledge: (id: string) => void;
  onDetectionResult: (result: any) => void;
  onRefresh: () => void;
  onExportData: () => void;
}

export const RoleBasedDashboard: React.FC<RoleBasedDashboardProps> = (props) => {
  const { user } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Add safety flag
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    // Prevent refresh if system is stressed
    if (isRefreshing) { // Prevent multiple refreshes
      return;
    }
    setIsRefreshing(true);
    setIsLoading(true);
    try {
      await props.onRefresh();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Listen for emergency stop
    const handleEmergencyStop = () => {
      console.log('Dashboard received emergency stop signal');
      setIsLoading(false);
      setIsRefreshing(false);
    };
    
    window.addEventListener('emergency-stop', handleEmergencyStop);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('emergency-stop', handleEmergencyStop);
    };
  }, []);

  const dashboardProps = {
    ...props,
    onRefresh: handleRefresh,
    isLoading,
    isRefreshing,
    isMobile
  };

  // For demo purposes, we can also show a complete dashboard
  switch (user.role) {
    case 'admin':
      return <AdminDashboard {...dashboardProps} />;
    case 'police':
      return <PoliceDashboard {...dashboardProps} />;
    case 'volunteer':
      return <VolunteerDashboard {...dashboardProps} />;
    default:
      return <AdminDashboard {...dashboardProps} />;
  }
};