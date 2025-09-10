import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X, Bell, BellOff, Volume2, VolumeX, Filter, Search, Clock, MapPin, User, Zap, Shield, Heart } from 'lucide-react';
import { Alert, User as UserType } from '../../types';
import { supabaseService } from '../../services/supabaseService';

interface EnhancedAlertsPanelProps {
  alerts: Alert[];
  onAlertAcknowledge: (id: string) => void;
  user: UserType;
  zones: any[];
}

export const EnhancedAlertsPanel: React.FC<EnhancedAlertsPanelProps> = ({ 
  alerts, 
  onAlertAcknowledge, 
  user,
  zones 
}) => {
  const [filter, setFilter] = useState<'all' | 'warning' | 'critical' | 'info'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sortBy, setSortBy] = useState<'timestamp' | 'type' | 'location'>('timestamp');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [alertStats, setAlertStats] = useState({
    total: 0,
    critical: 0,
    warning: 0,
    info: 0,
    acknowledged: 0,
    avgResponseTime: 0
  });

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    updateAlertStats();
  }, [alerts]);

  useEffect(() => {
    // Play sound and show notification for new critical alerts
    const criticalAlerts = alerts.filter(alert => 
      alert.type === 'critical' && !alert.acknowledged
    );
    
    if (criticalAlerts.length > 0) {
      if (soundEnabled) {
        playAlertSound(criticalAlerts[0].type);
      }
      
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        criticalAlerts.forEach(alert => {
          new Notification('Critical Alert - Divya Drishti (दिव्य  दृष्टि)', {
            body: alert.message,
            icon: '/favicon.ico',
            tag: alert.id,
            badge: '/favicon.ico',
            requireInteraction: true,
            actions: [
              { action: 'acknowledge', title: 'Acknowledge' },
              { action: 'view', title: 'View Details' }
            ]
          });
        });
      }
    }
  }, [alerts, soundEnabled, notificationsEnabled]);

  const updateAlertStats = () => {
    const stats = {
      total: alerts.length,
      critical: alerts.filter(a => a.type === 'critical').length,
      warning: alerts.filter(a => a.type === 'warning').length,
      info: alerts.filter(a => a.type === 'info').length,
      acknowledged: alerts.filter(a => a.acknowledged).length,
      avgResponseTime: calculateAvgResponseTime()
    };
    setAlertStats(stats);
  };

  const calculateAvgResponseTime = () => {
    const acknowledgedAlerts = alerts.filter(a => a.acknowledged);
    if (acknowledgedAlerts.length === 0) return 0;
    
    // Simulate response time calculation
    return Math.round(Math.random() * 300 + 60); // 60-360 seconds
  };

  const playAlertSound = (type: string) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different sounds for different alert types
    if (type === 'critical') {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    } else if (type === 'warning') {
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    } else {
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    }
    
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPriorityBadge = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-600 text-white animate-pulse';
      case 'warning': return 'bg-yellow-600 text-white';
      case 'info': return 'bg-blue-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getUserRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-600" />;
      case 'police': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'volunteer': return <Heart className="w-4 h-4 text-purple-600" />;
      default: return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredAlerts = alerts
    .filter(alert => {
      const matchesFilter = filter === 'all' || alert.type === filter;
      const matchesSearch = alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.location_id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAcknowledged = showAcknowledged || !alert.acknowledged;
      const hasPermission = user.permissions.canViewAllZones || 
                           user.assigned_zones.includes(alert.location_id);
      
      return matchesFilter && matchesSearch && matchesAcknowledged && hasPermission;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'type':
          const typeOrder = { critical: 0, warning: 1, info: 2 };
          return typeOrder[a.type as keyof typeof typeOrder] - typeOrder[b.type as keyof typeof typeOrder];
        case 'location':
          return a.location_id.localeCompare(b.location_id);
        default:
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });

  const unacknowledgedCount = alerts.filter(alert => 
    !alert.acknowledged && 
    (user.permissions.canViewAllZones || user.assigned_zones.includes(alert.location_id))
  ).length;

  const createManualAlert = async (type: 'warning' | 'critical' | 'info', message: string, locationId: string) => {
    try {
      const alertData = {
        type,
        message,
        location_id: locationId,
        timestamp: new Date().toISOString(),
        acknowledged: false,
      };
      
      await supabaseService.createAlert(alertData);
    } catch (error) {
      console.error('Error creating manual alert:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {getUserRoleIcon(user.role)}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Alert Management</h2>
            <p className="text-sm text-gray-600">
              {user.role === 'admin' ? 'System-wide alert monitoring' : 
               user.role === 'police' ? 'Security alert management' : 
               'Zone-specific alerts'}
            </p>
          </div>
          {unacknowledgedCount > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium animate-pulse">
              {unacknowledgedCount} urgent
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Alert Settings */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                soundEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              title={soundEnabled ? 'Disable sound alerts' : 'Enable sound alerts'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                notificationsEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
            >
              {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
              }`}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-gray-900">{alertStats.total}</div>
          <div className="text-xs text-gray-600">Total Alerts</div>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
          <div className="text-xs text-red-600">Critical</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{alertStats.warning}</div>
          <div className="text-xs text-yellow-600">Warning</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{alertStats.info}</div>
          <div className="text-xs text-blue-600">Info</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{alertStats.acknowledged}</div>
          <div className="text-xs text-green-600">Resolved</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="timestamp">Sort by Time</option>
            <option value="type">Sort by Priority</option>
            <option value="location">Sort by Location</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showAcknowledged}
              onChange={(e) => setShowAcknowledged(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show Resolved</span>
          </label>

          {user.permissions.canAcknowledgeAlerts && (
            <button
              onClick={() => {
                const unacknowledged = alerts.filter(a => !a.acknowledged);
                unacknowledged.forEach(alert => onAlertAcknowledge(alert.id));
              }}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              disabled={unacknowledgedCount === 0}
            >
              Acknowledge All
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No alerts to display</p>
            <p className="text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'All systems operating normally'}
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const zone = zones.find(z => z.id === alert.location_id);
            const timeAgo = Math.floor((Date.now() - new Date(alert.timestamp).getTime()) / 60000);
            
            return (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border transition-all hover:shadow-md ${getAlertColor(alert.type)} ${
                  alert.acknowledged ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(alert.type)}`}>
                          {alert.type.toUpperCase()}
                        </span>
                        {alert.type === 'critical' && !alert.acknowledged && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium animate-pulse">
                            URGENT
                          </span>
                        )}
                        {alert.acknowledged && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            RESOLVED
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm font-medium text-gray-900 mb-2">{alert.message}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{zone?.name || alert.location_id}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {timeAgo < 1 ? 'Just now' : 
                             timeAgo < 60 ? `${timeAgo}m ago` : 
                             `${Math.floor(timeAgo / 60)}h ago`}
                          </span>
                        </div>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>

                      {/* Zone Status Context */}
                      {zone && (
                        <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                          <div className="flex items-center justify-between">
                            <span>Zone Status:</span>
                            <span className={`font-medium capitalize ${
                              zone.status === 'safe' ? 'text-green-600' :
                              zone.status === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {zone.status} ({zone.current_count}/{zone.capacity})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!alert.acknowledged && user.permissions.canAcknowledgeAlerts && (
                      <button
                        onClick={() => onAlertAcknowledge(alert.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}
                    
                    <button
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Alert Creation (Admin/Police only) */}
      {(user.role === 'admin' || user.role === 'police') && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Create Manual Alert</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => {
                const message = prompt('Enter warning message:');
                const locationId = prompt('Enter location ID:');
                if (message && locationId) {
                  createManualAlert('warning', message, locationId);
                }
              }}
              className="flex items-center justify-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Create Warning</span>
            </button>
            
            <button
              onClick={() => {
                const message = prompt('Enter critical alert message:');
                const locationId = prompt('Enter location ID:');
                if (message && locationId) {
                  createManualAlert('critical', message, locationId);
                }
              }}
              className="flex items-center justify-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Create Critical</span>
            </button>
            
            <button
              onClick={() => {
                const message = prompt('Enter info message:');
                const locationId = prompt('Enter location ID:');
                if (message && locationId) {
                  createManualAlert('info', message, locationId);
                }
              }}
              className="flex items-center justify-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Create Info</span>
            </button>
          </div>
        </div>
      )}

      {/* Response Time Analytics */}
      {user.role === 'admin' && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-900 mb-3">Response Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-blue-600 font-medium">Avg Response Time</div>
              <div className="text-lg font-bold text-blue-900">{alertStats.avgResponseTime}s</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-green-600 font-medium">Resolution Rate</div>
              <div className="text-lg font-bold text-green-900">
                {alertStats.total > 0 ? Math.round((alertStats.acknowledged / alertStats.total) * 100) : 0}%
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-purple-600 font-medium">Active Operators</div>
              <div className="text-lg font-bold text-purple-900">
                {user.role === 'admin' ? '5' : user.role === 'police' ? '3' : '1'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};