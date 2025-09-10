import React from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Zone } from '../../types';

interface EvacuationRoute {
  id: string;
  from_zone: string;
  to_zone: string;
  path: [number, number][];
  estimated_time: number;
  status: 'active' | 'blocked' | 'recommended';
  capacity?: number;
  priority?: number;
}

interface EvacuationOverlayProps {
  zones: Zone[];
  showRoutes: boolean;
  routes?: EvacuationRoute[];
}

// Custom arrow icon for evacuation direction
const createArrowIcon = (color: string, rotation: number = 0) => {
  return L.divIcon({
    html: `<div style="transform: rotate(${rotation}deg); color: ${color}; font-size: 20px; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">➤</div>`,
    className: 'evacuation-arrow',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export const EvacuationOverlay: React.FC<EvacuationOverlayProps> = ({ zones, showRoutes, routes = [] }) => {
  if (!showRoutes) return null;

  // Generate dynamic evacuation routes based on current zone status
  const generateDynamicRoutes = (): EvacuationRoute[] => {
    const criticalZones = zones.filter(zone => zone.status === 'critical');
    const safeZones = zones.filter(zone => zone.status === 'safe');
    const dynamicRoutes: EvacuationRoute[] = [];

    criticalZones.forEach((criticalZone, criticalIndex) => {
      // Find nearest safe zones
      const criticalCenter = criticalZone.coordinates.reduce(
        (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
        [0, 0]
      ).map(sum => sum / criticalZone.coordinates.length) as [number, number];

      safeZones.forEach((safeZone, safeIndex) => {
        const safeCenter = safeZone.coordinates.reduce(
          (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
          [0, 0]
        ).map(sum => sum / safeZone.coordinates.length) as [number, number];

        // Calculate distance
        const distance = Math.sqrt(
          Math.pow(criticalCenter[0] - safeCenter[0], 2) +
          Math.pow(criticalCenter[1] - safeCenter[1], 2)
        );

        // Only create routes for nearby zones
        if (distance < 0.01) { // Approximately 1km
          // Create curved path for more realistic routing
          const midPoint1: [number, number] = [
            criticalCenter[0] + (safeCenter[0] - criticalCenter[0]) * 0.3 + (Math.random() - 0.5) * 0.002,
            criticalCenter[1] + (safeCenter[1] - criticalCenter[1]) * 0.3 + (Math.random() - 0.5) * 0.002
          ];
          const midPoint2: [number, number] = [
            criticalCenter[0] + (safeCenter[0] - criticalCenter[0]) * 0.7 + (Math.random() - 0.5) * 0.002,
            criticalCenter[1] + (safeCenter[1] - criticalCenter[1]) * 0.7 + (Math.random() - 0.5) * 0.002
          ];

          dynamicRoutes.push({
            id: `dynamic-${criticalZone.id}-${safeZone.id}`,
            from_zone: criticalZone.id,
            to_zone: safeZone.id,
            path: [criticalCenter, midPoint1, midPoint2, safeCenter],
            estimated_time: Math.ceil(distance * 1000 / 80), // 80m/min walking speed
            status: 'recommended',
            capacity: Math.min(criticalZone.current_count, safeZone.capacity - safeZone.current_count),
            priority: criticalIndex + 1
          });
        }
      });
    });

    return dynamicRoutes;
  };

  // Combine provided routes with dynamic routes
  const allRoutes = [...routes, ...generateDynamicRoutes()];

  const getRouteColor = (status: string) => {
    switch (status) {
      case 'recommended': return '#10b981'; // Green
      case 'active': return '#3b82f6'; // Blue
      case 'blocked': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  const getRouteWeight = (status: string) => {
    switch (status) {
      case 'recommended': return 6;
      case 'active': return 4;
      case 'blocked': return 3;
      default: return 2;
    }
  };

  const getRouteOpacity = (status: string) => {
    switch (status) {
      case 'recommended': return 0.9;
      case 'active': return 0.8;
      case 'blocked': return 0.5;
      default: return 0.6;
    }
  };

  // Filter routes to show only those from critical zones or recommended routes
  const criticalZones = zones.filter(zone => zone.status === 'critical').map(zone => zone.id);
  const activeRoutes = allRoutes.filter(route => 
    criticalZones.includes(route.from_zone) || route.status === 'recommended'
  );

  // Calculate arrow positions along the route
  const getArrowPositions = (path: [number, number][], numArrows: number = 3) => {
    const positions: { position: [number, number]; rotation: number }[] = [];
    
    for (let i = 1; i <= numArrows; i++) {
      const segmentIndex = Math.floor((path.length - 1) * (i / (numArrows + 1)));
      const nextIndex = Math.min(segmentIndex + 1, path.length - 1);
      
      if (segmentIndex < path.length && nextIndex < path.length) {
        const current = path[segmentIndex];
        const next = path[nextIndex];
        
        // Calculate rotation angle
        const dx = next[1] - current[1];
        const dy = next[0] - current[0];
        const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
        
        positions.push({
          position: current,
          rotation: rotation
        });
      }
    }
    
    return positions;
  };

  return (
    <>
      {activeRoutes.map((route) => {
        const color = getRouteColor(route.status);
        const weight = getRouteWeight(route.status);
        const opacity = getRouteOpacity(route.status);
        const isDashed = route.status === 'recommended';
        
        const arrowPositions = getArrowPositions(route.path);
        
        return (
          <React.Fragment key={route.id}>
            {/* Main route line */}
            <Polyline
              positions={route.path}
              pathOptions={{
                color: color,
                weight: weight,
                opacity: opacity,
                dashArray: isDashed ? '10, 10' : undefined,
              }}
            >
              <Popup>
                <div className="p-3 min-w-48">
                  <h3 className="font-semibold text-gray-900 mb-2">Evacuation Route</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">From:</span>
                      <span className="font-medium">{route.from_zone.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">To:</span>
                      <span className="font-medium">{route.to_zone.replace('-', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Time:</span>
                      <span className="font-medium">{route.estimated_time} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium capitalize ${
                        route.status === 'recommended' ? 'text-green-600' :
                        route.status === 'active' ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {route.status}
                      </span>
                    </div>
                    {route.capacity && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="font-medium">{route.capacity} people</span>
                      </div>
                    )}
                  </div>
                  
                  {route.status === 'recommended' && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-xs text-green-700 font-medium">
                        🚶‍♂️ Recommended evacuation path
                      </p>
                    </div>
                  )}
                  
                  {route.status === 'blocked' && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-700 font-medium">
                        ⚠️ Route currently blocked
                      </p>
                    </div>
                  )}
                  
                  {route.priority && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs text-blue-700 font-medium">
                        Priority Level: {route.priority}
                      </p>
                    </div>
                  )}
                </div>
              </Popup>
            </Polyline>
            
            {/* Direction arrows */}
            {arrowPositions.map((arrow, index) => (
              <Marker
                key={`${route.id}-arrow-${index}`}
                position={arrow.position}
                icon={createArrowIcon(color, arrow.rotation)}
              />
            ))}
            
            {/* Start and end markers */}
            <Marker
              position={route.path[0]}
              icon={L.divIcon({
                html: `<div style="background-color: ${color}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);">🚨</div>`,
                className: 'evacuation-start',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              })}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-medium">Evacuation Start</p>
                  <p className="text-sm text-gray-600">{route.from_zone.replace('-', ' ')}</p>
                  <p className="text-xs text-red-600 mt-1">Critical Zone</p>
                </div>
              </Popup>
            </Marker>
            
            <Marker
              position={route.path[route.path.length - 1]}
              icon={L.divIcon({
                html: `<div style="background-color: ${color}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);">✅</div>`,
                className: 'evacuation-end',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              })}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-medium">Safe Zone</p>
                  <p className="text-sm text-gray-600">{route.to_zone.replace('-', ' ')}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {route.estimated_time} min walk
                  </p>
                  <p className="text-xs text-green-600 mt-1">Safe Capacity Available</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
      
      {/* CSS for animations */}
      <style jsx>{`
        .evacuation-arrow {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};