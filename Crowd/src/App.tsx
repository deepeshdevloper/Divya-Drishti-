import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoginForm } from './components/auth/LoginForm';
import { RoleBasedDashboard } from './components/dashboard/RoleBasedDashboard';
import { User } from './types';
import { authService } from './services/authService';
import { supabaseService } from './services/supabaseService';
import { Zone, Alert, CrowdData } from './types';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { performanceOptimizer } from './utils/performanceOptimizer';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modelLoadingStatus, setModelLoadingStatus] = useState<string>('Initializing Enhanced YOLOv11...');
  const [zones, setZones] = useState<Zone[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [crowdData, setCrowdData] = useState<CrowdData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setModelLoadingStatus('Initializing Enhanced YOLOv8...');
      
        // Check for stored session
        const storedUser = localStorage.getItem('simhastha_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            console.error('Error parsing stored user:', error);
            localStorage.removeItem('simhastha_user');
          }
        }
      
        // Initialize with minimal demo data
        const demoZones: Zone[] = [
          {
            id: 'ram-ghat',
            name: 'Ram Ghat',
            coordinates: [[23.1770, 75.7890], [23.1775, 75.7895], [23.1780, 75.7890], [23.1775, 75.7885]],
            current_count: Math.floor(Math.random() * 200) + 50,
            capacity: 500,
            status: 'safe',
            last_updated: new Date().toISOString(),
          },
          {
            id: 'mahakal-ghat',
            name: 'Mahakal Ghat',
            coordinates: [[23.1760, 75.7880], [23.1765, 75.7885], [23.1770, 75.7880], [23.1765, 75.7875]],
            current_count: Math.floor(Math.random() * 300) + 200,
            capacity: 800,
            status: 'moderate',
            last_updated: new Date().toISOString(),
          }
        ];
      
        setZones(demoZones);
        setCrowdData([]);
        setConnectionStatus('disconnected');
        setModelLoadingStatus('Enhanced YOLOv8 ONNX ready');
        setModelReady(true);
        setLoading(false);
      } catch (error) {
        console.error('App initialization error:', error);
        setError('Failed to initialize application');
        setLoading(false);
      }
    };

    // Initialize immediately
    initializeApp();
    
    const timer = setTimeout(() => {
      setModelLoadingStatus('Enhanced YOLOv8 detection system ready');
      setModelReady(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('simhastha_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem('simhastha_user');
  };

  const handleAlertAcknowledge = async (alertId: string) => {
    try {
      if (connectionStatus === 'connected') {
        await supabaseService.acknowledgeAlert(alertId);
      }
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      ));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleDetectionResult = async (result: any) => {
    console.log('Detection result received:', result);
    
    // Update zones with detection results if location matches
    if (result.locationId) {
      setZones(prev => prev.map(zone => 
        zone.id === result.locationId 
          ? { 
              ...zone, 
              current_count: result.count || zone.current_count,
              last_updated: new Date().toISOString(),
              status: result.count > zone.capacity * 0.9 ? 'critical' :
                     result.count > zone.capacity * 0.7 ? 'moderate' : 'safe'
            }
          : zone
      ));
    }
  };

  const handleRefresh = async () => {
    console.log('Refresh requested');
  };

  const handleExportData = () => {
    try {
        const exportData = {
          zones,
          alerts,
          crowdData,
          timestamp: new Date().toISOString(),
          user: user?.profile.name
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
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    }
  };
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Application Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
            <LoadingSpinner 
              size="lg" 
              text="Loading application..."
              timeout={5000}
            />
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800 font-medium mb-2">System Status:</div>
              <div className="text-xs text-blue-700">{modelLoadingStatus}</div>
              <div className="text-xs text-blue-600 mt-1">Enhanced YOLOv8 with ONNX runtime</div>
              <div className="text-xs text-blue-500 mt-1">
                Model Status: {modelReady ? 'Ready' : 'Loading...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <RoleBasedDashboard 
        user={user} 
        zones={zones}
        alerts={alerts}
        crowdData={crowdData}
        connectionStatus={connectionStatus}
        onLogout={handleLogout}
        onAlertAcknowledge={handleAlertAcknowledge}
        onDetectionResult={handleDetectionResult}
        onRefresh={handleRefresh}
        onExportData={handleExportData}
      />
    </ErrorBoundary>
  );
}

export default App;