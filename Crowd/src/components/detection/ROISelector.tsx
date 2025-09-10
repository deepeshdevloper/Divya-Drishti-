import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Target, RotateCcw, Grid, Copy, Lock, Unlock, Save } from 'lucide-react';

interface ROISelectorProps {
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | null;
  roi: [number, number, number, number];
  onROIChange: (roi: [number, number, number, number]) => void;
  width?: number;
  height?: number;
  className?: string;
  showAdvanced?: boolean;
  onCapture?: () => void;
}

interface ROIPreset {
  name: string;
  roi: [number, number, number, number];
  description: string;
}

export const ROISelector: React.FC<ROISelectorProps> = ({
  imageElement,
  roi,
  onROIChange,
  width = 640,
  height = 480,
  className = '',
  showAdvanced = false,
  onCapture
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragMode, setDragMode] = useState<'create' | 'move' | 'resize'>('create');
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  const roiPresets: ROIPreset[] = [
    { name: 'Full Frame', roi: [0, 0, 1, 1], description: 'Complete coverage' },
    { name: 'Center Focus', roi: [0.25, 0.25, 0.75, 0.75], description: 'Central area' },
    { name: 'Wide Center', roi: [0.1, 0.3, 0.9, 0.7], description: 'Horizontal strip' },
    { name: 'Entrance Zone', roi: [0.1, 0.6, 0.9, 1], description: 'Entry monitoring' },
    { name: 'Queue Area', roi: [0.3, 0.1, 0.7, 0.9], description: 'Vertical queue' },
    { name: 'Dense Crowd', roi: [0.35, 0.35, 0.65, 0.65], description: 'High-density focus' }
  ];

  const drawROI = useCallback(() => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!canvas || !overlayCanvas) return;

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlayCanvas.getContext('2d');
    if (!ctx || !overlayCtx) return;

    canvas.width = width;
    canvas.height = height;
    overlayCanvas.width = width;
    overlayCanvas.height = height;

    ctx.clearRect(0, 0, width, height);
    overlayCtx.clearRect(0, 0, width, height);

    drawBackground(ctx);
    
    if (showGrid) {
      drawGrid(overlayCtx);
    }

    drawROIRectangle(overlayCtx);
  }, [imageElement, roi, width, height, showGrid]);

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    if (imageElement) {
      try {
        if (imageElement instanceof HTMLVideoElement && imageElement.readyState >= 2) {
          ctx.drawImage(imageElement, 0, 0, width, height);
        } else if (imageElement instanceof HTMLImageElement && imageElement.complete) {
          ctx.drawImage(imageElement, 0, 0, width, height);
        } else if (imageElement instanceof HTMLCanvasElement) {
          ctx.drawImage(imageElement, 0, 0, width, height);
        } else {
          drawPlaceholder(ctx);
        }
      } catch (error) {
        drawPlaceholder(ctx);
      }
    } else {
      drawPlaceholder(ctx);
    }
  };

  const drawPlaceholder = (ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f0f9ff');
    gradient.addColorStop(1, '#bae6fd');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎯 ROI Selection', width / 2, height / 2 - 10);
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#3730a3';
    ctx.fillText('Select detection area', width / 2, height / 2 + 15);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    const spacing = 40;
    
    ctx.beginPath();
    for (let i = 0; i <= width; i += spacing) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
    }
    for (let i = 0; i <= height; i += spacing) {
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
    }
    ctx.stroke();
  };

  const drawROIRectangle = (ctx: CanvasRenderingContext2D) => {
    const [x1, y1, x2, y2] = roi;
    const roiX = x1 * width;
    const roiY = y1 * height;
    const roiWidth = (x2 - x1) * width;
    const roiHeight = (y2 - y1) * height;

    // ROI background
    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.fillRect(roiX, roiY, roiWidth, roiHeight);

    // Animated border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 8]);
    ctx.lineDashOffset = -(Date.now() / 30) % 23;
    ctx.strokeRect(roiX, roiY, roiWidth, roiHeight);
    ctx.setLineDash([]);

    // Corner indicators
    drawCorners(ctx, roiX, roiY, roiWidth, roiHeight);

    // Resize handles
    if (!isLocked) {
      drawResizeHandles(ctx, roiX, roiY, roiWidth, roiHeight);
    }

    // Info label
    drawInfoLabel(ctx, roiX, roiY, roiWidth, roiHeight);
  };

  const drawCorners = (ctx: CanvasRenderingContext2D, roiX: number, roiY: number, roiWidth: number, roiHeight: number) => {
    const cornerSize = 20;
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    // Top-left
    ctx.moveTo(roiX, roiY + cornerSize);
    ctx.lineTo(roiX, roiY);
    ctx.lineTo(roiX + cornerSize, roiY);
    
    // Top-right
    ctx.moveTo(roiX + roiWidth - cornerSize, roiY);
    ctx.lineTo(roiX + roiWidth, roiY);
    ctx.lineTo(roiX + roiWidth, roiY + cornerSize);
    
    // Bottom-left
    ctx.moveTo(roiX, roiY + roiHeight - cornerSize);
    ctx.lineTo(roiX, roiY + roiHeight);
    ctx.lineTo(roiX + cornerSize, roiY + roiHeight);
    
    // Bottom-right
    ctx.moveTo(roiX + roiWidth - cornerSize, roiY + roiHeight);
    ctx.lineTo(roiX + roiWidth, roiY + roiHeight);
    ctx.lineTo(roiX + roiWidth, roiY + roiHeight - cornerSize);
    
    ctx.stroke();
  };

  const drawResizeHandles = (ctx: CanvasRenderingContext2D, roiX: number, roiY: number, roiWidth: number, roiHeight: number) => {
    const handleSize = 12;
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    const handles = [
      [roiX - handleSize/2, roiY - handleSize/2],
      [roiX + roiWidth - handleSize/2, roiY - handleSize/2],
      [roiX - handleSize/2, roiY + roiHeight - handleSize/2],
      [roiX + roiWidth - handleSize/2, roiY + roiHeight - handleSize/2]
    ];
    
    handles.forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.arc(hx + handleSize/2, hy + handleSize/2, handleSize/2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
  };

  const drawInfoLabel = (ctx: CanvasRenderingContext2D, roiX: number, roiY: number, roiWidth: number, roiHeight: number) => {
    const labelWidth = 200;
    const labelHeight = 40;
    let labelX = roiX;
    let labelY = roiY - labelHeight - 5;
    
    if (labelY < 0) labelY = roiY + roiHeight + 5;
    if (labelX + labelWidth > width) labelX = width - labelWidth;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    
    const coverage = ((roi[2] - roi[0]) * (roi[3] - roi[1]) * 100).toFixed(1);
    ctx.fillText(`🎯 Coverage: ${coverage}%`, labelX + 10, labelY + 18);
    
    ctx.font = '10px Arial';
    ctx.fillStyle = '#e5e7eb';
    const dimensions = `${Math.round(roiWidth)}×${Math.round(roiHeight)}px`;
    ctx.fillText(`Size: ${dimensions}`, labelX + 10, labelY + 32);
  };

  useEffect(() => {
    drawROI();
  }, [drawROI]);

  const getMousePosition = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  const normalizeCoordinates = (x: number, y: number) => {
    return {
      x: Math.max(0, Math.min(1, x / width)),
      y: Math.max(0, Math.min(1, y / height))
    };
  };

  const getResizeHandle = (mouseX: number, mouseY: number): string | null => {
    if (isLocked) return null;
    
    const [x1, y1, x2, y2] = roi;
    const roiX1 = x1 * width;
    const roiY1 = y1 * height;
    const roiX2 = x2 * width;
    const roiY2 = y2 * height;
    const handleSize = 15;

    if (Math.abs(mouseX - roiX1) < handleSize && Math.abs(mouseY - roiY1) < handleSize) return 'tl';
    if (Math.abs(mouseX - roiX2) < handleSize && Math.abs(mouseY - roiY1) < handleSize) return 'tr';
    if (Math.abs(mouseX - roiX1) < handleSize && Math.abs(mouseY - roiY2) < handleSize) return 'bl';
    if (Math.abs(mouseX - roiX2) < handleSize && Math.abs(mouseY - roiY2) < handleSize) return 'br';

    return null;
  };

  const isInsideROI = (mouseX: number, mouseY: number): boolean => {
    const [x1, y1, x2, y2] = roi;
    const roiX1 = x1 * width;
    const roiY1 = y1 * height;
    const roiX2 = x2 * width;
    const roiY2 = y2 * height;

    return mouseX >= roiX1 && mouseX <= roiX2 && mouseY >= roiY1 && mouseY <= roiY2;
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isLocked) return;
    
    const { x, y } = getMousePosition(event);
    const handle = getResizeHandle(x, y);

    if (handle) {
      setDragMode('resize');
      setResizeHandle(handle);
    } else if (isInsideROI(x, y)) {
      setDragMode('move');
    } else {
      setDragMode('create');
    }

    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(event);

    if (!isDragging || !dragStart) {
      updateCursor(x, y);
      return;
    }

    const normalizedCurrent = normalizeCoordinates(x, y);
    const normalizedStart = normalizeCoordinates(dragStart.x, dragStart.y);

    let newROI: [number, number, number, number] = [...roi];

    if (dragMode === 'create') {
      newROI = createROI(normalizedStart, normalizedCurrent);
    } else if (dragMode === 'move') {
      newROI = moveROI(normalizedCurrent, normalizedStart);
      setDragStart({ x, y });
    } else if (dragMode === 'resize' && resizeHandle) {
      newROI = resizeROI(normalizedCurrent);
    }

    onROIChange(newROI);
  };

  const updateCursor = (x: number, y: number) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    if (isLocked) {
      canvas.style.cursor = 'not-allowed';
      return;
    }

    const handle = getResizeHandle(x, y);
    if (handle) {
      const cursors = {
        'tl': 'nw-resize', 'tr': 'ne-resize', 'bl': 'sw-resize', 'br': 'se-resize'
      };
      canvas.style.cursor = cursors[handle] || 'default';
    } else if (isInsideROI(x, y)) {
      canvas.style.cursor = 'move';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  };

  const createROI = (start: { x: number; y: number }, current: { x: number; y: number }): [number, number, number, number] => {
    const x1 = Math.min(start.x, current.x);
    const y1 = Math.min(start.y, current.y);
    const x2 = Math.max(start.x, current.x);
    const y2 = Math.max(start.y, current.y);
    
    return [
      Math.max(0, x1),
      Math.max(0, y1),
      Math.min(1, x2),
      Math.min(1, y2)
    ];
  };

  const moveROI = (current: { x: number; y: number }, start: { x: number; y: number }): [number, number, number, number] => {
    const deltaX = current.x - start.x;
    const deltaY = current.y - start.y;
    
    const roiWidth = roi[2] - roi[0];
    const roiHeight = roi[3] - roi[1];
    
    let newX1 = roi[0] + deltaX;
    let newY1 = roi[1] + deltaY;
    
    if (newX1 < 0) newX1 = 0;
    if (newY1 < 0) newY1 = 0;
    if (newX1 + roiWidth > 1) newX1 = 1 - roiWidth;
    if (newY1 + roiHeight > 1) newY1 = 1 - roiHeight;
    
    return [newX1, newY1, newX1 + roiWidth, newY1 + roiHeight];
  };

  const resizeROI = (current: { x: number; y: number }): [number, number, number, number] => {
    const newROI = [...roi] as [number, number, number, number];
    const minSize = 0.05;
    
    switch (resizeHandle) {
      case 'tl':
        newROI[0] = Math.max(0, Math.min(current.x, roi[2] - minSize));
        newROI[1] = Math.max(0, Math.min(current.y, roi[3] - minSize));
        break;
      case 'tr':
        newROI[2] = Math.min(1, Math.max(current.x, roi[0] + minSize));
        newROI[1] = Math.max(0, Math.min(current.y, roi[3] - minSize));
        break;
      case 'bl':
        newROI[0] = Math.max(0, Math.min(current.x, roi[2] - minSize));
        newROI[3] = Math.min(1, Math.max(current.y, roi[1] + minSize));
        break;
      case 'br':
        newROI[2] = Math.min(1, Math.max(current.x, roi[0] + minSize));
        newROI[3] = Math.min(1, Math.max(current.y, roi[1] + minSize));
        break;
    }
    
    return newROI;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setDragMode('create');
    setResizeHandle(null);
  };

  const copyROIToClipboard = () => {
    const roiText = `[${roi.map(val => val.toFixed(4)).join(', ')}]`;
    navigator.clipboard.writeText(roiText).then(() => {
      alert('ROI coordinates copied!');
    });
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">ROI Selection</h3>
            <p className="text-sm text-gray-600">
              Coverage: {((roi[2] - roi[0]) * (roi[3] - roi[1]) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={copyROIToClipboard}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            title="Copy coordinates"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`p-2 rounded-lg transition-colors ${
              isLocked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
            }`}
            title={isLocked ? 'Unlock' : 'Lock'}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative mb-4 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full object-contain"
        />
        
        <canvas
          ref={overlayCanvasRef}
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full object-contain cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Controls */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors shadow-lg ${
              showGrid ? 'bg-blue-100 text-blue-600' : 'bg-white bg-opacity-95 text-gray-600'
            }`}
            title="Toggle grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              onROIChange([0.1, 0.1, 0.9, 0.9]);
              setIsLocked(false);
            }}
            className="p-2 bg-white bg-opacity-95 text-gray-600 rounded-lg hover:bg-opacity-100 transition-all shadow-lg"
            title="Reset ROI"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="absolute bottom-3 right-3 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg text-sm">
          {((roi[2] - roi[0]) * (roi[3] - roi[1]) * 100).toFixed(1)}% coverage
        </div>
      </div>

      {/* ROI Presets */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-3">Quick Presets:</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {roiPresets.map((preset, index) => (
            <button
              key={index}
              onClick={() => onROIChange(preset.roi)}
              className="text-left p-3 rounded-lg transition-all hover:scale-105 border border-gray-200 bg-gray-50 hover:bg-gray-100"
              title={preset.description}
            >
              <div className="text-xs font-medium text-gray-900">{preset.name}</div>
              <div className="text-xs text-gray-500">
                {((preset.roi[2] - preset.roi[0]) * (preset.roi[3] - preset.roi[1]) * 100).toFixed(0)}%
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Input */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {['X1', 'Y1', 'X2', 'Y2'].map((label, index) => (
          <div key={label}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.001"
              value={roi[index].toFixed(3)}
              onChange={(e) => {
                if (isLocked) return;
                const value = Math.max(0, Math.min(1, parseFloat(e.target.value) || 0));
                const newROI = [...roi] as [number, number, number, number];
                newROI[index] = value;
                onROIChange(newROI);
              }}
              disabled={isLocked}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>
        ))}
      </div>

      {/* Analytics */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">ROI Analytics</h4>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Coverage:</span>
              <span className="font-medium">
                {((roi[2] - roi[0]) * (roi[3] - roi[1]) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Dimensions:</span>
              <span className="font-medium">
                {Math.round((roi[2] - roi[0]) * width)}×{Math.round((roi[3] - roi[1]) * height)}px
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Center:</span>
              <span className="font-medium">
                ({((roi[0] + roi[2]) / 2).toFixed(2)}, {((roi[1] + roi[3]) / 2).toFixed(2)})
              </span>
            </div>
            <div className="flex justify-between">
              <span>Quality:</span>
              <span className={`font-medium ${
                ((roi[2] - roi[0]) * (roi[3] - roi[1])) > 0.25 ? 'text-green-600' : 
                ((roi[2] - roi[0]) * (roi[3] - roi[1])) > 0.1 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {((roi[2] - roi[0]) * (roi[3] - roi[1])) > 0.25 ? 'Excellent' : 
                 ((roi[2] - roi[0]) * (roi[3] - roi[1])) > 0.1 ? 'Good' : 'Fair'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="text-xs text-blue-700">
            💡 Larger ROIs (&gt;25%) provide better detection accuracy for people tracking
          </div>
        </div>
      </div>
    </div>
  );
};