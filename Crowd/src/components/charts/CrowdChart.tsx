import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CrowdData } from '../../types';

interface CrowdChartProps {
  data: CrowdData[];
  type: 'line' | 'bar';
  height?: number;
}

export const CrowdChart: React.FC<CrowdChartProps> = ({ data, type, height = 300 }) => {
  // Group data by location and time
  const chartData = data.reduce((acc, item) => {
    const timeKey = new Date(item.timestamp).toLocaleTimeString();
    const existing = acc.find(d => d.time === timeKey);
    
    if (existing) {
      existing[item.location_id] = item.people_count;
    } else {
      acc.push({
        time: timeKey,
        [item.location_id]: item.people_count,
      });
    }
    
    return acc;
  }, [] as any[]);

  // Get unique locations for colors
  const locations = [...new Set(data.map(d => d.location_id))];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          {locations.map((location, index) => (
            <Line
              key={location}
              type="monotone"
              dataKey={location}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ fill: colors[index % colors.length] }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Legend />
        {locations.map((location, index) => (
          <Bar
            key={location}
            dataKey={location}
            fill={colors[index % colors.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};