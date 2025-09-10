import React, { useState, useEffect } from 'react';
import { Server, Database, Wifi, Activity, AlertCircle, CheckCircle, Clock, HardDrive, Cpu, MemoryStick } from 'lucide-react';

export const SystemMonitoringPanel: React.FC = () => {
  const [systemStats, setSystemStats] = useState({
    uptime: '2d 14h 32m',
    totalRequests: 45672,
    activeConnections: 23,
    databaseSize: '2.4 GB',
    memoryUsage: 68,
    cpuUsage: 42,
    diskUsage: 35,
    networkLatency: 12
  });

  const [services, setServices] = useState([
    { name: 'Web Server', status: 'online', uptime: '99.9%', lastCheck: new Date() },
    { name: 'Database', status: 'online', uptime: '99.8%', lastCheck: new Date() },
    { name: 'Real-time Service', status: 'online', uptime: '99.7%', lastCheck: new Date() },
    { name: 'Detection Engine', status: 'online', uptime: '98.5%', lastCheck: new Date() },
    { name: 'Alert System', status: 'online', uptime: '99.9%', lastCheck: new Date() },
    { name: 'File Storage', status: 'warning', uptime: '97.2%', lastCheck: new Date() },
  ]);

  const [logs, setLogs] = useState([
    { timestamp: new Date(), level: 'info', message: 'System startup completed successfully', service: 'System' },
    { timestamp: new Date(Date.now() - 300000), level: 'info', message: 'Database connection established', service: 'Database' },
    { timestamp: new Date(Date.now() - 600000), level: 'warning', message: 'High memory usage detected', service: 'System' },
    { timestamp: new Date(Date.now() - 900000), level: 'info', message: 'Detection model loaded successfully', service: 'Detection' },
    { timestamp: new Date(Date.now() - 1200000), level: 'error', message: 'Failed to connect to external API', service: 'External' },
  ]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemStats(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 10),
        activeConnections: Math.max(1, prev.activeConnections + Math.floor(Math.random() * 6) - 3),
        memoryUsage: Math.max(30, Math.min(90, prev.memoryUsage + Math.floor(Math.random() * 6) - 3)),
        cpuUsage: Math.max(10, Math.min(80, prev.cpuUsage + Math.floor(Math.random() * 10) - 5)),
        networkLatency: Math.max(5, Math.min(50, prev.networkLatency + Math.floor(Math.random() * 6) - 3))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Uptime</p>
              <p className="text-2xl font-bold text-green-600">{systemStats.uptime}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Server className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-blue-600">{systemStats.totalRequests.toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Connections</p>
              <p className="text-2xl font-bold text-purple-600">{systemStats.activeConnections}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Wifi className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Database Size</p>
              <p className="text-2xl font-bold text-gray-900">{systemStats.databaseSize}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg">
              <Database className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{systemStats.cpuUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  systemStats.cpuUsage > 70 ? 'bg-red-500' :
                  systemStats.cpuUsage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${systemStats.cpuUsage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MemoryStick className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{systemStats.memoryUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  systemStats.memoryUsage > 80 ? 'bg-red-500' :
                  systemStats.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${systemStats.memoryUsage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Disk Usage</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{systemStats.diskUsage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  systemStats.diskUsage > 80 ? 'bg-red-500' :
                  systemStats.diskUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${systemStats.diskUsage}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-700">Network Latency</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{systemStats.networkLatency}ms</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  systemStats.networkLatency > 30 ? 'bg-red-500' :
                  systemStats.networkLatency > 20 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(systemStats.networkLatency * 2, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Service Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{service.name}</h4>
                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                  {getStatusIcon(service.status)}
                  <span className="capitalize">{service.status}</span>
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="font-medium">{service.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Check:</span>
                  <span className="font-medium">{service.lastCheck.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent System Logs</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className={`p-3 rounded-lg border ${getLogLevelColor(log.level)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getLogLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{log.service}</span>
                  </div>
                  <p className="text-sm text-gray-700">{log.message}</p>
                </div>
                <span className="text-xs text-gray-500 ml-4">
                  {log.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};