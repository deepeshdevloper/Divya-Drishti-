import React, { useState, useEffect } from 'react';
import { RoleBasedDashboard } from './RoleBasedDashboard';
import { User, Zone, Alert, CrowdData } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { MOCK_ZONES } from '../../data/mockData';

interface DashboardProps {
  user: User;
  onLogout: () => void;
  zones?: Zone[];
  alerts?: Alert[];
  crowdData?: CrowdData[];
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onLogout,
  zones: propZones,
  alerts: propAlerts,
  crowdData: propCrowdData,
  connectionStatus
}) => {
  const [zones, setZones] = useState<Zone[]>(propZones || MOCK_ZONES);
  const [alerts, setAlerts] = useState<Alert[]>(propAlerts || []);
  const [crowdData, setCrowdData] = useState<CrowdData[]>(propCrowdData || []);

  useEffect(() => {
    if (propZones) setZones(propZones);
  }, [propZones]);

  useEffect(() => {
    if (propAlerts) setAlerts(propAlerts);
  }, [propAlerts]);

  useEffect(() => {
    if (propCrowdData) setCrowdData(propCrowdData);
  }, [propCrowdData]);

  const handleAlertAcknowledge = async (alertId: string) => {
    try {
      if (connectionStatus === 'connected') {
        await supabaseService.acknowledgeAlert(alertId);
      }
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleDetectionResult = (result: any) => {
    console.log('Detection result received:', result);
  };

  const handleRefresh = async () => {
    try {
      if (connectionStatus === 'connected') {
        const [zonesData, alertsData, crowdDataResult] = await Promise.all([
          supabaseService.getLiveZoneStatus(),
          supabaseService.getRecentAlerts(),
          supabaseService.getCrowdData(undefined, 50)
        ]);
        
        if (zonesData) {
          setZones(zonesData.map(zone => ({
            id: zone.id,
            name: zone.name,
            coordinates: zone.coordinates as [number, number][],
            current_count: zone.current_count || 0,
            capacity: zone.capacity,
            status: zone.status as 'safe' | 'moderate' | 'critical',
            last_updated: zone.last_updated || new Date().toISOString()
          })));
        }
        
        if (alertsData) {
          setAlerts(alertsData.map(alert => ({
            id: alert.id,
            type: alert.type as 'info' | 'warning' | 'critical',
            message: alert.message,
            location_id: alert.location_id,
            timestamp: alert.timestamp,
            acknowledged: alert.acknowledged
          })));
        }
        
        if (crowdDataResult) {
          setCrowdData(crowdDataResult.map(data => ({
            id: data.id,
            location_id: data.location_id,
            timestamp: data.timestamp,
            people_count: data.people_count,
            source: data.source as 'video' | 'image' | 'cctv',
            roi: data.roi as [number, number, number, number],
            created_at: data.created_at
          })));
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleExportData = () => {
    const exportData = {
      zones,
      alerts,
      crowdData: crowdData.slice(0, 50),
      timestamp: new Date().toISOString(),
      user: user.profile.name
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simhastha-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <RoleBasedDashboard
      user={user}
      onLogout={onLogout}
      zones={zones}
      alerts={alerts}
      crowdData={crowdData}
      connectionStatus={connectionStatus}
      onAlertAcknowledge={handleAlertAcknowledge}
      onDetectionResult={handleDetectionResult}
      onRefresh={handleRefresh}
      onExportData={handleExportData}
    />
  );
};