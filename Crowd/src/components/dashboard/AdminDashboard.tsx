import React, { useState } from 'react';
import { Users, Map, Video, AlertTriangle, Settings, LogOut, Filter, Download, RefreshCw, TrendingUp, Brain, Shield, UserCheck, Database } from 'lucide-react';
import { CrowdCard } from './CrowdCard';
import { SimpleMap } from '../map/SimpleMap';
import { VideoFeed } from '../detection/VideoFeed';
import { ModelManager } from '../detection/ModelManager';
import { EnhancedRealtimeChart } from '../charts/EnhancedRealtimeChart';
import { SmartAlertsPanel } from '../alerts/SmartAlertsPanel';
import { PredictionPanel } from '../prediction/PredictionPanel';
import { UserManagementPanel } from './UserManagementPanel';
import { SystemMonitoringPanel } from './SystemMonitoringPanel';
import { User, Zone, Alert, CrowdData } from '../../types';

interface AdminDashboardProps {
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
  isMobile?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
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
  isLoading = false,
  isMobile = false
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'detection' | 'alerts' | 'prediction' | 'users' | 'system'>('overview');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [isModelReady, setIsModelReady] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showEvacuationRoutes, setShowEvacuationRoutes] = useState(false);
  const [showFlowIndicators, setShowFlowIndicators] = useState(false);
  const [zoneFilter, setZoneFilter] = useState<'all' | 'safe' | 'moderate' | 'critical'>('all');

  const getTotalPeopleCount = () => {
    return zones.reduce((total, zone) => total + zone.current_count, 0);
  };

  const getCriticalZones = () => {
    return zones.filter(zone => zone.status === 'critical').length;
  };

  const getFilteredZones = () => {
    if (zoneFilter === 'all') return zones;
    return zones.filter(zone => zone.status === zoneFilter);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Admin Stats Cards */}
            <div className={`grid gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-5'}`}>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total People</p>
                    <p className="text-2xl font-bold text-gray-900">{getTotalPeopleCount().toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
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
                    <p className="text-2xl font-bold text-yellow-600">
                      {alerts.filter(a => !a.acknowledged).length}
                    </p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Status</p>
                    <p className={`text-2xl font-bold ${
                      connectionStatus === 'connected' ? 'text-green-600' : 
                      connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {connectionStatus === 'connected' ? 'Online' : 
                       connectionStatus === 'connecting' ? 'Connecting' : 'Demo Mode'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    connectionStatus === 'connected' ? 'bg-green-100' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <Database className={`w-6 h-6 ${
                      connectionStatus === 'connected' ? 'text-green-600' : 
                      connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-purple-600">5</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <UserCheck className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Zone Management */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>Zone Management</h3>
                <div className="flex items-center space-x-3">
                  <div className={`text-xs text-gray-500 ${isMobile ? 'hidden' : 'block'}`}>
                    Total Capacity: {zones.reduce((sum, zone) => sum + zone.capacity, 0).toLocaleString()} people
                  </div>
                  <select
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value as any)}
                    className={`border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-sm'
                    }`}
                  >
                    <option value="all">All Zones ({zones.length})</option>
                    <option value="safe">Safe Zones ({zones.filter(z => z.status === 'safe').length})</option>
                    <option value="moderate">Moderate Zones ({zones.filter(z => z.status === 'moderate').length})</option>
                    <option value="critical">Critical Zones ({zones.filter(z => z.status === 'critical').length})</option>
                  </select>
                  <Filter className={`text-gray-500 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                </div>
              </div>

              {/* Zone Summary Stats */}
              <div className={`grid gap-4 mb-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className={`font-bold text-green-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    {zones.filter(z => z.status === 'safe').length}
                  </div>
                  <div className={`text-green-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>Safe</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <div className={`font-bold text-yellow-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    {zones.filter(z => z.status === 'moderate').length}
                  </div>
                  <div className={`text-yellow-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>Moderate</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className={`font-bold text-red-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    {zones.filter(z => z.status === 'critical').length}
                  </div>
                  <div className={`text-red-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>Critical</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className={`font-bold text-blue-600 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                    {Math.round((getTotalPeopleCount() / zones.reduce((sum, zone) => sum + zone.capacity, 0)) * 100)}%
                  </div>
                  <div className={`text-blue-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>Overall</div>
                </div>
              </div>
              
              <div className={`grid gap-6 ${
                isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
              }`}>
                {getFilteredZones().map((zone) => (
                  <CrowdCard
                    key={zone.id}
                    zone={zone}
                    onClick={() => setSelectedZone(zone.id)}
                  />
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>Crowd Trends</h3>
                {crowdData.length > 0 ? (
                  <EnhancedRealtimeChart 
                    data={crowdData.slice(-15)} 
                    zones={zones.slice(0, 3)}
                    type="line" 
                    showPrediction={false}
                    showCapacityLines={true}
                    showAlerts={false}
                    height={isMobile ? 200 : 250}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <div className="animate-pulse rounded-full h-8 w-8 bg-blue-200 mx-auto mb-2"></div>
                      <p>Loading chart data...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>Zone Distribution</h3>
                {crowdData.length > 0 ? (
                  <EnhancedRealtimeChart 
                    data={crowdData.slice(-10)} 
                    zones={zones.slice(0, 3)}
                    type="bar" 
                    height={isMobile ? 200 : 250}
                    showPrediction={false}
                    showAlerts={false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <div className="text-center">
                      <div className="animate-pulse rounded-full h-8 w-8 bg-blue-200 mx-auto mb-2"></div>
                      <p>Loading chart data...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case 'map':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>Administrative Map Control</h3>
                <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>Zone Heatmap</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showEvacuationRoutes}
                      onChange={(e) => setShowEvacuationRoutes(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>Evacuation Routes</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showFlowIndicators}
                      onChange={(e) => setShowFlowIndicators(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>Flow Indicators</span>
                  </label>
                </div>
              </div>
              <div className={isMobile ? 'h-80' : 'h-96'}>
                <SimpleMap
                  zones={zones}
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
        
      case 'detection':
        return (
          <div className="space-y-6">
            <ModelManager onModelReady={() => setIsModelReady(true)} />
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className={`font-semibold text-gray-900 mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>AI Detection Management</h3>
              <p className={`text-gray-600 mb-4 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Fine-tuned YOLOv8 people detection with cultural behavior analysis and predictions
              </p>
            </div>
            
            <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
              {zones.slice(0, 4).map((zone) => (
                <VideoFeed
                  key={zone.id}
                  locationId={zone.id}
                  onDetectionResult={onDetectionResult}
                  isModelReady={isModelReady}
                  onModelStatusChange={(status) => console.log(`Model status for ${zone.id}:`, status)}
                />
              ))}
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
              zones={zones}
              selectedZone={selectedZone}
            />
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <UserManagementPanel currentUser={user} />
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <SystemMonitoringPanel />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b">
        <div className={`mx-auto ${isMobile ? 'px-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8'}`}>
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-red-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>Admin Dashboard - Divya Drishti (दिव्य  दृष्टि)</h1>
                <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Full System Administration</p>
              </div>
            </div>
            
            <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-4'}`}>
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className={`flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 ${
                  isMobile ? 'px-2 py-1' : 'px-3 py-2'
                }`}
              >
                <RefreshCw className={`${isLoading ? 'animate-spin' : ''} ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                {!isMobile && <span>Refresh</span>}
              </button>
              
              <button
                onClick={onExportData}
                className={`flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors ${
                  isMobile ? 'px-2 py-1' : 'px-3 py-2'
                }`}
              >
                <Download className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                {!isMobile && <span>Export</span>}
              </button>
              
              {!isMobile && (
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-sm text-gray-600">
                    {connectionStatus === 'connected' ? 'System Online' : 
                     connectionStatus === 'connecting' ? 'Connecting' : 'Demo Mode'}
                  </span>
                </div>
              )}
              
              <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                <div className="font-medium">{user.profile.name}</div>
                {!isMobile && <div className="text-xs">{user.profile.department}</div>}
              </div>
              
              <button
                onClick={onLogout}
                className={`flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors ${
                  isMobile ? 'px-2 py-1' : 'px-3 py-2'
                }`}
              >
                <LogOut className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                {!isMobile && <span>Logout</span>}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="bg-white border-b">
        <div className={`mx-auto ${isMobile ? 'px-2' : 'max-w-7xl px-4 sm:px-6 lg:px-8'}`}>
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'System Overview', icon: Users },
              { id: 'map', label: 'Map Control', icon: Map },
              { id: 'detection', label: 'Detection Management', icon: Video },
              { id: 'alerts', label: 'Alert Management', icon: AlertTriangle },
              { id: 'prediction', label: 'YOLOv8 People Predictions', icon: Brain },
              { id: 'users', label: 'User Management', icon: UserCheck },
              { id: 'system', label: 'System Monitor', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 border-b-2 font-medium transition-colors ${
                  isMobile ? 'px-2 py-2 text-xs' : 'px-4 py-3 text-sm'
                } ${
                  activeTab === id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
                <span className={isMobile ? 'hidden sm:inline' : ''}>{isMobile ? label.split(' ')[0] : label}</span>
                {id === 'alerts' && alerts.filter(a => !a.acknowledged).length > 0 && (
                  <span className={`bg-red-500 text-white rounded-full ${
                    isMobile ? 'text-xs px-1 py-0.5' : 'text-xs px-2 py-1'
                  }`}>
                    {alerts.filter(a => !a.acknowledged).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`mx-auto ${isMobile ? 'px-4 py-4' : 'max-w-7xl px-4 sm:px-6 lg:px-8 py-8'}`}>
        {renderTabContent()}
      </main>
    </div>
  );
};