import React, { useState } from 'react';
import { Shield, Map, AlertTriangle, LogOut, RefreshCw, TrendingUp, Brain, Radio, Users, Eye } from 'lucide-react';
import { CrowdCard } from './CrowdCard';
import { SimpleMap } from '../map/SimpleMap';
import { CrowdChart } from '../charts/CrowdChart';
import { SmartAlertsPanel } from '../alerts/SmartAlertsPanel';
import { PredictionPanel } from '../prediction/PredictionPanel';
import { EvacuationControlPanel } from './EvacuationControlPanel';
import { User, Zone, Alert, CrowdData } from '../../types';

interface PoliceDashboardProps {
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
  isLoading?: boolean;
}

export const PoliceDashboard: React.FC<PoliceDashboardProps> = ({
  user,
  zones,
  alerts,
  crowdData,
  connectionStatus,
  onLogout,
  onAlertAcknowledge,
  onDetectionResult,
  onRefresh,
  onExportData,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'alerts' | 'prediction' | 'evacuation'>('overview');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showEvacuationRoutes, setShowEvacuationRoutes] = useState(true);
  const [showFlowIndicators, setShowFlowIndicators] = useState(true);


  // Filter zones based on user permissions
  const getAccessibleZones = () => {
    if (user.permissions.canViewAllZones) {
      return zones;
    }
    return zones.filter(zone => user.assigned_zones.includes(zone.id));
  };

  const accessibleZones = getAccessibleZones();

  const getTotalPeopleCount = () => {
    return accessibleZones.reduce((total, zone) => total + zone.current_count, 0);
  };

  const getCriticalZones = () => {
    return accessibleZones.filter(zone => zone.status === 'critical').length;
  };

  const getActiveAlerts = () => {
    return alerts.filter(alert => 
      !alert.acknowledged && 
      (user.permissions.canViewAllZones || user.assigned_zones.includes(alert.location_id))
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Police Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Assigned Zones</p>
                    <p className="text-2xl font-bold text-blue-900">{accessibleZones.length}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total People</p>
                    <p className="text-2xl font-bold text-gray-900">{getTotalPeopleCount().toLocaleString()}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Critical Zones</p>
                    <p className="text-2xl font-bold text-red-600">{getCriticalZones()}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                    <p className="text-2xl font-bold text-yellow-600">{getActiveAlerts().length}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Radio className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Duty Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Duty Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Officer Details</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>Name:</strong> {user.profile.name}</p>
                    <p><strong>Badge:</strong> {user.profile.badgeNumber}</p>
                    <p><strong>Department:</strong> {user.profile.department}</p>
                    <p><strong>Contact:</strong> {user.profile.contact}</p>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Current Shift</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <p><strong>Shift:</strong> {user.profile.shift}</p>
                    <p><strong>Status:</strong> On Duty</p>
                    <p><strong>Started:</strong> {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">Emergency Contacts</h4>
                  <div className="space-y-1 text-sm text-purple-800">
                    <p><strong>Control Room:</strong> 100</p>
                    <p><strong>Medical:</strong> 102</p>
                    <p><strong>Fire:</strong> 101</p>
                    <p><strong>Emergency:</strong> 108</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Zone Cards */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Zones</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {accessibleZones.map((zone) => (
                  <CrowdCard
                    key={zone.id}
                    zone={zone}
                    onClick={() => setSelectedZone(zone.id)}
                  />
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Crowd Trends</h3>
                <CrowdChart data={crowdData} type="line" />
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Status</h3>
                <CrowdChart data={crowdData} type="bar" />
              </div>
            </div>
          </div>
        );
        
      case 'map':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tactical Map View</h3>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Zone Heatmap</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showEvacuationRoutes}
                      onChange={(e) => setShowEvacuationRoutes(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Evacuation Routes</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showFlowIndicators}
                      onChange={(e) => setShowFlowIndicators(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Flow Indicators</span>
                  </label>
                </div>
              </div>
              <div className="h-96">
                <SimpleMap
                  zones={accessibleZones}
                  showHeatmap={showHeatmap}
                  showEvacuationRoutes={showEvacuationRoutes}
                  showFlowIndicators={showFlowIndicators}
                  selectedZone={selectedZone}
                  onZoneClick={(zone) => setSelectedZone(zone.id)}
                />
              </div>
            </div>
          </div>
        );
        
      case 'alerts':
        return (
          <div className="space-y-6">
            <SmartAlertsPanel
              alerts={alerts}
              zones={zones}
              onAlertAcknowledge={onAlertAcknowledge}
              user={user}
            />
          </div>
        );
        
      case 'prediction':
        return (
          <div className="space-y-6">
            <PredictionPanel
              zones={accessibleZones}
              selectedZone={selectedZone}
            />
          </div>
        );

      case 'evacuation':
        return (
          <div className="space-y-6">
            <EvacuationControlPanel
              zones={accessibleZones}
              user={user}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Police Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Police Dashboard - Divya Drishti (दिव्य  दृष्टि)</h1>
                <p className="text-sm text-gray-600">Law Enforcement & Crowd Control</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              {user.permissions.canExportData && (
                <button
                  onClick={onExportData}
                  className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Report</span>
                </button>
              )}
              
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">On Duty</span>
              </div>
              
              <div className="text-sm text-gray-600">
                <div className="font-medium">{user.profile.name}</div>
                <div className="text-xs">{user.profile.badgeNumber}</div>
              </div>
              
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>End Shift</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Police Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Duty Overview', icon: Users },
              { id: 'map', label: 'Tactical Map', icon: Map },
              { id: 'alerts', label: 'Active Alerts', icon: AlertTriangle },
              ...(user.permissions.canAccessPredictions ? [{ id: 'prediction', label: 'Predictions', icon: Brain }] : []),
              ...(user.permissions.canControlEvacuation ? [{ id: 'evacuation', label: 'Evacuation Control', icon: Radio }] : []),
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {id === 'alerts' && getActiveAlerts().length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {getActiveAlerts().length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>
    </div>
  );
};