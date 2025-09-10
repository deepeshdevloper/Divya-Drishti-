import React, { useRef, useEffect, useState } from 'react';
import { Zone, EvacuationRoute } from '../../types';
import { UJJAIN_CENTER } from '../../data/mockData';
import { Maximize2, Minimize2, RotateCcw, Layers, Info } from 'lucide-react';

// Import performance optimizer
import { performanceOptimizer } from '../../utils/performanceOptimizer';

interface SimpleMapProps {
  zones: Zone[];
  showHeatmap: boolean;
  showEvacuationRoutes: boolean;
  showFlowIndicators?: boolean;
  selectedZone?: string;
  onZoneClick?: (zone: Zone) => void;
}

export const SimpleMap: React.FC<SimpleMapProps> = ({
  zones,
  showHeatmap,
  showEvacuationRoutes,
  showFlowIndicators = false,
  selectedZone,
  onZoneClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapCenter] = useState(UJJAIN_CENTER);
  const [zoom, setZoom] = useState(15);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isMobile, setIsMobile] = useState(false);

  // Responsive breakpoints
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = canvasRef.current?.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      
      // Responsive canvas sizing
      let width, height;
      
      if (isFullscreen) {
        width = window.innerWidth;
        height = window.innerHeight;
      } else if (isMobileView) {
        width = Math.min(containerRect.width - 20, window.innerWidth - 40);
        height = Math.min(400, window.innerHeight * 0.5);
      } else {
        width = Math.min(containerRect.width - 20, 1200);
        height = Math.min(600, window.innerHeight * 0.7);
      }
      
      setCanvasSize({ width, height });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    window.addEventListener('orientationchange', updateCanvasSize);
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('orientationchange', updateCanvasSize);
    };
  }, [isFullscreen]);

  useEffect(() => {
    drawMap();
  }, [zones, showHeatmap, showEvacuationRoutes, showFlowIndicators, selectedZone, zoom, canvasSize, isMobile]);

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      drawMapContent(ctx, canvasSize.width, canvasSize.height);
    } catch (error) {
      console.error('Map drawing error:', error);
    }
  };
  
  const drawMapContent = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx, width, height);

    // Draw zones
    if (showHeatmap) {
      drawZones(ctx, width, height);
    }

    // Draw evacuation routes
    if (showEvacuationRoutes) {
      drawEvacuationRoutes(ctx, width, height);
    }

    // Draw flow indicators
    if (showFlowIndicators) {
      drawFlowIndicators(ctx, width, height);
    }

    // Draw legend
    drawLegend(ctx, width, height);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Vertical lines
      const gridSpacing = Math.max(isMobile ? 30 : 50, width / (isMobile ? 15 : 20)); // Mobile-adaptive grid
      for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
      for (let y = 0; y < height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    } catch (error) {
      console.error('Grid drawing error:', error);
    }
  };

  const drawZones = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      const zonesToDraw = zones.slice(0, isMobile ? 6 : 10);
      
      zonesToDraw.forEach((zone, index) => {
        const cols = isMobile ? 2 : 3;
        const padding = isMobile ? 20 : 50;
        const x = (index % cols) * (width / cols) + padding;
        const y = Math.floor(index / cols) * (height / Math.ceil(zonesToDraw.length / cols)) + padding;
        const zoneWidth = width / cols - (padding * 2);
        const zoneHeight = height / Math.ceil(zonesToDraw.length / cols) - (padding * 2);

      // Get zone color based on status
      const color = getZoneColor(zone.status);
      const isSelected = selectedZone === zone.id;

      // Draw zone rectangle
      ctx.fillStyle = color + '40'; // Add transparency
      ctx.fillRect(x, y, zoneWidth, zoneHeight);

      // Draw zone border
      ctx.strokeStyle = color;
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.setLineDash(isSelected ? [10, 5] : []);
      ctx.strokeRect(x, y, zoneWidth, zoneHeight);
      ctx.setLineDash([]);

      // Draw zone label
      ctx.fillStyle = '#1f2937';
      ctx.font = `bold ${isMobile ? '12px' : '14px'} Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, x + zoneWidth / 2, y + (isMobile ? 15 : 20));

      // Draw crowd count
      ctx.font = `bold ${isMobile ? '18px' : '24px'} Arial`;
      ctx.fillText(zone.current_count.toString(), x + zoneWidth / 2, y + zoneHeight / 2);

      // Draw capacity info
      ctx.font = `${isMobile ? '10px' : '12px'} Arial`;
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`/ ${zone.capacity}`, x + zoneWidth / 2, y + zoneHeight / 2 + (isMobile ? 15 : 20));

      // Draw status indicator
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + zoneWidth - (isMobile ? 15 : 20), y + (isMobile ? 15 : 20), isMobile ? 6 : 8, 0, 2 * Math.PI);
      ctx.fill();

      // Draw occupancy percentage
      const occupancy = (zone.current_count / zone.capacity) * 100;
      ctx.fillStyle = '#374151';
      ctx.font = `${isMobile ? '8px' : '10px'} Arial`;
      ctx.fillText(`${occupancy.toFixed(1)}%`, x + zoneWidth / 2, y + zoneHeight - (isMobile ? 8 : 10));
    });
    } catch (error) {
      console.error('Zone drawing error:', error);
    }
  };

  const drawEvacuationRoutes = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
    // Draw sample evacuation routes between zones
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);

    // Draw arrows between critical and safe zones
    const criticalZones = zones.filter(z => z.status === 'critical');
    const safeZones = zones.filter(z => z.status === 'safe');

    criticalZones.forEach((criticalZone, criticalIndex) => {
      safeZones.forEach((safeZone, safeIndex) => {
        const startX = (criticalIndex % 3) * (width / 3) + width / 6;
        const startY = Math.floor(criticalIndex / 3) * (height / 3) + height / 6;
        const endX = (safeIndex % 3) * (width / 3) + width / 6;
        const endY = Math.floor(safeIndex / 3) * (height / 3) + height / 6;

        // Draw route line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrow head
        drawArrowHead(ctx, startX, startY, endX, endY);
      });
    });

    ctx.setLineDash([]);
    } catch (error) {
      console.error('Evacuation routes drawing error:', error);
    }
  };

  const drawFlowIndicators = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      const criticalZones = zones.filter(z => z.status === 'critical');
      
      criticalZones.forEach((zone, index) => {
      const centerX = (index % 3) * (width / 3) + width / 6;
      const centerY = Math.floor(index / 3) * (height / 3) + height / 6;

      if (zone.status === 'critical') {
        // Draw outward flow arrows
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60) * (Math.PI / 180);
          const startX = centerX + Math.cos(angle) * 20;
          const startY = centerY + Math.sin(angle) * 20;
          const endX = centerX + Math.cos(angle) * 60;
          const endY = centerY + Math.sin(angle) * 60;

          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          drawArrowHead(ctx, startX, startY, endX, endY);
        }
      }
    });
    } catch (error) {
      console.error('Flow indicators drawing error:', error);
    }
  };

  const drawArrowHead = (ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number) => {
    try {
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle - arrowAngle),
      endY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowLength * Math.cos(angle + arrowAngle),
      endY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
    } catch (error) {
      console.error('Arrow drawing error:', error);
    }
  };

  const drawLegend = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!showLegend || (isMobile && width < 400)) return; // Hide legend on small mobile screens
    
    try {
    const legendWidth = isMobile ? 140 : 180;
    const legendHeight = isMobile ? 100 : 120;
    const legendX = width - legendWidth - (isMobile ? 10 : 20);
    const legendY = isMobile ? 10 : 20;

    // Legend background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    // Legend title
    ctx.fillStyle = '#1f2937';
    ctx.font = `bold ${isMobile ? '12px' : '14px'} Arial`;
    ctx.textAlign = 'left';
    ctx.fillText('Zone Status', legendX + (isMobile ? 8 : 10), legendY + (isMobile ? 16 : 20));

    // Legend items
    const legendItems = [
      { color: '#10b981', label: 'Safe (0-60%)' },
      { color: '#f59e0b', label: 'Moderate (60-90%)' },
      { color: '#ef4444', label: 'Critical (>90%)' }
    ];

    legendItems.forEach((item, index) => {
      const itemY = legendY + (isMobile ? 32 : 40) + index * (isMobile ? 20 : 25);
      
      // Color indicator
      ctx.fillStyle = item.color;
      const indicatorSize = isMobile ? 12 : 15;
      ctx.fillRect(legendX + (isMobile ? 8 : 10), itemY - (indicatorSize / 2), indicatorSize, indicatorSize);
      
      // Label
      ctx.fillStyle = '#374151';
      ctx.font = `${isMobile ? '10px' : '12px'} Arial`;
      ctx.fillText(item.label, legendX + (isMobile ? 25 : 35), itemY + 3);
    });
    } catch (error) {
      console.error('Legend drawing error:', error);
    }
  };

  const getZoneColor = (status: string) => {
    switch (status) {
      case 'safe': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    try {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Determine which zone was clicked
    const cols = isMobile ? 2 : 3;
    const zoneIndex = Math.floor(x / (canvas.width / cols)) + Math.floor(y / (canvas.height / Math.ceil(zones.length / cols))) * cols;
    if (zoneIndex < zones.length) {
      onZoneClick?.(zones[zoneIndex]);
    }
    } catch (error) {
      console.error('Canvas click error:', error);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 20));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 10));
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const resetView = () => {
    setZoom(15);
    setShowLegend(true);
  };

  return (
    <div className={`relative w-full bg-gray-100 rounded-lg overflow-hidden ${
      isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : 'h-full'
    }`}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className={`w-full cursor-pointer ${
          isFullscreen ? 'h-screen' : isMobile ? 'h-80' : 'h-full'
        }`}
        onClick={handleCanvasClick}
        style={{
          maxWidth: '100%',
          height: 'auto',
          touchAction: 'manipulation'
        }}
      />
      
      {/* Map Controls */}
      <div className={`absolute bg-white rounded-lg shadow-md p-2 space-y-1 ${
        isMobile ? 'top-2 left-2' : 'top-4 left-4'
      }`}>
        <button
          onClick={handleZoomIn}
          className={`block bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-bold ${
            isMobile ? 'w-6 h-6 text-xs' : 'w-8 h-8'
          }`}
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className={`block bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-bold ${
            isMobile ? 'w-6 h-6 text-xs' : 'w-8 h-8'
          }`}
        >
          −
        </button>
        <button
          onClick={resetView}
          className={`block bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors ${
            isMobile ? 'w-6 h-6 p-1' : 'w-8 h-8 p-1'
          }`}
          title="Reset view"
        >
          <RotateCcw className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
        </button>
        {!isMobile && (
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="block w-8 h-8 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors p-1"
            title="Toggle legend"
          >
            <Layers className="w-4 h-4" />
          </button>
        )}
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
      </div>

      {/* Map Info */}
      <div className={`absolute bg-white rounded-lg shadow-md ${
        isMobile ? 'bottom-2 left-2 p-2' : 'bottom-4 left-4 p-3'
      }`}>
        <div className={isMobile ? 'text-xs text-gray-600' : 'text-sm text-gray-600'}>
          <div>Ujjain Divya Drishti (दिव्य  दृष्टि)</div>
          {!isMobile && <div>Zoom: {zoom}</div>}
          <div>Zones: {zones.length}</div>
          {performanceOptimizer && performanceOptimizer.isSystemStressed() && (
            <div className={`text-red-600 ${isMobile ? 'text-xs' : 'text-xs'}`}>High Load</div>
          )}
        </div>
      </div>

      {/* Selected Zone Info */}
      {selectedZone && (
        <div className={`absolute bg-white rounded-lg shadow-md ${
          isMobile 
            ? 'top-2 right-2 p-3 max-w-48 text-sm' 
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
                    <span>Status:</span>
                    <span className={`font-medium capitalize ${
                      zone.status === 'safe' ? 'text-green-600' :
                      zone.status === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {zone.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      
      {/* Mobile-specific touch instructions */}
      {isMobile && !selectedZone && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-lg text-center text-xs pointer-events-none">
          <Info className="w-4 h-4 mx-auto mb-1" />
          <div>Tap zones to view details</div>
          <div>Pinch to zoom</div>
        </div>
      )}
      
      {/* Fullscreen exit button */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 bg-red-600 text-white p-3 rounded-full hover:bg-red-700 transition-colors z-10"
        >
          <Minimize2 className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};