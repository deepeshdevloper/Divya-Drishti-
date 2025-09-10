import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, useMap, Circle, LayersControl, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { ZoneHeatmap } from './ZoneHeatmap';
import { EvacuationOverlay } from './EvacuationOverlay';
import { FlowIndicators } from './FlowIndicators';
import { MapSidebar } from './MapSidebar';
import { Zone, EvacuationRoute } from '../../types';
import { UJJAIN_CENTER } from '../../data/mockData';
import { Maximize2, Minimize2, Menu, X } from 'lucide-react';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  zones: Zone[];
  showHeatmap: boolean;
  showEvacuationRoutes: boolean;
  showFlowIndicators?: boolean;
  selectedZone?: string;
  onZoneClick?: (zone: Zone) => void;
  userRole?: string;
  showSidebar?: boolean;
  className?: string;
}

// Custom icons for different zone types
const createCustomIcon = (color: string, symbol: string) => {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: 14px; font-weight: bold;">${symbol}</div>`,
    className: 'custom-div-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const MapLegend: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');
      div.innerHTML = `
        <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); min-width: 200px;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1f2937;">Zone Status Legend</h4>
          
          <div style="margin-bottom: 12px;">
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <div style="width: 20px; height: 20px; background: #10b981; margin-right: 8px; border-radius: 4px;"></div>
              <span style="font-size: 12px; color: #374151;">Safe (0-300 people)</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <div style="width: 20px; height: 20px; background: #f59e0b; margin-right: 8px; border-radius: 4px;"></div>
              <span style="font-size: 12px; color: #374151;">Moderate (301-800 people)</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 20px; height: 20px; background: #ef4444; margin-right: 8px; border-radius: 4px;"></div>
              <span style="font-size: 12px; color: #374151;">Critical (>800 people)</span>
            </div>
          </div>
          
          <hr style="margin: 12px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <div style="margin-bottom: 12px;">
            <h5 style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #1f2937;">Evacuation Routes</h5>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <div style="width: 20px; height: 3px; background: #10b981; margin-right: 8px;"></div>
              <span style="font-size: 11px; color: #374151;">Recommended</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <div style="width: 20px; height: 3px; background: #3b82f6; margin-right: 8px;"></div>
              <span style="font-size: 11px; color: #374151;">Active</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <div style="width: 20px; height: 3px; background: #ef4444; margin-right: 8px;"></div>
              <span style="font-size: 11px; color: #374151;">Blocked</span>
            </div>
          </div>
          
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <div>
            <h5 style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #1f2937;">Emergency Facilities</h5>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 14px; margin-right: 6px;">🏥</span>
              <span style="font-size: 11px; color: #374151;">Medical Center</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 14px; margin-right: 6px;">👮</span>
              <span style="font-size: 11px; color: #374151;">Police Station</span>
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 14px; margin-right: 6px;">🚑</span>
              <span style="font-size: 11px; color: #374151;">Ambulance</span>
            </div>
            <div style="display: flex; align-items: center;">
              <span style="font-size: 14px; margin-right: 6px;">♿</span>
              <span style="font-size: 11px; color: #374151;">Accessibility</span>
            </div>
          </div>
        </div>
      `;
      return div;
    };
    
    legend.addTo(map);
    
    return () => {
      legend.remove();
    };
  }, [map]);
  
  return null;
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  zones,
  showHeatmap,
  showEvacuationRoutes,
  showFlowIndicators = false,
  selectedZone,
  onZoneClick,
  userRole = 'admin',
  showSidebar = true,
  className = '',
}) => {
  const [mapFilters, setMapFilters] = useState({
    showMedical: true,
    showPolice: true,
    showAccessibility: true,
    showEmergencyExits: true,
    zoneFilter: 'all' as 'all' | 'safe' | 'moderate' | 'critical',
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mapHeight, setMapHeight] = useState('100%');
  const mapRef = useRef<L.Map | null>(null);

  const filteredZones = zones.filter(zone => {
    if (mapFilters.zoneFilter === 'all') return true;
    return zone.status === mapFilters.zoneFilter;
  });

  // Responsive breakpoints and mobile detection
  useEffect(() => {
    const updateResponsiveState = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      // Auto-collapse sidebar on mobile
      if (isMobileView && showSidebar) {
        setSidebarCollapsed(true);
      }
      
      // Adjust map height based on screen size
      if (isFullscreen) {
        setMapHeight('100vh');
      } else if (isMobileView) {
        setMapHeight('60vh');
      } else {
        setMapHeight('100%');
      }
    };

    updateResponsiveState();
    window.addEventListener('resize', updateResponsiveState);
    window.addEventListener('orientationchange', updateResponsiveState);
    
    return () => {
      window.removeEventListener('resize', updateResponsiveState);
      window.removeEventListener('orientationchange', updateResponsiveState);
    };
  }, [isFullscreen, showSidebar]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className={`w-full rounded-lg overflow-hidden shadow-lg relative ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'h-full'} ${className}`}>
      <MapContainer
        center={UJJAIN_CENTER}
        zoom={isMobile ? 14 : 15}
        style={{ height: mapHeight, width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
        ref={mapRef}
        className={isMobile ? 'touch-pan-y' : ''}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Divya Drishti (दिव्य  दृष्टि)'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.arcgis.com/">ArcGIS</a> | Divya Drishti (दिव्य  दृष्टि)'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Dark Mode">
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a> | Divya Drishti (दिव्य  दृष्टि)'
              maxZoom={19}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://opentopomap.org/">OpenTopoMap</a> | Divya Drishti (दिव्य  दृष्टि)'
              maxZoom={17}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Ujjain Satellite">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution='&copy; Google | Divya Drishti (दिव्य  दृष्टि)'
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {/* Custom Zoom Control */}
        <div className={`absolute bg-white rounded-lg shadow-md p-2 space-y-1 z-[1000] ${
          isMobile ? 'top-2 left-2' : 'top-4 left-4'
        }`}>
          <button
            onClick={() => {
              const map = (window as any).leafletMap;
              if (map) map.zoomIn();
            }}
            className={`block bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-bold ${
              isMobile ? 'w-6 h-6 text-xs' : 'w-8 h-8'
            }`}
          >
            +
          </button>
          <button
            onClick={() => {
              const map = (window as any).leafletMap;
              if (map) map.zoomOut();
            }}
            className={`block bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-bold ${
              isMobile ? 'w-6 h-6 text-xs' : 'w-8 h-8'
            }`}
          >
            −
          </button>
          
          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className={`block bg-green-600 text-white rounded hover:bg-green-700 transition-colors ${
              isMobile ? 'w-6 h-6 p-1' : 'w-8 h-8 p-1'
            }`}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? 
              <Minimize2 className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} /> : 
              <Maximize2 className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
            }
          </button>
          
          {/* Mobile sidebar toggle */}
          {isMobile && showSidebar && (
            <button
              onClick={toggleSidebar}
              className="block w-6 h-6 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors p-1"
              title="Toggle sidebar"
            >
              {sidebarCollapsed ? <Menu className="w-3 h-3" /> : <X className="w-3 h-3" />}
            </button>
          )}
        </div>

        {showHeatmap && (
          <ZoneHeatmap 
            zones={filteredZones} 
            selectedZone={selectedZone} 
            onZoneClick={onZoneClick}
          />
        )}
        
        {showEvacuationRoutes && (
          <EvacuationOverlay 
            routes={[]} 
            zones={filteredZones} 
            showRoutes={showEvacuationRoutes}
          />
        )}

        {showFlowIndicators && (
          <FlowIndicators 
            zones={filteredZones} 
            showFlow={showFlowIndicators}
          />
        )}

        {/* Zone markers with custom icons */}
        {filteredZones.map((zone) => {
          const center = zone.coordinates.reduce(
            (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
            [0, 0]
          ).map(sum => sum / zone.coordinates.length) as [number, number];

          const iconSize = isMobile ? 24 : 30;
          const icon = L.divIcon({
            html: `<div style="background-color: ${
              zone.status === 'safe' ? '#10b981' : 
              zone.status === 'moderate' ? '#f59e0b' : '#ef4444'
            }; width: ${iconSize}px; height: ${iconSize}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); font-size: ${isMobile ? '10px' : '12px'}; font-weight: bold; color: white;">${zone.current_count}</div>`,
            className: 'custom-div-icon',
            iconSize: [iconSize, iconSize],
            iconAnchor: [iconSize/2, iconSize/2],
          });
          
          return (
            <Marker 
              key={`marker-${zone.id}`} 
              position={center}
              icon={icon}
              eventHandlers={{
                click: () => onZoneClick?.(zone)
              }}
            >
              <Popup>
                <div className={isMobile ? 'p-2 min-w-32' : 'p-3 min-w-48'}>
                  <h3 className="font-semibold text-gray-900 mb-2">{zone.name}</h3>
                  <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Count:</span>
                      <span className="font-medium">{zone.current_count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">{zone.capacity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-medium capitalize ${
                        zone.status === 'safe' ? 'text-green-600' :
                        zone.status === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {zone.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Updated:</span>
                      <span className="font-medium text-xs">
                        {new Date(zone.last_updated).toLocaleTimeString()}
                      </span>
                    </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Occupancy:</span>
                       <span className="font-medium">
                         {((zone.current_count / zone.capacity) * 100).toFixed(1)}%
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-gray-600">Flow Rate:</span>
                       <span className="font-medium text-xs">
                         {Math.floor(Math.random() * 50) + 10} people/min
                       </span>
                     </div>
                  </div>
                  
                  {zone.status === 'critical' && (
                    <div className={`mt-2 p-2 bg-red-50 border border-red-200 rounded ${isMobile ? 'text-xs' : ''}`}>
                      <p className={`text-red-700 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                        ⚠️ CRITICAL: Immediate action required
                      </p>
                       <p className={`text-red-600 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                         Evacuation recommended via nearest safe zone
                       </p>
                    </div>
                  )}
                   
                   {zone.status === 'moderate' && (
                     <div className={`mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded ${isMobile ? 'text-xs' : ''}`}>
                       <p className={`text-yellow-700 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                         ⚡ MODERATE: Enhanced monitoring active
                       </p>
                       <p className={`text-yellow-600 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                         {((zone.capacity - zone.current_count) / zone.capacity * 100).toFixed(0)}% capacity remaining
                       </p>
                     </div>
                   )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Emergency facilities markers */}
        {mapFilters.showMedical && (
          <>
            {/* Main Medical Center */}
            <Marker 
              position={[23.1765, 75.7885]} 
              icon={L.divIcon({
                html: `<div style="background-color: #dc2626; color: white; width: ${isMobile ? 20 : 28}px; height: ${isMobile ? 20 : 28}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${isMobile ? '10px' : '14px'}; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.4);">🏥</div>`,
                className: 'medical-facility',
                iconSize: [isMobile ? 20 : 28, isMobile ? 20 : 28],
                iconAnchor: [isMobile ? 10 : 14, isMobile ? 10 : 14],
              })}
            >
              <Popup>
                <div className={isMobile ? 'p-1' : 'p-2'}>
                  <h3 className="font-semibold text-gray-900">Medical Center</h3>
                  <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Emergency medical facility</p>
                  <p className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>24/7 Emergency Services</p>
                  <p className={`text-blue-600 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>Contact: 102</p>
                   <div className={`mt-2 p-1 bg-green-50 border border-green-200 rounded ${isMobile ? 'text-xs' : ''}`}>
                     <p className={`text-green-700 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                       ✅ Available: 15 beds, 3 ambulances
                     </p>
                   </div>
                </div>
              </Popup>
            </Marker>

            {/* Additional Medical Posts */}
            <Marker 
              position={[23.1770, 75.7875]} 
              icon={L.divIcon({
                html: `<div style="background-color: #dc2626; color: white; width: ${isMobile ? 18 : 24}px; height: ${isMobile ? 18 : 24}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${isMobile ? '8px' : '12px'}; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">⛑️</div>`,
                className: 'medical-post',
                iconSize: [isMobile ? 18 : 24, isMobile ? 18 : 24],
                iconAnchor: [isMobile ? 9 : 12, isMobile ? 9 : 12],
              })}
            >
              <Popup>
                <div className={isMobile ? 'p-1' : 'p-2'}>
                  <h3 className="font-semibold text-gray-900">Medical Post 2</h3>
                  <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>First aid station</p>
                  <p className={`text-gray-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>Basic medical care</p>
                </div>
              </Popup>
            </Marker>

            <Marker 
              position={[23.1755, 75.7895]} 
              icon={createCustomIcon('#f59e0b', '🚑')}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">Ambulance Station</h3>
                  <p className="text-sm text-gray-600">Emergency medical response</p>
                  <p className="text-xs text-gray-500 mt-1">Response Time: 3-5 min</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {mapFilters.showPolice && (
          <>
            <Marker 
              position={[23.1775, 75.7875]} 
              icon={createCustomIcon('#1d4ed8', '👮')}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">Police Control Room</h3>
                  <p className="text-sm text-gray-600">Main security center</p>
                  <p className="text-xs text-gray-500 mt-1">Emergency Contact: 100</p>
                </div>
              </Popup>
            </Marker>

            <Marker 
              position={[23.1760, 75.7890]} 
              icon={createCustomIcon('#1d4ed8', '🚔')}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">Mobile Police Unit</h3>
                  <p className="text-sm text-gray-600">Patrol vehicle</p>
                  <p className="text-xs text-gray-500 mt-1">Rapid response team</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {mapFilters.showAccessibility && (
          <>
            <Marker 
              position={[23.1785, 75.7865]} 
              icon={createCustomIcon('#10b981', '♿')}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">Accessibility Center</h3>
                  <p className="text-sm text-gray-600">Divyangjan assistance point</p>
                  <p className="text-xs text-gray-500 mt-1">Wheelchair & mobility aid support</p>
                </div>
              </Popup>
            </Marker>

            <Marker 
              position={[23.1750, 75.7880]} 
              icon={createCustomIcon('#10b981', '🦽')}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">Mobility Aid Station</h3>
                  <p className="text-sm text-gray-600">Equipment rental</p>
                  <p className="text-xs text-gray-500 mt-1">Wheelchairs, walking aids</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {mapFilters.showEmergencyExits && (
          <>
            <Marker 
              position={[23.1790, 75.7880]} 
              icon={createCustomIcon('#059669', '🚪')}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">Emergency Exit 1</h3>
                  <p className="text-sm text-gray-600">Main evacuation route</p>
                  <p className="text-xs text-gray-500 mt-1">Capacity: 1000 people/min</p>
                </div>
              </Popup>
            </Marker>

            <Marker 
              position={[23.1750, 75.7890]} 
              icon={createCustomIcon('#059669', '🚪')}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">Emergency Exit 2</h3>
                  <p className="text-sm text-gray-600">Secondary evacuation route</p>
                  <p className="text-xs text-gray-500 mt-1">Capacity: 800 people/min</p>
                </div>
              </Popup>
            </Marker>

            <Marker 
              position={[23.1780, 75.7870]} 
              icon={createCustomIcon('#059669', '🚪')}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">Emergency Exit 3</h3>
                  <p className="text-sm text-gray-600">Auxiliary evacuation route</p>
                  <p className="text-xs text-gray-500 mt-1">Capacity: 600 people/min</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        <MapLegend />
      </MapContainer>

      {/* Map Sidebar */}
      {showSidebar && (!isMobile || !sidebarCollapsed) && (
        <MapSidebar
          zones={zones}
          filters={mapFilters}
          onFiltersChange={setMapFilters}
          selectedZone={selectedZone}
          onZoneSelect={onZoneClick}
          userRole={userRole}
          isMobile={isMobile}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      )}
      
      {/* Map Info */}
      <div className={`absolute bg-white rounded-lg shadow-md z-[1000] ${
        isMobile ? 'bottom-2 left-2 p-2' : 'bottom-4 left-4 p-3'
      }`}>
        <div className={isMobile ? 'text-xs text-gray-600' : 'text-sm text-gray-600'}>
          <div className="font-medium">Ujjain Divya Drishti (दिव्य  दृष्टि)</div>
          <div>Zones: {filteredZones.length}</div>
          {!isMobile && <div>Last Updated: {new Date().toLocaleTimeString()}</div>}
        </div>
      </div>

      {/* Selected Zone Info */}
      {selectedZone && (
        <div className={`absolute bg-white rounded-lg shadow-md z-[1000] ${
          isMobile 
            ? 'top-2 right-2 p-3 max-w-48' 
            : 'top-4 right-4 p-4 max-w-xs'
        }`}>
          {(() => {
            const zone = zones.find(z => z.id === selectedZone);
            if (!zone) return null;
            
            return (
              <div>
                <h3 className={`font-semibold text-gray-900 mb-2 ${
                  isMobile ? 'text-sm' : ''
                }`}>{zone.name}</h3>
                <div className={`space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <div className="flex justify-between">
                    <span>Count:</span>
                    <span className="font-medium">{zone.current_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <span className="font-medium">{zone.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Occupancy:</span>
                    <span className="font-medium">
                      {((zone.current_count / zone.capacity) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-medium capitalize ${
                      zone.status === 'safe' ? 'text-green-600' :
                      zone.status === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {zone.status}
                    </span>
                  </div>
                </div>
                
                {zone.status === 'critical' && (
                  <div className={`mt-3 p-2 bg-red-50 border border-red-200 rounded ${isMobile ? 'text-xs' : ''}`}>
                    <p className={`text-red-700 font-medium ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      ⚠️ Evacuation recommended
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
      
      {/* Fullscreen exit button */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors z-[1001]"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* CSS for animations */}
      <style jsx>{`
        .flow-arrow {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};