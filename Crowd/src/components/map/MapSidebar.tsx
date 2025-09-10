import React from 'react';
import { Search, Filter, Eye, EyeOff, MapPin, Users, AlertTriangle, Shield, Heart, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { Zone } from '../../types';

interface MapSidebarProps {
  zones: Zone[];
  filters: {
    showMedical: boolean;
    showPolice: boolean;
    showAccessibility: boolean;
    showEmergencyExits: boolean;
    zoneFilter: 'all' | 'safe' | 'moderate' | 'critical';
  };
  onFiltersChange: (filters: any) => void;
  selectedZone?: string;
  onZoneSelect?: (zone: Zone) => void;
  userRole: string;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const MapSidebar: React.FC<MapSidebarProps> = ({
  zones,
  filters,
  onFiltersChange,
  selectedZone,
  onZoneSelect,
  userRole,
  isMobile = false,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filters.zoneFilter === 'all' || zone.status === filters.zoneFilter;
    return matchesSearch && matchesFilter;
  });

  const getZoneIcon = (status: string) => {
    switch (status) {
      case 'safe': return <div className="w-3 h-3 bg-green-500 rounded-full"></div>;
      case 'moderate': return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
      case 'critical': return <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>;
      default: return <div className="w-3 h-3 bg-gray-500 rounded-full"></div>;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-600" />;
      case 'police': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'volunteer': return <Heart className="w-4 h-4 text-purple-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  // Mobile collapsed state
  if (isCollapsed && isMobile) {
    return (
      <div className="absolute top-2 left-2 bg-white rounded-lg shadow-lg p-2 z-[1000]">
        <button
          onClick={onToggleCollapse}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          title="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    );
  }
  
  // Desktop collapsed state
  if (isCollapsed && !isMobile) {
    return null; // Hide completely on desktop when collapsed
  }

  return (
    <div className={`absolute bg-white rounded-lg shadow-lg z-[1000] overflow-hidden flex flex-col ${
      isMobile 
        ? 'top-0 left-0 w-full h-full max-h-screen' 
        : 'top-4 left-16 w-80 max-h-[calc(100vh-2rem)]'
    }`}>
      {/* Header */}
      <div className={`border-b border-gray-200 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getRoleIcon(userRole)}
            <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : ''}`}>
              {isMobile ? 'Map' : 'Map Control'}
            </h3>
          </div>
          {isMobile && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${
            isMobile ? 'w-3 h-3' : 'w-4 h-4'
          }`} />
          <input
            type="text"
            placeholder="Search zones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isMobile ? 'pl-8 pr-3 py-2 text-sm' : 'pl-10 pr-4 py-2 text-sm'
            }`}
          />
        </div>
      </div>

      {/* Filters */}
      <div className={`border-b border-gray-200 ${isMobile ? 'p-3' : 'p-4'}`}>
        <h4 className={`font-medium text-gray-900 mb-3 ${isMobile ? 'text-sm' : ''}`}>Zone Filter</h4>
        <div className={`grid gap-2 mb-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {[
            { key: 'all', label: 'All', count: zones.length },
            { key: 'safe', label: 'Safe', count: zones.filter(z => z.status === 'safe').length },
            { key: 'moderate', label: 'Moderate', count: zones.filter(z => z.status === 'moderate').length },
            { key: 'critical', label: 'Critical', count: zones.filter(z => z.status === 'critical').length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => onFiltersChange({ ...filters, zoneFilter: key })}
              className={`rounded-lg font-medium transition-colors ${
                isMobile ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm'
              } ${
                filters.zoneFilter === key
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        <h4 className={`font-medium text-gray-900 mb-3 ${isMobile ? 'text-sm' : ''}`}>Map Layers</h4>
        <div className="space-y-2">
          {[
            { key: 'showMedical', label: 'Medical Facilities', icon: '🏥' },
            { key: 'showPolice', label: 'Police Stations', icon: '👮' },
            { key: 'showAccessibility', label: 'Accessibility', icon: '♿' },
            { key: 'showEmergencyExits', label: 'Emergency Exits', icon: '🚪' },
          ].map(({ key, label, icon }) => (
            <label key={key} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters[key as keyof typeof filters] as boolean}
                onChange={(e) => onFiltersChange({ ...filters, [key]: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={isMobile ? 'text-xs' : 'text-sm'}>{icon}</span>
              <span className={`text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Zone List */}
      <div className="flex-1 overflow-y-auto">
        <div className={isMobile ? 'p-3' : 'p-4'}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>
              Zones ({filteredZones.length})
            </h4>
            <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              {zones.reduce((sum, zone) => sum + zone.current_count, 0).toLocaleString()} total people
            </div>
          </div>

          <div className={`space-y-2 ${isMobile ? 'space-y-1' : ''}`}>
            {filteredZones.map((zone) => (
              <div
                key={zone.id}
                onClick={() => onZoneSelect?.(zone)}
                className={`rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  isMobile ? 'p-2' : 'p-3'
                } ${
                  selectedZone === zone.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getZoneIcon(zone.status)}
                    <span className={`font-medium text-gray-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>{zone.name}</span>
                  </div>
                  <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    {new Date(zone.last_updated).toLocaleTimeString()}
                  </span>
                </div>

                <div className={`grid grid-cols-2 gap-2 text-gray-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                  <div className="flex items-center space-x-1">
                    <Users className={isMobile ? 'w-2 h-2' : 'w-3 h-3'} />
                    <span>{zone.current_count}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className={isMobile ? 'w-2 h-2' : 'w-3 h-3'} />
                    <span>{zone.capacity}</span>
                  </div>
                </div>

                <div className="mt-2">
                  <div className={`flex justify-between text-gray-600 mb-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    <span>Occupancy</span>
                    <span>{((zone.current_count / zone.capacity) * 100).toFixed(1)}%</span>
                  </div>
                  <div className={`w-full bg-gray-200 rounded-full ${isMobile ? 'h-1' : 'h-1.5'}`}>
                    <div
                      className={`rounded-full ${
                        isMobile ? 'h-1' : 'h-1.5'
                      } ${
                        zone.status === 'safe' ? 'bg-green-500' :
                        zone.status === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((zone.current_count / zone.capacity) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {zone.status === 'critical' && (
                  <div className={`mt-2 flex items-center space-x-1 text-red-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    <AlertTriangle className={isMobile ? 'w-2 h-2' : 'w-3 h-3'} />
                    <span>Evacuation recommended</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className={`border-t border-gray-200 bg-gray-50 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className={`font-bold text-green-600 ${isMobile ? 'text-base' : 'text-lg'}`}>
              {zones.filter(z => z.status === 'safe').length}
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>Safe</div>
          </div>
          <div>
            <div className={`font-bold text-yellow-600 ${isMobile ? 'text-base' : 'text-lg'}`}>
              {zones.filter(z => z.status === 'moderate').length}
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>Moderate</div>
          </div>
          <div>
            <div className={`font-bold text-red-600 ${isMobile ? 'text-base' : 'text-lg'}`}>
              {zones.filter(z => z.status === 'critical').length}
            </div>
            <div className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>Critical</div>
          </div>
        </div>
      </div>
    </div>
  );
};