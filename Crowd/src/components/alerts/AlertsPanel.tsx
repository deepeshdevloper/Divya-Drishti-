import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X, Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { Alert } from '../../types';
import { supabaseService } from '../../services/supabaseService';

interface AlertsPanelProps {
  alerts: Alert[];
  onAlertAcknowledge: (id: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onAlertAcknowledge }) => {
  const [filter, setFilter] = useState<'all' | 'warning' | 'critical' | 'info'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Play sound and show notification for new critical alerts
    const criticalAlerts = alerts.filter(alert => 
      alert.type === 'critical' && !alert.acknowledged
    );
    
    if (criticalAlerts.length > 0) {
      if (soundEnabled) {
        playAlertSound();
      }
      
      if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        criticalAlerts.forEach(alert => {
          new Notification('Critical Alert - Divya Drishti (दिव्य  दृष्टि)', {
            body: alert.message,
            icon: '/favicon.ico',
            tag: alert.id,
          });
        });
      }
    }
  }, [alerts, soundEnabled, notificationsEnabled]);

  const playAlertSound = () => {
    // Create audio context for alert sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
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

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' || alert.type === filter
  );

  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900">Alerts</h2>
          {unacknowledgedCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {unacknowledgedCount} new
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
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No alerts to display</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getAlertColor(alert.type)} ${
                alert.acknowledged ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">{alert.location_id}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                      {alert.type === 'critical' && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium animate-pulse">
                          URGENT
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => onAlertAcknowledge(alert.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Alert Statistics */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-red-600">
              {alerts.filter(a => a.type === 'critical' && !a.acknowledged).length}
            </div>
            <div className="text-xs text-gray-600">Critical</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">
              {alerts.filter(a => a.type === 'warning' && !a.acknowledged).length}
            </div>
            <div className="text-xs text-gray-600">Warning</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-blue-600">
              {alerts.filter(a => a.type === 'info' && !a.acknowledged).length}
            </div>
            <div className="text-xs text-gray-600">Info</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-600">
              {alerts.filter(a => a.acknowledged).length}
            </div>
            <div className="text-xs text-gray-600">Resolved</div>
          </div>
        </div>
      </div>
    </div>
  );
};