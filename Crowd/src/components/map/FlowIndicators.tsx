import React from 'react';
import { Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import { Zone } from '../../types';

interface FlowIndicatorsProps {
  zones: Zone[];
  showFlow: boolean;
}

export const FlowIndicators: React.FC<FlowIndicatorsProps> = ({ zones, showFlow }) => {
  if (!showFlow) return null;

  // Generate flow indicators based on zone status and crowd movement patterns
  const generateFlowArrows = () => {
    const arrows: JSX.Element[] = [];
    
    zones.forEach((zone) => {
      const center = zone.coordinates.reduce(
        (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
        [0, 0]
      ).map(sum => sum / zone.coordinates.length) as [number, number];

      // Different flow patterns based on zone status
      if (zone.status === 'critical') {
        // Outward flow arrows from critical zones (evacuation)
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60) * (Math.PI / 180);
          const distance = 0.003; // Increased distance for visibility
          const endPoint: [number, number] = [
            center[0] + Math.cos(angle) * distance,
            center[1] + Math.sin(angle) * distance
          ];

          arrows.push(
            <Polyline
              key={`critical-flow-${zone.id}-${i}`}
              positions={[center, endPoint]}
              pathOptions={{
                color: '#ff4444',
                weight: 4,
                opacity: 0.8,
                dashArray: '8, 4',
              }}
            />
          );
          
          // Animated evacuation arrows
          arrows.push(
            <Marker
              key={`critical-arrow-${zone.id}-${i}`}
              position={endPoint}
              icon={L.divIcon({
                html: '<div style="color: #ff4444; font-size: 18px; animation: pulse 1.5s infinite;">🚶‍♂️</div>',
                className: 'flow-arrow critical-flow',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            />
          );
        }
      } else if (zone.status === 'moderate') {
        // Bidirectional flow for moderate zones
        for (let i = 0; i < 4; i++) {
          const angle = (i * 90) * (Math.PI / 180);
          const distance = 0.002;
          const endPoint: [number, number] = [
            center[0] + Math.cos(angle) * distance,
            center[1] + Math.sin(angle) * distance
          ];

          arrows.push(
            <Polyline
              key={`moderate-flow-${zone.id}-${i}`}
              positions={[center, endPoint]}
              pathOptions={{
                color: '#f59e0b',
                weight: 3,
                opacity: 0.6,
                dashArray: '5, 5',
              }}
            />
          );
          
          arrows.push(
            <Marker
              key={`moderate-arrow-${zone.id}-${i}`}
              position={endPoint}
              icon={L.divIcon({
                html: '<div style="color: #f59e0b; font-size: 14px; animation: pulse 2s infinite;">↔️</div>',
                className: 'flow-arrow moderate-flow',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
            />
          );
        }
      } else if (zone.status === 'safe') {
        // Gentle inward flow for safe zones (people can enter)
        for (let i = 0; i < 3; i++) {
          const angle = (i * 120) * (Math.PI / 180);
          const distance = 0.0015;
          const startPoint: [number, number] = [
            center[0] + Math.cos(angle) * distance,
            center[1] + Math.sin(angle) * distance
          ];

          arrows.push(
            <Polyline
              key={`safe-flow-${zone.id}-${i}`}
              positions={[startPoint, center]}
              pathOptions={{
                color: '#10b981',
                weight: 2,
                opacity: 0.5,
                dashArray: '3, 6',
              }}
            />
          );
          
          arrows.push(
            <Marker
              key={`safe-arrow-${zone.id}-${i}`}
              position={startPoint}
              icon={L.divIcon({
                html: '<div style="color: #10b981; font-size: 12px; animation: pulse 3s infinite;">➤</div>',
                className: 'flow-arrow safe-flow',
                iconSize: [14, 14],
                iconAnchor: [7, 7],
              })}
            />
          );
        }
      }

      // Add crowd density indicators
      const densityLevel = zone.current_count / zone.capacity;
      if (densityLevel > 0.3) {
        const numDots = Math.min(Math.floor(densityLevel * 10), 8);
        for (let i = 0; i < numDots; i++) {
          const randomOffset = [
            (Math.random() - 0.5) * 0.001,
            (Math.random() - 0.5) * 0.001
          ];
          const dotPosition: [number, number] = [
            center[0] + randomOffset[0],
            center[1] + randomOffset[1]
          ];

          arrows.push(
            <Marker
              key={`density-dot-${zone.id}-${i}`}
              position={dotPosition}
              icon={L.divIcon({
                html: `<div style="color: ${
                  zone.status === 'critical' ? '#ff4444' :
                  zone.status === 'moderate' ? '#f59e0b' : '#10b981'
                }; font-size: 8px;">●</div>`,
                className: 'density-dot',
                iconSize: [8, 8],
                iconAnchor: [4, 4],
              })}
            />
          );
        }
      }
    });

    return arrows;
  };

  // Generate inter-zone flow connections
  const generateInterZoneFlow = () => {
    const connections: JSX.Element[] = [];
    
    // Find zones that might have flow between them (adjacent critical to safe zones)
    const criticalZones = zones.filter(z => z.status === 'critical');
    const safeZones = zones.filter(z => z.status === 'safe');
    
    criticalZones.forEach((criticalZone, criticalIndex) => {
      const criticalCenter = criticalZone.coordinates.reduce(
        (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
        [0, 0]
      ).map(sum => sum / criticalZone.coordinates.length) as [number, number];
        // Add zone status indicator at center
        const statusColor = zone.status === 'critical' ? '#ef4444' : 
                           zone.status === 'moderate' ? '#f59e0b' : '#10b981';
        
        ctx.fillStyle = statusColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add zone label
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(zone.name.split(' ')[0], centerX, centerY - 15);
        
        // Add people count
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px Arial';
        ctx.fillText(zone.current_count.toString(), centerX, centerY + 2);

      // Find nearest safe zone
      let nearestSafe = null;
      let minDistance = Infinity;
      
      safeZones.forEach((safeZone) => {
        const safeCenter = safeZone.coordinates.reduce(
          (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
          [0, 0]
        ).map(sum => sum / safeZone.coordinates.length) as [number, number];
        
        const distance = Math.sqrt(
          Math.pow(criticalCenter[0] - safeCenter[0], 2) +
          Math.pow(criticalCenter[1] - safeCenter[1], 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
            
            // Add flow intensity indicator
            const intensity = Math.min(zone.current_count / zone.capacity, 1);
            ctx.globalAlpha = 0.3 + (intensity * 0.7);
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = Math.max(1, intensity * 5);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            ctx.globalAlpha = 1;
          nearestSafe = { zone: safeZone, center: safeCenter };
          
          // Add evacuation direction indicator
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('EVACUATE', centerX, centerY + 25);
        } else if (zone.status === 'moderate') {
          // Add monitoring indicator
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('MONITOR', centerX, centerY + 20);
        }
      });

      if (nearestSafe && minDistance < 0.01) { // Only show if zones are reasonably close
        // Create flow line between zones
        connections.push(
          <Polyline
            key={`inter-flow-${criticalZone.id}-${nearestSafe.zone.id}`}
            positions={[criticalCenter, nearestSafe.center]}
            pathOptions={{
              color: '#ff6b6b',
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 5',
            }}
          />
        );

        // Add multiple arrows along the path
        const numArrows = 3;
        for (let i = 1; i <= numArrows; i++) {
          const ratio = i / (numArrows + 1);
          const arrowPos: [number, number] = [
            criticalCenter[0] + (nearestSafe.center[0] - criticalCenter[0]) * ratio,
            criticalCenter[1] + (nearestSafe.center[1] - criticalCenter[1]) * ratio
          ];

          connections.push(
            <Marker
              key={`inter-arrow-${criticalZone.id}-${nearestSafe.zone.id}-${i}`}
              position={arrowPos}
              icon={L.divIcon({
                html: '<div style="color: #ff6b6b; font-size: 16px; animation: flow 2s infinite;">🚶‍♂️➤</div>',
                className: 'inter-flow-arrow',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            />
          );
        }
      }
    });

    return connections;
  };

  return (
    <>
      {generateFlowArrows()}
      {generateInterZoneFlow()}
      
      {/* CSS for animations */}
      <style jsx>{`
        .flow-arrow {
          animation: pulse 2s infinite;
        }
        
        .critical-flow {
          animation: urgent-pulse 1s infinite;
        }
        
        .moderate-flow {
          animation: moderate-pulse 2s infinite;
        }
        
        .safe-flow {
          animation: gentle-pulse 3s infinite;
        }
        
        .inter-flow-arrow {
          animation: flow 2s infinite;
        }
        
        .density-dot {
          animation: twinkle 4s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes urgent-pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.3); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes moderate-pulse {
          0% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
          100% { opacity: 0.8; transform: scale(1); }
        }
        
        @keyframes gentle-pulse {
          0% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(1); }
        }
        
        @keyframes flow {
          0% { opacity: 0.8; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(5px); }
          100% { opacity: 0.8; transform: translateX(0); }
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </>
  );
};