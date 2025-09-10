import React, { useRef, useEffect, useState } from 'react';

interface DetectionOverlayProps {
  videoElement: HTMLVideoElement | null;
  detectionResults: any;
  roi: [number, number, number, number];
  showOverlay: boolean;
  showROI: boolean;
  isDetecting: boolean;
  detectionCount: number;
  fps: number;
  lastDetectionTime: number;
  detectionInterval: number;
  trackingHistory?: Map<number, any[]>;
}

export const DetectionOverlay: React.FC<DetectionOverlayProps> = ({
  videoElement,
  detectionResults,
  roi,
  showOverlay,
  showROI,
  isDetecting,
  detectionCount,
  fps,
  lastDetectionTime,
  detectionInterval,
  trackingHistory = new Map()
}) => {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [overlayDimensions, setOverlayDimensions] = useState({ width: 0, height: 0 });
  const [personColors] = useState<Map<number, string>>(new Map());
  const [videoRect, setVideoRect] = useState<DOMRect | null>(null);

  // Generate consistent colors for person tracking
  const getPersonColor = (personId: number): string => {
    if (!personColors.has(personId)) {
      const hue = (personId * 137.508) % 360; // Golden angle for good color distribution
      const color = `hsl(${hue}, 85%, 60%)`;
      personColors.set(personId, color);
    }
    return personColors.get(personId)!;
  };

  // FIXED: Enhanced synchronization with video element
  useEffect(() => {
    const syncOverlayWithVideo = () => {
      if (!videoElement || !overlayCanvasRef.current) return;

      const video = videoElement;
      const overlayCanvas = overlayCanvasRef.current;
      
      const updateOverlay = () => {
        try {
          const videoRect = video.getBoundingClientRect();
          const containerRect = video.parentElement?.getBoundingClientRect();
          
          if (!containerRect || videoRect.width === 0 || videoRect.height === 0) {
            console.warn('Invalid video or container dimensions');
            return;
          }

          // FIXED: Calculate exact video display dimensions
          const videoDisplayWidth = Math.floor(videoRect.width);
          const videoDisplayHeight = Math.floor(videoRect.height);
          
          // FIXED: Set canvas to match exact video display size
          overlayCanvas.width = videoDisplayWidth;
          overlayCanvas.height = videoDisplayHeight;
          overlayCanvas.style.width = `${videoDisplayWidth}px`;
          overlayCanvas.style.height = `${videoDisplayHeight}px`;
          
          // FIXED: Position overlay exactly over video
          const videoOffsetX = Math.floor(videoRect.left - containerRect.left);
          const videoOffsetY = Math.floor(videoRect.top - containerRect.top);
          
          overlayCanvas.style.position = 'absolute';
          overlayCanvas.style.left = `${videoOffsetX}px`;
          overlayCanvas.style.top = `${videoOffsetY}px`;
          overlayCanvas.style.pointerEvents = 'none';
          overlayCanvas.style.zIndex = '30';
          overlayCanvas.style.backgroundColor = 'transparent';
          
          // Store dimensions and video rect for coordinate calculations
          setOverlayDimensions({ width: videoDisplayWidth, height: videoDisplayHeight });
          setVideoRect(videoRect);
          
          console.log('🎯 Overlay synchronized with video:', {
            videoSize: `${videoDisplayWidth}x${videoDisplayHeight}`,
            position: `${videoOffsetX},${videoOffsetY}`,
            videoRect: {
              width: videoRect.width,
              height: videoRect.height,
              left: videoRect.left,
              top: videoRect.top
            }
          });
        } catch (error) {
          console.error('Error updating overlay:', error);
        }
      };

      // Initial sync
      updateOverlay();
      
      // Sync on video events
      const handleVideoEvents = () => {
        setTimeout(updateOverlay, 100);
      };
      
      video.addEventListener('loadedmetadata', handleVideoEvents);
      video.addEventListener('resize', handleVideoEvents);
      video.addEventListener('canplay', handleVideoEvents);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleVideoEvents);
        video.removeEventListener('resize', handleVideoEvents);
        video.removeEventListener('canplay', handleVideoEvents);
      };
    };

    // FIXED: Enhanced resize observer for better synchronization
    const resizeObserver = new ResizeObserver((entries) => {
      if (videoElement && overlayCanvasRef.current) {
        // Debounce resize updates
        setTimeout(() => {
          try {
            const videoRect = videoElement.getBoundingClientRect();
            const overlayCanvas = overlayCanvasRef.current!;
            
            if (videoRect.width > 0 && videoRect.height > 0) {
              const newWidth = Math.floor(videoRect.width);
              const newHeight = Math.floor(videoRect.height);
              
              overlayCanvas.width = newWidth;
              overlayCanvas.height = newHeight;
              overlayCanvas.style.width = `${newWidth}px`;
              overlayCanvas.style.height = `${newHeight}px`;
              
              setOverlayDimensions({ width: newWidth, height: newHeight });
              setVideoRect(videoRect);
              
              console.log('🔄 Overlay resized:', `${newWidth}x${newHeight}`);
            }
          } catch (error) {
            console.error('Error in resize observer:', error);
          }
        }, 50);
      }
    });

    if (videoElement) {
      const cleanup = syncOverlayWithVideo();
      resizeObserver.observe(videoElement);
      
      if (videoElement.parentElement) {
        resizeObserver.observe(videoElement.parentElement);
      }
      
      return () => {
        cleanup?.();
        resizeObserver.disconnect();
      };
    }
  }, [videoElement]);

  // FIXED: Enhanced animation loop with proper coordinate handling
  useEffect(() => {
    const animateOverlay = () => {
      if ((showOverlay || showROI) && overlayDimensions.width > 0 && overlayDimensions.height > 0) {
        drawEnhancedDetectionOverlay();
      }
      
      if (isDetecting || showROI || trackingHistory.size > 0) {
        animationFrameRef.current = requestAnimationFrame(animateOverlay);
      }
    };

    if (isDetecting || showROI || trackingHistory.size > 0) {
      animationFrameRef.current = requestAnimationFrame(animateOverlay);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isDetecting, showOverlay, showROI, detectionResults, roi, trackingHistory, overlayDimensions]);

  const drawEnhancedDetectionOverlay = () => {
    const overlayCanvas = overlayCanvasRef.current;
    if (!overlayCanvas || !videoElement || overlayDimensions.width === 0 || overlayDimensions.height === 0) return;

    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    try {
      // Clear canvas completely
      ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

      if (showROI) {
        drawEnhancedROI(ctx);
      }

      if (showOverlay && detectionResults?.boxes) {
        drawPersonTrackingBoxes(ctx);
      }

      if (showOverlay && trackingHistory.size > 0) {
        drawPersonTrails(ctx);
      }

      if (showOverlay && detectionResults) {
        drawEnhancedInfo(ctx);
      }

      if (isDetecting) {
        drawLiveIndicator(ctx);
      }
    } catch (error) {
      console.error('Error drawing overlay:', error);
    }
  };

  const drawEnhancedROI = (ctx: CanvasRenderingContext2D) => {
    try {
      const [x1, y1, x2, y2] = roi;
      
      // FIXED: Calculate ROI coordinates in overlay canvas space
      const roiX = x1 * overlayDimensions.width;
      const roiY = y1 * overlayDimensions.height;
      const roiWidth = (x2 - x1) * overlayDimensions.width;
      const roiHeight = (y2 - y1) * overlayDimensions.height;

      // Animated border with gradient
      const gradient = ctx.createLinearGradient(roiX, roiY, roiX + roiWidth, roiY + roiHeight);
      gradient.addColorStop(0, '#3b82f6');
      gradient.addColorStop(0.5, '#8b5cf6');
      gradient.addColorStop(1, '#06b6d4');
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 10]);
      ctx.lineDashOffset = -(Date.now() / 40) % 30;
      ctx.strokeRect(roiX, roiY, roiWidth, roiHeight);
      ctx.setLineDash([]);

      // Corner markers
      const cornerSize = 15;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(roiX, roiY + cornerSize);
      ctx.lineTo(roiX, roiY);
      ctx.lineTo(roiX + cornerSize, roiY);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(roiX + roiWidth - cornerSize, roiY);
      ctx.lineTo(roiX + roiWidth, roiY);
      ctx.lineTo(roiX + roiWidth, roiY + cornerSize);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(roiX, roiY + roiHeight - cornerSize);
      ctx.lineTo(roiX, roiY + roiHeight);
      ctx.lineTo(roiX + cornerSize, roiY + roiHeight);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(roiX + roiWidth - cornerSize, roiY + roiHeight);
      ctx.lineTo(roiX + roiWidth, roiY + roiHeight);
      ctx.lineTo(roiX + roiWidth, roiY + roiHeight - cornerSize);
      ctx.stroke();

      // ROI info badge
      const badgeWidth = 80;
      const badgeHeight = 20;
      const badgeX = roiX + roiWidth - badgeWidth - 5;
      const badgeY = roiY + 5;
      
      ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
      ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      const coverage = ((x2 - x1) * (y2 - y1) * 100).toFixed(0);
      ctx.fillText(`ROI ${coverage}%`, badgeX + badgeWidth/2, badgeY + 13);
    } catch (error) {
      console.error('Error drawing ROI:', error);
    }
  };

  const drawPersonTrackingBoxes = (ctx: CanvasRenderingContext2D) => {
    if (!detectionResults.boxes || detectionResults.boxes.length === 0) return;

    try {
      const time = Date.now();
      const animationPhase = (time / 800) % (Math.PI * 2);
      
      // FIXED: Handle both array and Float32Array formats
      let boxes: number[];
      if (Array.isArray(detectionResults.boxes)) {
        // If boxes is already an array of arrays, flatten it
        boxes = detectionResults.boxes.flat();
      } else {
        // If boxes is Float32Array, convert to regular array
        boxes = Array.from(detectionResults.boxes);
      }
      
      const numDetections = boxes.length / 4;
      console.log(`🎨 Drawing ${numDetections} detection boxes on overlay`);
      
      for (let i = 0; i < numDetections; i++) {
        const x1 = boxes[i * 4];
        const y1 = boxes[i * 4 + 1];
        const x2 = boxes[i * 4 + 2];
        const y2 = boxes[i * 4 + 3];
        
        // FIXED: Convert normalized coordinates [0,1] to overlay canvas coordinates
        const boxX = Math.round(x1 * overlayDimensions.width);
        const boxY = Math.round(y1 * overlayDimensions.height);
        const boxWidth = Math.round((x2 - x1) * overlayDimensions.width);
        const boxHeight = Math.round((y2 - y1) * overlayDimensions.height);

        // Validate box dimensions
        if (boxWidth < 5 || boxHeight < 5) {
          console.warn(`Box ${i} too small, skipping:`, { boxWidth, boxHeight });
          continue;
        }

        // FIXED: Ensure coordinates are within canvas bounds
        const clampedX = Math.max(0, Math.min(boxX, overlayDimensions.width - 5));
        const clampedY = Math.max(0, Math.min(boxY, overlayDimensions.height - 5));
        const clampedWidth = Math.min(boxWidth, overlayDimensions.width - clampedX);
        const clampedHeight = Math.min(boxHeight, overlayDimensions.height - clampedY);

        if (clampedWidth < 5 || clampedHeight < 5) {
          console.warn(`Box ${i} out of bounds, skipping`);
          continue;
        }

        const confidence = detectionResults.scores?.[i] || 0.5;
        const personId = detectionResults.personIds?.[i] || i;
        
        // Get consistent color for this person
        const personColor = getPersonColor(personId);
        
        ctx.save();
        
        // Enhanced bounding box with person-specific styling
        const pulseIntensity = 1 + Math.sin(animationPhase * 3 + personId) * 0.15;
        const lineWidth = Math.max(2, Math.min(4, confidence * 6));
        
        // Outer glow effect
        ctx.shadowColor = personColor;
        ctx.shadowBlur = 12 * pulseIntensity;
        ctx.strokeStyle = personColor;
        ctx.lineWidth = lineWidth;
        
        // FIXED: Draw main bounding box with exact coordinates
        ctx.strokeRect(clampedX, clampedY, clampedWidth, clampedHeight);
        
        // Inner highlight
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(clampedX + 1, clampedY + 1, clampedWidth - 2, clampedHeight - 2);
        
        // Person ID and confidence badge
        const badgeText = `P${personId}`;
        const confidenceText = `${(confidence * 100).toFixed(0)}%`;
        const badgeWidth = 45;
        const badgeHeight = 32;
        
        let badgeX = clampedX;
        let badgeY = clampedY - badgeHeight - 2;
        
        // Adjust badge position if it goes outside canvas
        if (badgeY < 0) {
          badgeY = clampedY + clampedHeight + 2;
        }
        if (badgeX + badgeWidth > overlayDimensions.width) {
          badgeX = overlayDimensions.width - badgeWidth;
        }
        
        // Badge background with gradient
        const gradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY + badgeHeight);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
        
        // Badge border
        ctx.strokeStyle = personColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
        
        // Person ID
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, badgeX + badgeWidth/2, badgeY + 12);
        
        // Confidence
        ctx.fillStyle = personColor;
        ctx.font = '8px Arial';
        ctx.fillText(confidenceText, badgeX + badgeWidth/2, badgeY + 24);

        // FIXED: Enhanced center point with person indicator
        const centerX = clampedX + clampedWidth / 2;
        const centerY = clampedY + clampedHeight / 2;
        
        // Outer ring
        ctx.strokeStyle = personColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Inner filled circle
        ctx.fillStyle = personColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        // Center dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // FIXED: Movement direction indicator with proper scaling
        if (detectionResults.trackingData && detectionResults.trackingData[i]) {
          const track = detectionResults.trackingData[i];
          if (track.velocityX !== undefined && track.velocityY !== undefined) {
            const velocity = Math.sqrt(track.velocityX * track.velocityX + track.velocityY * track.velocityY);
            if (velocity > 0.01) { // Lower threshold for better visibility
              const angle = Math.atan2(track.velocityY, track.velocityX);
              const arrowLength = Math.min(50, Math.max(15, velocity * 200)); // Better scaling
              
              const endX = centerX + Math.cos(angle) * arrowLength;
              const endY = centerY + Math.sin(angle) * arrowLength;
              
              // Movement arrow
              ctx.strokeStyle = personColor;
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(centerX, centerY);
              ctx.lineTo(endX, endY);
              ctx.stroke();
              
              // Arrow head
              const headLength = 10;
              const headAngle = Math.PI / 6;
              
              ctx.beginPath();
              ctx.moveTo(endX, endY);
              ctx.lineTo(
                endX - headLength * Math.cos(angle - headAngle),
                endY - headLength * Math.sin(angle - headAngle)
              );
              ctx.moveTo(endX, endY);
              ctx.lineTo(
                endX - headLength * Math.cos(angle + headAngle),
                endY - headLength * Math.sin(angle + headAngle)
              );
              ctx.stroke();
            }
          }
        }
        
        // Confidence visualization ring
        const confidenceRadius = 12;
        const confidenceAngle = confidence * 2 * Math.PI;
        
        ctx.strokeStyle = personColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, confidenceRadius, -Math.PI/2, -Math.PI/2 + confidenceAngle);
        ctx.stroke();
        
        ctx.restore();
        
        // Debug log for first few boxes
        if (i < 3) {
          console.log(`Box ${i} drawn:`, {
            normalized: [x1.toFixed(3), y1.toFixed(3), x2.toFixed(3), y2.toFixed(3)],
            canvas: [clampedX, clampedY, clampedWidth, clampedHeight],
            center: [centerX, centerY],
            confidence: confidence.toFixed(3)
          });
        }
      }
    } catch (error) {
      console.error('Error drawing person tracking boxes:', error);
    }
  };

  const drawPersonTrails = (ctx: CanvasRenderingContext2D) => {
    if (trackingHistory.size === 0) return;

    try {
      ctx.save();
      
      for (const [personId, history] of trackingHistory.entries()) {
        if (history.length < 2) continue;
        
        const personColor = getPersonColor(personId);
        
        // Draw trail
        ctx.strokeStyle = personColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        
        ctx.beginPath();
        for (let i = 0; i < history.length; i++) {
          const point = history[i];
          
          // FIXED: Convert normalized coordinates to canvas coordinates
          const x = point.x * overlayDimensions.width;
          const y = point.y * overlayDimensions.height;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          
          // Draw trail points with fading effect
          const age = (Date.now() - point.timestamp) / 5000; // 5 second fade
          const alpha = Math.max(0.1, 1 - age);
          const pointSize = Math.max(1, 3 * alpha);
          
          ctx.save();
          ctx.globalAlpha = alpha * 0.8;
          ctx.fillStyle = personColor;
          ctx.beginPath();
          ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        }
        
        ctx.stroke();
      }
      
      ctx.restore();
    } catch (error) {
      console.error('Error drawing person trails:', error);
    }
  };

  const drawEnhancedInfo = (ctx: CanvasRenderingContext2D) => {
    if (!detectionResults) return;
    
    try {
      const count = detectionResults.count || 0;
      const confidence = detectionResults.confidence || 0;
      const trackedPersons = trackingHistory.size;

      // Enhanced info panel with better positioning
      const panelWidth = 220;
      const panelHeight = 80;
      const panelX = overlayDimensions.width - panelWidth - 10;
      const panelY = 10;

      // Ensure panel fits in canvas
      if (panelX < 0 || panelY < 0) return;

      // Panel background with gradient
      const gradient = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
      
      // Panel border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);

      // Main count display
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`👥 ${count}`, panelX + 10, panelY + 30);
      
      // Secondary info
      ctx.font = '10px Arial';
      ctx.fillStyle = '#e5e7eb';
      ctx.fillText(`Confidence: ${(confidence * 100).toFixed(0)}%`, panelX + 10, panelY + 45);
      ctx.fillText(`Tracked: ${trackedPersons} | FPS: ${fps}`, panelX + 10, panelY + 58);
      ctx.fillText(`Processing: ${(detectionResults.processingTime || 0).toFixed(0)}ms`, panelX + 10, panelY + 71);

      // Detection quality indicator
      const qualityX = panelX + panelWidth - 25;
      const qualityY = panelY + 15;
      const qualityRadius = 8;
      
      const qualityColor = confidence > 0.8 ? '#10b981' : 
                          confidence > 0.6 ? '#f59e0b' : '#ef4444';
      
      ctx.fillStyle = qualityColor;
      ctx.beginPath();
      ctx.arc(qualityX, qualityY, qualityRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('●', qualityX, qualityY + 2);
    } catch (error) {
      console.error('Error drawing enhanced info:', error);
    }
  };

  const drawLiveIndicator = (ctx: CanvasRenderingContext2D) => {
    try {
      const pulseAlpha = 0.8 + Math.sin(Date.now() / 300) * 0.2;
      const pulseSize = 10 + Math.sin(Date.now() / 200) * 2;
      
      ctx.save();
      ctx.globalAlpha = pulseAlpha;
      
      // Outer ring
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(30, 30, pulseSize + 3, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Inner filled circle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(30, 30, pulseSize, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.restore();
      
      // "LIVE" text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 6px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('LIVE', 30, 32);
      
      // Recording indicator
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('🔴 REC', 50, 34);
    } catch (error) {
      console.error('Error drawing live indicator:', error);
    }
  };

  // FIXED: Draw crowd density heatmap overlay with proper coordinate handling
  const drawCrowdDensityOverlay = (ctx: CanvasRenderingContext2D) => {
    if (!detectionResults.boxes || detectionResults.boxes.length === 0) return;

    try {
      const gridSize = 40;
      const cols = Math.ceil(overlayDimensions.width / gridSize);
      const rows = Math.ceil(overlayDimensions.height / gridSize);
      
      // Create density grid
      const densityGrid = Array(rows).fill(null).map(() => Array(cols).fill(0));
      
      // FIXED: Calculate density for each grid cell with proper coordinate conversion
      let boxes: number[];
      if (Array.isArray(detectionResults.boxes)) {
        boxes = detectionResults.boxes.flat();
      } else {
        boxes = Array.from(detectionResults.boxes);
      }
      
      const numDetections = boxes.length / 4;
      
      for (let i = 0; i < numDetections; i++) {
        const x1 = boxes[i * 4];
        const y1 = boxes[i * 4 + 1];
        const x2 = boxes[i * 4 + 2];
        const y2 = boxes[i * 4 + 3];
        
        // Calculate center in canvas coordinates
        const centerX = ((x1 + x2) / 2) * overlayDimensions.width;
        const centerY = ((y1 + y2) / 2) * overlayDimensions.height;
        
        const gridX = Math.floor(centerX / gridSize);
        const gridY = Math.floor(centerY / gridSize);
        
        if (gridX >= 0 && gridX < cols && gridY >= 0 && gridY < rows) {
          densityGrid[gridY][gridX] += 1;
        }
      }
      
      // Draw density overlay
      ctx.save();
      ctx.globalAlpha = 0.3;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const density = densityGrid[row][col];
          if (density > 0) {
            const intensity = Math.min(1, density / 3);
            const hue = 120 - (intensity * 120); // Green to red
            ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${intensity * 0.5})`;
            ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
          }
        }
      }
      
      ctx.restore();
    } catch (error) {
      console.error('Error drawing crowd density overlay:', error);
    }
  };

  return (
    <>
      <canvas
        ref={overlayCanvasRef}
        className="absolute pointer-events-none"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 30,
          display: (showOverlay || showROI) ? 'block' : 'none',
          backgroundColor: 'transparent'
        }}
      />
      
      {/* Enhanced detection statistics overlay */}
      {showOverlay && detectionResults && (
        <div className="absolute bottom-20 left-4 bg-black bg-opacity-80 text-white rounded-lg p-2 text-xs pointer-events-none" style={{ zIndex: 35 }}>
          <div className="grid grid-cols-2 gap-2">
            <div>Detected: {detectionResults.count}</div>
            <div>Tracked: {trackingHistory.size}</div>
            <div>Density: {detectionResults.crowdDensity}</div>
            <div>Quality: {((detectionResults.confidence || 0) * 100).toFixed(0)}%</div>
          </div>
          {/* Debug info for coordinate verification */}
          <div className="mt-1 text-xs text-gray-300">
            Overlay: {overlayDimensions.width}×{overlayDimensions.height}
          </div>
        </div>
      )}
    </>
  );
};