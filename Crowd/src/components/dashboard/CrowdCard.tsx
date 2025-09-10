import React from 'react';
import { Users, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Zone } from '../../types';

interface CrowdCardProps {
  zone: Zone;
  onClick?: () => void;
}

export const CrowdCard: React.FC<CrowdCardProps> = ({ zone, onClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'safe': return 'Safe';
      case 'moderate': return 'Moderate';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'moderate': return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const occupancyPercentage = (zone.current_count / zone.capacity) * 100;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-blue-500"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{zone.name}</h3>
            <p className="text-sm text-gray-500">Updated: {new Date(zone.last_updated).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(zone.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(zone.status)}`}>
            {getStatusText(zone.status)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">{zone.current_count}</span>
          <span className="text-sm text-gray-500">/ {zone.capacity}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getStatusColor(zone.status)}`}
            style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Occupancy</span>
          <span className="font-medium text-gray-900">{occupancyPercentage.toFixed(1)}%</span>
        </div>
      </div>

      {zone.status === 'critical' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700 font-medium">Capacity exceeded - evacuation recommended</p>
          </div>
        </div>
      )}
    </div>
  );
};