import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, ReferenceLine, Brush } from 'recharts';
import { CrowdData, Zone } from '../../types';

// Import performance optimizer
import { performanceOptimizer } from '../../utils/performanceOptimizer';

interface EnhancedRealtimeChartProps {
  data: CrowdData[];
  zones: Zone[];
  type: 'line' | 'area' | 'bar' | 'pie' | 'composed';
  height?: number;
  timeRange?: '15m' | '1h' | '6h' | '24h' | '7d';
  showPrediction?: boolean;
  showCapacityLines?: boolean;
  showAlerts?: boolean;
  showTrends?: boolean;
  interactive?: boolean;
}

export const EnhancedRealtimeChart: React.FC<EnhancedRealtimeChartProps> = ({ 
  data, 
  zones, 
  type, 
  height = 400, 
  timeRange = '1h',
  showPrediction = false,
  showCapacityLines = true,
  showAlerts = true,
  showTrends = true,
  interactive = true
}) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [isRealtime, setIsRealtime] = useState(true);
  const [selectedZones, setSelectedZones] = useState<Set<string>>(new Set(zones.map(z => z.id)));
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  
  // Add data validation function
  const validateChartData = (data: any[]): any[] => {
    if (!Array.isArray(data)) return [];
    
    return data.filter(item => {
      if (!item || typeof item !== 'object') return false;
      
      // Ensure all zone data points are valid numbers
      for (const zone of zones) {
        if (selectedZones.has(zone.id)) {
          const value = item[zone.id];
          if (value !== undefined && value !== null && (typeof value !== 'number' || isNaN(value))) {
            return false;
          }
        }
      }
      return true;
    }).map(item => {
      // Ensure all values are valid numbers
      const cleanItem = { ...item };
      for (const zone of zones) {
        if (selectedZones.has(zone.id)) {
          const value = cleanItem[zone.id];
          if (value === undefined || value === null || isNaN(value)) {
            cleanItem[zone.id] = 0;
          }
        }
      }
      return cleanItem;
    });
  };

  useEffect(() => {
    generateEnhancedChartData();
    
    // Skip real-time updates if system is stressed
    if (isRealtime) {
      if (performanceOptimizer && typeof performanceOptimizer.isSystemStressed === 'function' && performanceOptimizer.isSystemStressed()) {
        console.warn('Skipping chart updates due to system stress');
        return;
      }
      
      const interval = setInterval(() => {
        // Check system stress before updating
        if (performanceOptimizer && typeof performanceOptimizer.isSystemStressed === 'function' && performanceOptimizer.isSystemStressed()) {
          console.warn('Skipping chart update due to system stress');
          return;
        }
        generateEnhancedChartData();
      }, 120000); // Increased to 2 minute interval
      return () => clearInterval(interval);
    }
  }, [data, zones, timeRange, isRealtime, selectedZones]);

  const generateEnhancedChartData = () => {
    try {
      // Skip generation if system is stressed
      if (performanceOptimizer && typeof performanceOptimizer.isSystemStressed === 'function' && performanceOptimizer.isSystemStressed()) {
        console.warn('Skipping chart data generation due to system stress');
        return;
      }
      
      const maxDataPoints = 3; // Further reduced data points
      
    const now = new Date();
    const timeRangeMs = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    }[timeRange];

    const startTime = new Date(now.getTime() - timeRangeMs);
    const dataPoints = maxDataPoints;
    const interval = timeRangeMs / dataPoints;
    
    // Generate time points
    const timePoints = [];
    for (let i = 0; i < dataPoints; i++) {
      const time = new Date(startTime.getTime() + i * interval);
      timePoints.push(time);
    }

    // Generate realistic crowd data with patterns
    const newChartData = timePoints.map((time, index) => {
      const hour = time.getHours();
      const minute = time.getMinutes();
      const dayOfWeek = time.getDay();
      
      const dataPoint: any = {
        time: timeRange === '7d' ? time.toLocaleDateString() : time.toLocaleTimeString(),
        timestamp: time.getTime(),
        hour,
        minute,
        dayOfWeek
      };

      // Process only selected zones to reduce computation
      zones.filter(zone => selectedZones.has(zone.id)).slice(0, 2).forEach(zone => {
        if (!selectedZones.has(zone.id)) return;
        
        // Enhanced realistic crowd patterns
        let baseCount = zone.current_count;
        
        // Time-based patterns for Simhastha
        let multiplier = 1;
        if (hour >= 4 && hour <= 8) multiplier = 2.2;
        else if (hour >= 17 && hour <= 21) multiplier = 2.5;
        else if (hour >= 22 || hour <= 3) multiplier = 0.15; // Night
        else if (hour >= 9 && hour <= 16) multiplier = 1.3;

        // Weekend/festival day multiplier
        if (dayOfWeek === 0 || dayOfWeek === 6) multiplier *= 1.3;

        // Zone-specific patterns
        const zoneMultiplier = {
          'mahakal-ghat': 1.3,
          'ram-ghat': 1.2,
          'bhairav-ghat': 1.1,
          'narsingh-ghat': 0.9,
          'kshipra-ghat': 0.8
        }[zone.id] || 1.0;

        // Simplified noise and trends for better performance
        const trendFactor = Math.sin((index / 10) * Math.PI) * 0.2;
        const noiseFactor = (Math.random() - 0.5) * 0.2;
        
        const count = Math.max(0, Math.floor(
          baseCount * multiplier * zoneMultiplier * (1 + trendFactor + noiseFactor)
        ));
        
        dataPoint[zone.id] = count;
        dataPoint[`${zone.id}_capacity`] = zone.capacity;
        dataPoint[`${zone.id}_occupancy`] = (count / zone.capacity) * 100;

        // Simplified trend indicators
        if (showTrends && index > 2) {
          const previousCount = baseCount * 0.9;
          const trend = count > previousCount ? 'increasing' : count < previousCount ? 'decreasing' : 'stable';
          dataPoint[`${zone.id}_trend`] = trend;
        }

        // Simplified prediction data
        if (showPrediction && index > 3) {
          const predictionVariance = 0.15;
          const prediction = count * (1 + (Math.random() - 0.5) * predictionVariance);
          dataPoint[`${zone.id}_predicted`] = Math.max(0, Math.floor(prediction));
          
          // Confidence intervals
          const uncertainty = prediction * 0.12;
          dataPoint[`${zone.id}_upper`] = Math.floor(prediction + uncertainty);
          dataPoint[`${zone.id}_lower`] = Math.max(0, Math.floor(prediction - uncertainty));
          dataPoint[`${zone.id}_confidence`] = 0.7 + Math.random() * 0.25;
        }
      });

      // Simplified alert markers
      if (showAlerts && Math.random() < 0.05) {
        dataPoint.alert = true;
        dataPoint.alertType = Math.random() < 0.2 ? 'critical' : Math.random() < 0.5 ? 'warning' : 'info';
        dataPoint.alertZone = zones[Math.floor(Math.random() * zones.length)].id;
      }

      return dataPoint;
    });

      // Validate and set chart data
      setChartData(validateChartData(newChartData));
    } catch (error) {
      console.error('Chart data generation error:', error);
      setChartData([]);
    }
  };

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

  const renderEnhancedLineChart = () => (
    <ResponsiveContainer width="100%" height={Math.min(height, 300)}>
      <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="time" 
          stroke="#6b7280"
          fontSize={11}
          tick={{ fill: '#6b7280' }}
          angle={-45}
          textAnchor="end"
          height={60}
          interval="preserveStartEnd"
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={11}
          tick={{ fill: '#6b7280' }}
          label={{ value: 'People Count', angle: -90, position: 'insideLeft' }}
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
          formatter={(value: any, name: string) => {
            if (name.includes('capacity')) return [value, 'Capacity'];
            if (typeof value !== 'number') return [0, name];
            if (name.includes('predicted')) return [value, 'Predicted'];
            if (name.includes('upper')) return [value, 'Upper Bound'];
            if (name.includes('lower')) return [value, 'Lower Bound'];
            return [typeof value === 'number' ? value.toLocaleString() : value, name.replace(/[-_]/g, ' ')];
          }}
          animationDuration={0}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        
        {/* Capacity reference lines */}
        {showCapacityLines && zones.filter(z => selectedZones.has(z.id)).slice(0, 2).map((zone, index) => (
          <ReferenceLine
            key={`${zone.id}_capacity_line`}
            y={zone.capacity}
            stroke={colors[index % colors.length]}
            strokeDasharray="8 8"
            strokeOpacity={0.6}
            label={{ value: `${zone.name} Capacity`, position: 'topRight', fontSize: 10 }}
          />
        ))}
        
        {/* Main data lines */}
        {zones.filter(z => selectedZones.has(z.id)).slice(0, 1).map((zone, index) => (
          <Line
            key={zone.id}
            type="monotone"
            dataKey={zone.id}
            stroke={colors[index % colors.length]}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
            name={zone.name}
            connectNulls={false}
            animationDuration={0}
          />
        ))}
        
        {/* Prediction lines with confidence intervals */}
        {false && zones.filter(z => selectedZones.has(z.id)).slice(0, 1).map((zone, index) => ( // Disable predictions
          <React.Fragment key={`${zone.id}_prediction`}>
            <Area
              type="monotone"
              dataKey={`${zone.id}_upper`}
              stackId={`${zone.id}_confidence`}
              stroke="none"
              fill={colors[index % colors.length]}
              fillOpacity={0.1}
              animationDuration={0}
            />
            <Area
              type="monotone"
              dataKey={`${zone.id}_lower`}
              stackId={`${zone.id}_confidence`}
              stroke="none"
              fill={colors[index % colors.length]}
              fillOpacity={0.1}
              animationDuration={0}
            />
            <Line
              type="monotone"
              dataKey={`${zone.id}_predicted`}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              strokeDasharray="10 5"
              dot={false}
              name={`${zone.name} (AI Forecast)`}
              opacity={0.8}
              animationDuration={0}
            />
          </React.Fragment>
        ))}

        {/* Alert markers */}
        {false && chartData.filter(d => d.alert).slice(0, 2).map((alertPoint, index) => ( // Disable alerts
          <ReferenceLine
            key={`alert_${index}`}
            x={alertPoint.time}
            stroke={alertPoint.alertType === 'critical' ? '#ef4444' : alertPoint.alertType === 'warning' ? '#f59e0b' : '#3b82f6'}
            strokeWidth={2}
            strokeDasharray="4 4"
            label={{ 
              value: alertPoint.alertType === 'critical' ? '🚨' : alertPoint.alertType === 'warning' ? '⚠️' : 'ℹ️', 
              position: 'top',
              fontSize: 16
            }}
          />
        ))}
        
        {/* Capacity threshold lines */}
        {false && zones.filter(z => selectedZones.has(z.id)).slice(0, 2).map((zone, index) => ( // Disable capacity lines
          <React.Fragment key={`${zone.id}_thresholds`}>
            <ReferenceLine
              y={zone.capacity * 0.7}
              stroke={colors[index % colors.length]}
              strokeDasharray="3 3"
              strokeOpacity={0.4}
              label={{ value: `${zone.name} Warning (70%)`, position: 'topLeft', fontSize: 10 }}
            />
            <ReferenceLine
              y={zone.capacity * 0.9}
              stroke={colors[index % colors.length]}
              strokeDasharray="6 2"
              strokeOpacity={0.6}
              label={{ value: `${zone.name} Critical (90%)`, position: 'topLeft', fontSize: 10 }}
            />
          </React.Fragment>
        ))}

        {false && ( // Disable brush
          <Brush 
            dataKey="time" 
            height={30} 
            stroke="#8884d8"
            startIndex={Math.max(0, chartData.length - 10)}
            endIndex={chartData.length - 1}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderEnhancedAreaChart = () => (
    <ResponsiveContainer width="100%" height={Math.min(height, 300)}>
      <AreaChart data={validateChartData(chartData.slice(-10))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
        <YAxis stroke="#6b7280" fontSize={11} />
        <Tooltip animationDuration={0} />
        <Legend />
        {zones.filter(z => selectedZones.has(z.id)).slice(0, 1).map((zone, index) => (
          <Area
            key={zone.id}
            type="monotone"
            dataKey={zone.id}
            stackId="1"
            stroke={colors[index % colors.length]}
            fill={colors[index % colors.length]}
            fillOpacity={0.7}
            name={zone.name}
            animationDuration={0}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderEnhancedBarChart = () => (
    <ResponsiveContainer width="100%" height={Math.min(height, 300)}>
      <BarChart data={validateChartData(chartData.slice(-5))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="time" stroke="#6b7280" fontSize={11} />
        <YAxis stroke="#6b7280" fontSize={11} />
        <Tooltip animationDuration={0} />
        <Legend />
        {zones.filter(z => selectedZones.has(z.id)).slice(0, 1).map((zone, index) => (
          <Bar
            key={zone.id}
            dataKey={zone.id}
            fill={colors[index % colors.length]}
            name={zone.name}
            radius={[4, 4, 0, 0]}
            animationDuration={0}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (type) {
      case 'area': return renderEnhancedAreaChart();
      case 'bar': return renderEnhancedBarChart();
      case 'composed': return renderEnhancedLineChart();
      default: return renderEnhancedLineChart();
    }
  };

  return (
    <div className="w-full">
      {/* Enhanced Chart Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Time Range:</span>
            <select
              value={timeRange}
              onChange={(e) => {
                // This is a read-only prop, so we can't change it
                // The parent component should handle timeRange changes
              }}
              disabled
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="15m">Last 15 Minutes</option>
              <option value="1h">Last Hour</option>
              <option value="6h">Last 6 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Chart Type:</span>
            <select
              value={type}
              onChange={(e) => {
                // This is a read-only prop, so we can't change it
                // The parent component should handle type changes
              }}
              disabled
              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="bar">Bar Chart</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showPrediction}
              onChange={(e) => {
                // This is a read-only prop, so we can't change it
                // The parent component should handle showPrediction changes
              }}
              disabled
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">AI Predictions</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showCapacityLines}
              onChange={(e) => {
                // This is a read-only prop, so we can't change it
                // The parent component should handle showCapacityLines changes
              }}
              disabled
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Capacity Lines</span>
          </label>

          <button
            onClick={() => {
                setIsRealtime(!isRealtime);
            }}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              isRealtime 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isRealtime ? '🔴 Live' : '⏸️ Paused'}
          </button>
        </div>
      </div>

      {/* Zone Selection */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-2">Select Zones to Display:</div>
        <div className="flex flex-wrap gap-2">
          {zones.map((zone, index) => (
            <label key={zone.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedZones.has(zone.id)}
                onChange={(e) => {
                  const newSelected = new Set(selectedZones);
                  if (e.target.checked) {
                    newSelected.add(zone.id);
                  } else {
                    newSelected.delete(zone.id);
                  }
                  setSelectedZones(newSelected);
                }}
                className="rounded border-gray-300 focus:ring-blue-500"
                style={{ accentColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-700">{zone.name}</span>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {renderChart()}
      </div>

      {/* Enhanced Statistics */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {zones.filter(z => selectedZones.has(z.id)).map((zone, index) => {
          const currentData = chartData[chartData.length - 1];
          const previousData = chartData[chartData.length - 2];
          const currentCount = currentData?.[zone.id] ?? 0;
          const previousCount = previousData?.[zone.id] ?? 0;
          const change = currentCount - previousCount;
          const changePercent = previousCount > 0 ? ((change / previousCount) * 100) : 0;
          const occupancy = (currentCount / zone.capacity) * 100;
          const predicted = currentData?.[`${zone.id}_predicted`];
          
          return (
            <div key={zone.id} className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-sm font-medium text-gray-900">{zone.name}</span>
              </div>
              
              <div className="space-y-1">
                <div className="text-lg font-bold text-gray-900">{currentCount.toLocaleString()}</div>
                <div className={`text-xs flex items-center space-x-1 ${
                  change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  <span>{change > 0 ? '↗' : change < 0 ? '↘' : '→'}</span>
                  <span>{Math.abs(changePercent).toFixed(1)}%</span>
                </div>
                
                <div className="text-xs text-gray-600">
                  {occupancy.toFixed(1)}% capacity
                </div>
                
                {predicted && (
                  <div className="text-xs text-purple-600">
                    Predicted: {predicted} ({predicted > currentCount ? '+' : ''}{predicted - currentCount})
                  </div>
                )}
                
                <div className={`text-xs font-medium ${
                  occupancy > 90 ? 'text-red-600' :
                  occupancy > 70 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {occupancy > 90 ? 'Critical' :
                   occupancy > 70 ? 'High' :
                   occupancy > 40 ? 'Moderate' : 'Low'}
                </div>
              </div>
              
              {/* Flow rate indicator */}
              <div className="text-xs text-gray-500 mt-1">
                Flow: {Math.floor(Math.random() * 30) + 5} people/min
              </div>
              
              {/* Time to capacity */}
              {occupancy < 90 && change > 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  Est. full in: {Math.floor((zone.capacity - currentCount) / Math.abs(change) * 5)} min
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};