import React, { useState } from 'react';
import { Heart, Map, AlertTriangle, LogOut, RefreshCw, Users, Clock, MapPin, Phone } from 'lucide-react';
import { CrowdCard } from './CrowdCard';
import { SimpleMap } from '../map/SimpleMap';
import { CrowdChart } from '../charts/CrowdChart';
import { User, Zone, Alert, CrowdData } from '../../types';

interface VolunteerDashboardProps {
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

export const VolunteerDashboard: React.FC<VolunteerDashboardProps> = ({
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
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'alerts'>('overview');
  const [selectedZone, setSelectedZone] = useState<string>('');


  // Filter zones based on user assignments
  const getAssignedZones = () => {
    return zones.filter(zone => user.assigned_zones.includes(zone.id));
  };

  const assignedZones = getAssignedZones();

  // Filter alerts for assigned zones
  const getRelevantAlerts = () => {
    return alerts.filter(alert => 
      user.assigned_zones.includes(alert.location_id) && !alert.acknowledged
    );
  };

  const getTotalPeopleCount = () => {
    return assignedZones.reduce((total, zone) => total + zone.current_count, 0);
  };

  const getCriticalZones = () => {
    return assignedZones.filter(zone => zone.status === 'critical').length;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Volunteer Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">My Zones</p>
                    <p className="text-2xl font-bold text-purple-900">{assignedZones.length}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">People Count</p>
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
                    <p className="text-sm font-medium text-gray-600">Alerts</p>
                    <p className="text-2xl font-bold text-yellow-600">{getRelevantAlerts().length}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Volunteer Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Volunteer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2">Personal Details</h4>
                  <div className="space-y-1 text-sm text-purple-800">
                    <p><strong>Name:</strong> {user.profile.name}</p>
                    <p><strong>ID:</strong> {user.profile.badgeNumber}</p>
                    <p><strong>Department:</strong> {user.profile.department}</p>
                    <p><strong>Contact:</strong> {user.profile.contact}</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Shift Information</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>Shift:</strong> {user.profile.shift}</p>
                    <p><strong>Status:</strong> Active</p>
                    <p><strong>Started:</strong> {new Date().toLocaleTimeString()}</p>
                    <p><strong>Zones:</strong> {user.assigned_zones.length} assigned</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Zones */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Assigned Zones</h3>
              {assignedZones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No zones assigned</p>
                  <p className="text-sm">Contact your supervisor for zone assignments</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {assignedZones.map((zone) => (
                    <CrowdCard
                      key={zone.id}
                      zone={zone}
                      onClick={() => setSelectedZone(zone.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                  <Phone className="w-5 h-5 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium text-red-900">Emergency</div>
                    <div className="text-sm text-red-700">Call 108</div>
                  </div>
                </button>
                
                <button className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium text-blue-900">Police</div>
                    <div className="text-sm text-blue-700">Call 100</div>
                  </div>
                </button>
                
                <button className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                  <Phone className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium text-green-900">Medical</div>
                    <div className="text-sm text-green-700">Call 102</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Charts */}
            {assignedZones.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Activity</h3>
                <CrowdChart data={crowdData.filter(data => assignedZones.some(zone => zone.id === data.location_id))} type="line" />
              </div>
            )}
          </div>
        );
        
      case 'map':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">My Zone Map</h3>
                <div className="text-sm text-gray-600">
                  Showing {assignedZones.length} assigned zones
                </div>
              </div>
              <div className="h-96">
                <SimpleMap
                  zones={assignedZones}
                  showHeatmap={true}
                  showEvacuationRoutes={false}
                  showFlowIndicators={false}
                  selectedZone={selectedZone}
                  onZoneClick={(zone) => setSelectedZone(zone.id)}
                />
              </div>
            </div>

            {/* Zone Details */}
            {selectedZone && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Details</h3>
                {(() => {
                  const zone = assignedZones.find(z => z.id === selectedZone);
                  if (!zone) return null;
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{zone.name}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>Current Count:</strong> {zone.current_count}</p>
                          <p><strong>Capacity:</strong> {zone.capacity}</p>
                          <p><strong>Status:</strong> <span className={`capitalize ${
                            zone.status === 'safe' ? 'text-green-600' :
                            zone.status === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                          }`}>{zone.status}</span></p>
                          <p><strong>Last Updated:</strong> {new Date(zone.last_updated).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2">Volunteer Tasks</h4>
                        <div className="space-y-1 text-sm text-blue-800">
                          <p>• Monitor crowd flow</p>
                          <p>• Assist pilgrims with directions</p>
                          <p>• Report any incidents</p>
                          <p>• Help maintain queue discipline</p>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-2">Emergency Contacts</h4>
                        <div className="space-y-1 text-sm text-green-800">
                          <p><strong>Supervisor:</strong> +91-9876543210</p>
                          <p><strong>Medical Team:</strong> 102</p>
                          <p><strong>Security:</strong> 100</p>
                          <p><strong>Control Room:</strong> +91-9876543211</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        );
        
      case 'alerts':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Zone Alerts</h3>
              {getRelevantAlerts().length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No active alerts for your zones</p>
                  <p className="text-sm">All zones are operating normally</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getRelevantAlerts().map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border ${
                        alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                          alert.type === 'critical' ? 'text-red-600' :
                          alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{alert.message}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">{alert.location_id}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Response Instructions</h3>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Critical Alerts</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Immediately contact your supervisor</li>
                    <li>• Help guide people to safe areas</li>
                    <li>• Do not leave your assigned zone</li>
                    <li>• Follow evacuation procedures if instructed</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Warning Alerts</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Monitor the situation closely</li>
                    <li>• Be prepared to assist with crowd control</li>
                    <li>• Report any changes to control room</li>
                    <li>• Help maintain orderly movement</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Volunteer Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Volunteer Dashboard - Divya Drishti (दिव्य  दृष्टि)</h1>
                <p className="text-sm text-gray-600">Seva & Crowd Assistance</p>
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

      {/* Volunteer Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'My Dashboard', icon: Users },
              { id: 'map', label: 'Zone Map', icon: Map },
              { id: 'alerts', label: 'Zone Alerts', icon: AlertTriangle },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {id === 'alerts' && getRelevantAlerts().length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {getRelevantAlerts().length}
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