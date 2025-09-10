import React from 'react';
import { Polygon, Popup, Circle } from 'react-leaflet';
import { Zone } from '../../types';

interface ZoneHeatmapProps {
  zones: Zone[];
  selectedZone?: string;
  onZoneClick?: (zone: Zone) => void;
  isMobile?: boolean;
}

export const ZoneHeatmap: React.FC<ZoneHeatmapProps> = ({ zones, selectedZone, onZoneClick, isMobile = false }) => {
  const getZoneColor = (status: string) => {
    switch (status) {
      case 'safe': return '#10b981'; // Green
      case 'moderate': return '#f59e0b'; // Yellow
      case 'critical': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  const getZoneOpacity = (occupancy: number, isSelected: boolean) => {
    const baseOpacity = Math.min(0.3 + (occupancy / 100) * 0.4, 0.7);
    return isSelected ? Math.min(baseOpacity + 0.2, 0.9) : baseOpacity;
  };

  const getZoneWeight = (zoneId: string) => {
    return selectedZone === zoneId ? 4 : 2;
  };

  const getIntensityRadius = (count: number, capacity: number) => {
    const ratio = count / capacity;
    const baseRadius = isMobile ? 30 : 50;
    const maxRadius = isMobile ? 120 : 200;
    const multiplier = isMobile ? 90 : 150;
    return Math.max(baseRadius, Math.min(maxRadius, ratio * multiplier));
  };

  return (
    <>
      {zones.map((zone) => {
        const occupancy = (zone.current_count / zone.capacity) * 100;
        const isSelected = selectedZone === zone.id;
        const color = getZoneColor(zone.status);
        
        // Calculate zone center for intensity circle
        const center = zone.coordinates.reduce(
          (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
          [0, 0]
        ).map(sum => sum / zone.coordinates.length) as [number, number];
        
        return (
          <React.Fragment key={zone.id}>
            {/* Zone polygon */}
            <Polygon
              positions={zone.coordinates}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: getZoneOpacity(occupancy, isSelected),
                weight: isMobile ? Math.max(1, getZoneWeight(zone.id) - 1) : getZoneWeight(zone.id),
                dashArray: isSelected ? '10, 5' : undefined,
              }}
              eventHandlers={{
                click: () => onZoneClick?.(zone)
              }}
            >
              <Popup>
                <div className={isMobile ? 'p-2 min-w-32' : 'p-3 min-w-48'}>
                  <h3 className="font-semibold text-gray-900 mb-2">{zone.name}</h3>
                  <div className="space-y-2">
                    <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <span className="text-gray-600">Current Count:</span>
                      <span className="font-medium">{zone.current_count}</span>
                    </div>
                    <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">{zone.capacity}</span>
                    </div>
                    <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <span className="text-gray-600">Occupancy:</span>
                      <span className="font-medium">{occupancy.toFixed(1)}%</span>
                    </div>
                    <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium capitalize ${
                        zone.status === 'safe' ? 'text-green-600' :
                        zone.status === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {zone.status}
                      </span>
                    </div>
                    <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium text-xs">
                        {new Date(zone.last_updated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status-specific messages */}
                  {zone.status === 'critical' && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className={`text-red-700 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        ⚠️ CRITICAL: Evacuation recommended
                      </p>
                      <p className={`text-red-600 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        Capacity exceeded by {zone.current_count - zone.capacity} people
                      </p>
                    </div>
                  )}
                  
                  {zone.status === 'moderate' && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className={`text-yellow-700 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        ⚡ MODERATE: Monitor closely
                      </p>
                      <p className={`text-yellow-600 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        {((zone.capacity - zone.current_count) / zone.capacity * 100).toFixed(0)}% capacity remaining
                      </p>
                    </div>
                  )}
                  
                  {zone.status === 'safe' && (
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                      <p className={`text-green-700 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        ✅ SAFE: Normal operations
                      </p>
                      <p className={`text-green-600 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        Can accommodate {zone.capacity - zone.current_count} more people
                      </p>
                    </div>
                  )}
                </div>
              </Popup>
            </Polygon>
            
            {/* Intensity circle for visual emphasis */}
            <Circle
              center={center}
              radius={getIntensityRadius(zone.current_count, zone.capacity)}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.1,
                weight: isMobile ? 0.5 : 1,
                opacity: 0.3,
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};