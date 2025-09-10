import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import { CrowdData, Zone } from '../../types';

interface RealtimeChartProps {
  data: CrowdData[];
  zones: Zone[];
  type: 'line' | 'area' | 'bar' | 'pie';
  height?: number;
  timeRange?: '1h' | '6h' | '24h' | '7d';
  showPrediction?: boolean;
  showCapacityLines?: boolean;
  showAlerts?: boolean;
}

export const RealtimeChart: React.FC<RealtimeChartProps> = ({ 
  data, 
  zones, 
  type, 
  height = 300, 
  timeRange = '1h',
  showPrediction = false,
  showCapacityLines = true,
  showAlerts = true
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isRealtime, setIsRealtime] = useState(true);

  useEffect(() => {
    generateChartData();
    
    if (isRealtime) {
      const interval = setInterval(generateChartData, 5000);
      return () => clearInterval(interval);
    }
  }, [data, zones, timeRange, isRealtime]);

  const generateChartData = () => {
    const now = new Date();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    }[timeRange];

    const startTime = new Date(now.getTime() - timeRangeMs);
    
    // Generate time points
    const timePoints = [];
    const interval = timeRangeMs / 20; // 20 data points
    
    for (let i = 0; i < 20; i++) {
      const time = new Date(startTime.getTime() + i * interval);
      timePoints.push(time);
    }

    // Generate realistic crowd data with patterns
    const newChartData = timePoints.map((time, index) => {
      const hour = time.getHours();
      const dataPoint: any = {
        time: time.toLocaleTimeString(),
        timestamp: time.getTime(),
      };

      zones.forEach(zone => {
        // Simulate realistic crowd patterns
        let baseCount = zone.current_count;
        
        // Time-based patterns for Simhastha
        let multiplier = 1;
        if (hour >= 4 && hour <= 8) multiplier = 2.2; // Early morning bathing
        else if (hour >= 17 && hour <= 21) multiplier = 2.5; // Evening aarti
        else if (hour >= 22 || hour <= 3) multiplier = 0.2; // Night
        else if (hour >= 9 && hour <= 16) multiplier = 1.3; // Day time

        // Add some randomness and trends
        const trend = Math.sin((index / 20) * Math.PI * 2) * 0.3;
        const randomFactor = 0.8 + Math.random() * 0.4;
        
        const count = Math.max(0, Math.floor(
          baseCount * multiplier * randomFactor * (1 + trend)
        ));

        dataPoint[zone.id] = count;
        dataPoint[`${zone.id}_capacity`] = zone.capacity;
      });

      // Add prediction data if enabled
      if (showPrediction && index > 15) {
        zones.forEach(zone => {
          const currentCount = dataPoint[zone.id];
          // Enhanced prediction with trend analysis
          const trendFactor = Math.sin((index / 20) * Math.PI * 2) * 0.15;
          const randomFactor = (Math.random() - 0.5) * 0.1;
          const prediction = currentCount * (1 + trendFactor + randomFactor);
          dataPoint[`${zone.id}_predicted`] = Math.max(0, Math.floor(prediction));
          
          // Add confidence intervals
          const uncertainty = prediction * 0.1;
          dataPoint[`${zone.id}_upper`] = Math.floor(prediction + uncertainty);
          dataPoint[`${zone.id}_lower`] = Math.max(0, Math.floor(prediction - uncertainty));
        });
      }

      // Add alert markers
      if (showAlerts && Math.random() < 0.1) { // 10% chance of alert
        dataPoint.alert = true;
        dataPoint.alertType = Math.random() < 0.3 ? 'critical' : 'warning';
      }

      return dataPoint;
    });

    setChartData(newChartData);
  };

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="time" 
          stroke="#6b7280"
          fontSize={12}
          tick={{ fill: '#6b7280' }}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
          tick={{ fill: '#6b7280' }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontSize: '12px'
          }}
          labelFormatter={(label) => `Time: ${label}`}
          formatter={(value: any, name: string) => [
            typeof value === 'number' ? value.toLocaleString() : value,
            name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
          ]}
        />
        <Legend />
        
        {/* Capacity lines */}
        {showCapacityLines && zones.map((zone, index) => (
          <Line
            key={`${zone.id}_capacity`}
            type="monotone"
            dataKey={`${zone.id}_capacity`}
            stroke={colors[index % colors.length]}
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name={`${zone.name} Capacity`}
            opacity={0.5}
          />
        ))}
        
        {/* Main data lines */}
        {zones.map((zone, index) => (
          <Line
            key={zone.id}
            type="monotone"
            dataKey={zone.id}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
            name={zone.name}
            connectNulls={false}
            activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
          />
        ))}
        
        {/* Prediction lines */}
        {showPrediction && zones.map((zone, index) => (
          <React.Fragment key={`${zone.id}_prediction`}>
            <Line
              type="monotone"
              dataKey={`${zone.id}_predicted`}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
              name={`${zone.name} (Predicted)`}
              opacity={0.8}
            />
            <Line
              type="monotone"
              dataKey={`${zone.id}_upper`}
              stroke={colors[index % colors.length]}
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              opacity={0.3}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey={`${zone.id}_lower`}
              stroke={colors[index % colors.length]}
              strokeWidth={1}
              strokeDasharray="2 2"
              dot={false}
              opacity={0.3}
              connectNulls={false}
            />
          </React.Fragment>
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="time" 
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
        />
        <Tooltip />
        <Legend />
        {zones.map((zone, index) => (
          <Area
            key={zone.id}
            type="monotone"
            dataKey={zone.id}
            stackId="1"
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.7}
            name={zone.name}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData.slice(-5)}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="time" 
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
        />
        <Tooltip />
        <Legend />
        {zones.map((zone, index) => (
          <Bar
            key={zone.id}
            dataKey={zone.id}
            fill={colors[index % colors.length]}
            name={zone.name}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => {
    const pieData = zones.map((zone, index) => ({
      name: zone.name,
      value: zone.current_count,
      fill: colors[index % colors.length],
      capacity: zone.capacity,
      occupancy: ((zone.current_count / zone.capacity) * 100).toFixed(1)
    }));

    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent, occupancy }) => `${name}\n${(percent * 100).toFixed(0)}% (${occupancy}% capacity)`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'area': return renderAreaChart();
      case 'bar': return renderBarChart();
      case 'pie': return renderPieChart();
      default: return renderLineChart();
    }
  };

  return (
    <div className="w-full">
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
            </select>
          </div>
          
          {type === 'line' && (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showPrediction}
                onChange={(e) => setShowPrediction(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Show Predictions</span>
            </label>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRealtime(!isRealtime)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isRealtime 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isRealtime ? '🔴 Live' : '⏸️ Paused'}
          </button>
          
          <button
            onClick={generateChartData}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium hover:bg-blue-200 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {renderChart()}
      </div>

      {/* Chart Statistics */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        {zones.map((zone, index) => {
          const currentData = chartData[chartData.length - 1];
          const previousData = chartData[chartData.length - 2];
          const currentCount = currentData?.[zone.id] || 0;
          const previousCount = previousData?.[zone.id] || 0;
          const change = currentCount - previousCount;
          const changePercent = previousCount > 0 ? ((change / previousCount) * 100) : 0;

          return (
            <div key={zone.id} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center space-x-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm font-medium text-gray-900">{zone.name}</span>
              </div>
              <div className="text-lg font-bold text-gray-900">{currentCount}</div>
              <div className={`text-xs flex items-center space-x-1 ${
                change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-600'
              }`}>
                <span>{change > 0 ? '↗' : change < 0 ? '↘' : '→'}</span>
                <span>{Math.abs(changePercent).toFixed(1)}%</span>
              </div>
              <div className="text-xs text-gray-500">
                {((currentCount / zone.capacity) * 100).toFixed(1)}% capacity
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};