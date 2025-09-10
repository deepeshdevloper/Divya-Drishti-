import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Square, Camera, Video, Upload, Target, Download, Maximize2, Minimize2, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { ROISelector } from './ROISelector';
import { DetectionOverlay } from './DetectionOverlay';
import { fineTunedYolo8CrowdService } from '../../services/fineTunedYolo11Service';
import { supabaseService } from '../../services/supabaseService';
import { performanceOptimizer } from '../../utils/performanceOptimizer';

interface VideoFeedProps {
  locationId: string;
  onDetectionResult: (result: any) => void;
  isModelReady: boolean;
  onModelStatusChange: (status: string) => void;
  width?: number;
  height?: number;
  className?: string;
}

type InputSource = 'camera' | 'video' | 'image';

export const VideoFeed: React.FC<VideoFeedProps> = ({
  locationId,
  onDetectionResult,
  isModelReady,
  onModelStatusChange,
  width = 1920,
  height = 1080,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [inputSource, setInputSource] = useState<InputSource>('camera');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState(500);
  const [roi, setROI] = useState<[number, number, number, number]>([0.0, 0.0, 1.0, 1.0]);
  const [detectionResults, setDetectionResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showROI, setShowROI] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [lastDetectionTime, setLastDetectionTime] = useState(0);
  const [videoSize, setVideoSize] = useState({ width: 1920, height: 1080 });
  const [volume, setVolume] = useState(0.5);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [trackingHistory, setTrackingHistory] = useState<Map<number, any[]>>(new Map());

  const detectionLoopRef = useRef<NodeJS.Timeout | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());

  useEffect(() => {
    const updateVideoSize = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const aspectRatio = 16 / 9;
      
      let newWidth, newHeight;
      
      if (isFullscreen) {
        newWidth = window.innerWidth;
        newHeight = window.innerHeight;
      } else {
        const maxWidth = Math.min(containerRect.width - 20, 1400);
        const maxHeight = Math.min(containerRect.height - 100, 800);
        
        if (maxWidth / aspectRatio <= maxHeight) {
          newWidth = maxWidth;
          newHeight = maxWidth / aspectRatio;
        } else {
          newHeight = maxHeight;
          newWidth = newHeight * aspectRatio;
        }
        
        newWidth = Math.max(newWidth, 800);
        newHeight = Math.max(newHeight, 450);
      }
      
      setVideoSize({ width: newWidth, height: newHeight });
    };

    updateVideoSize();
    window.addEventListener('resize', updateVideoSize);
    
    return () => {
      window.removeEventListener('resize', updateVideoSize);
      cleanup();
    };
  }, [isFullscreen]);

  const startCameraFeed = async () => {
    try {
      const video = videoRef.current;
      if (!video) return;

      setError('');
      
      const constraints = {
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: 'environment',
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      video.srcObject = stream;
      video.volume = volume;
      
      video.onloadedmetadata = () => {
        setVideoLoaded(true);
        setVideoSize({ 
          width: video.videoWidth || 1920, 
          height: video.videoHeight || 1080 
        });
      };
      
      video.oncanplay = () => {
        video.play().then(() => {
          setIsPlaying(true);
          setError('');
        }).catch(err => {
          setError('Failed to start video playback');
        });
      };

    } catch (error) {
      setError(`Camera access failed: ${error.message}`);
    }
  };

  const loadVideoFile = (file: File) => {
    try {
      const video = videoRef.current;
      if (!video) return;

      setError('');
      
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
      
      if (video.src && video.src.startsWith('blob:')) {
        URL.revokeObjectURL(video.src);
      }
      
      const url = URL.createObjectURL(file);
      video.src = url;
      video.volume = volume;
      
      video.onloadedmetadata = () => {
        setVideoLoaded(true);
        setVideoSize({ 
          width: video.videoWidth || 1920, 
          height: video.videoHeight || 1080 
        });
        setIsPlaying(false);
        setError('');
      };

      video.onerror = () => {
        setError('Failed to load video file');
        setVideoLoaded(false);
        URL.revokeObjectURL(url);
      };
      
      video.load();
    } catch (error) {
      setError('Failed to load video file');
    }
  };

  const loadImageFile = (file: File) => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      setError('');
      
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
      
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = Math.max(img.width, 1920);
        canvas.height = Math.max(img.height, 1080);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        
        const stream = canvas.captureStream(30);
        video.srcObject = stream;
        video.volume = volume;
        
        video.onloadedmetadata = () => {
          setVideoLoaded(true);
          setVideoSize({ width: canvas.width, height: canvas.height });
        };
        
        video.play().then(() => {
          setIsPlaying(true);
          setError('');
        });
        
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        setError('Failed to load image file');
        setVideoLoaded(false);
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      setError('Failed to load image file');
    }
  };

  const handleInputSourceChange = async (source: InputSource) => {
    stopDetection();
    setInputSource(source);
    setError('');
    setVideoLoaded(false);
    setIsPlaying(false);
    setTrackingHistory(new Map());

    const video = videoRef.current;
    if (video && video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    
    if (video && video.src && video.src.startsWith('blob:')) {
      URL.revokeObjectURL(video.src);
      video.src = '';
    }

    switch (source) {
      case 'camera':
        await startCameraFeed();
        break;
      case 'video':
        fileInputRef.current?.click();
        break;
      case 'image':
        imageInputRef.current?.click();
        break;
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video || !videoLoaded) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
        setError('');
      }).catch(err => {
        setError(`Failed to play video: ${err.message}`);
      });
    }
  };

  const stopVideo = () => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    try {
      video.currentTime = 0;
    } catch (error) {
      console.warn('Could not reset video time:', error);
    }
    
    setIsPlaying(false);
    stopDetection();
    setTrackingHistory(new Map());
  };

  const startDetection = async () => {
    if (isDetecting || !videoLoaded) return;

    if (!fineTunedYolo8CrowdService.isModelReady()) {
      setError('Detection model not ready');
      return;
    }

    try {
      setIsDetecting(true);
      setDetectionCount(0);
      setError('');
      setTrackingHistory(new Map());

      const runDetection = async () => {
        try {
          if (performanceOptimizer?.isSystemStressed()) {
            return;
          }

          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          if (!video || !canvas || !videoLoaded || video.readyState < 2) return;

          canvas.width = video.videoWidth || videoSize.width;
          canvas.height = video.videoHeight || videoSize.height;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const result = await fineTunedYolo8CrowdService.detectCrowd(
            canvas,
            roi,
            locationId
          );
          
          if (!result || typeof result.count !== 'number') {
            throw new Error('Invalid detection result');
          }

          // Enhanced tracking with person IDs
          const enhancedResult = {
            count: result.count || 0,
            confidence: result.confidence || 0.5,
            modelUsed: 'YOLOv8 People Detection',
            boxes: result.boxes || [],
            scores: result.scores || [],
            personIds: result.personIds || [],
            trackingData: result.trackingData || [],
            timestamp: new Date().toISOString(),
            processingTime: result.processingTime || 0,
            crowdDensity: result.crowdDensity || 'moderate',
            behaviorPatterns: result.behaviorPatterns || [],
            riskAssessment: result.riskAssessment || {
              level: 'medium',
              safetyScore: 50
            },
            flowDirection: result.flowDirection || {
              angle: 0,
              velocity: 0,
              consistency: 0
            }
          };

          // Update tracking history for smooth trails
          if (enhancedResult.trackingData && enhancedResult.trackingData.length > 0) {
            const newHistory = new Map(trackingHistory);
            enhancedResult.trackingData.forEach((track: any) => {
              const personId = track.id || Math.random();
              const history = newHistory.get(personId) || [];
              history.push({
                x: track.centerX,
                y: track.centerY,
                timestamp: Date.now(),
                confidence: track.confidence
              });
              // Keep only last 10 positions for trails
              if (history.length > 10) {
                history.shift();
              }
              newHistory.set(personId, history);
            });
            
            // Clean up old tracks (older than 5 seconds)
            const now = Date.now();
            for (const [id, history] of newHistory.entries()) {
              if (history.length > 0 && now - history[history.length - 1].timestamp > 5000) {
                newHistory.delete(id);
              }
            }
            
            setTrackingHistory(newHistory);
          }

          setDetectionResults(enhancedResult);
          setDetectionCount(prev => prev + 1);
          
          const now = Date.now();
          frameCountRef.current++;
          if (now - lastFpsUpdateRef.current > 1000) {
            setFps(frameCountRef.current);
            frameCountRef.current = 0;
            lastFpsUpdateRef.current = now;
          }

          if (enhancedResult.count >= 0) {
            try {
              await supabaseService.insertCrowdData({
                location_id: locationId,
                timestamp: new Date().toISOString(),
                people_count: enhancedResult.count,
                source: inputSource,
                roi: roi
              });
            } catch (dbError) {
              console.warn('Database save failed:', dbError);
            }
          }

          onDetectionResult({
            locationId,
            count: enhancedResult.count,
            confidence: enhancedResult.confidence,
            timestamp: enhancedResult.timestamp,
            source: inputSource,
            roi: roi,
            ...enhancedResult
          });

          setLastDetectionTime(Date.now());

        } catch (error) {
          console.error('Detection error:', error);
          setError(`Detection failed: ${error.message}`);
        }
      };

      detectionLoopRef.current = setInterval(runDetection, detectionInterval);
      await runDetection();

    } catch (error) {
      setError('Failed to start detection');
      setIsDetecting(false);
    }
  };

  const stopDetection = () => {
    if (detectionLoopRef.current) {
      clearInterval(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    setIsDetecting(false);
    setTrackingHistory(new Map());
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !videoLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || videoSize.width;
    canvas.height = video.videoHeight || videoSize.height;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `frame-${locationId}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const cleanup = () => {
    stopDetection();
    
    const video = videoRef.current;
    if (video) {
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
      
      if (video.src && video.src.startsWith('blob:')) {
        URL.revokeObjectURL(video.src);
        video.src = '';
      }
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className} ${
      isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''
    }`}>
      {/* Compact Header */}
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1.5 rounded-lg">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">YOLOv8 Detection</h3>
              <p className="text-xs text-gray-600">{locationId.replace('-', ' ')} • {fps} FPS</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
            
            <div className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium">
              Ready
            </div>
          </div>
        </div>
      </div>

      {/* Compact Input Source Selection */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-700">Source:</span>
            <div className="flex space-x-1">
              {[
                { id: 'camera', label: 'Camera', icon: Camera, color: 'bg-green-500' },
                { id: 'video', label: 'Video', icon: Upload, color: 'bg-purple-500' },
                { id: 'image', label: 'Image', icon: Upload, color: 'bg-orange-500' },
              ].map(({ id, label, icon: Icon, color }) => (
                <button
                  key={id}
                  onClick={() => handleInputSourceChange(id as InputSource)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all ${
                    inputSource === id
                      ? `${color} text-white shadow-lg`
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={showOverlay}
                onChange={(e) => setShowOverlay(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
              />
              <span className="text-xs text-gray-700">Overlay</span>
            </label>
            
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={showROI}
                onChange={(e) => setShowROI(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
              />
              <span className="text-xs text-gray-700">ROI</span>
            </label>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-2 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span className="text-xs text-red-700">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Video Container */}
      <div 
        ref={containerRef}
        className={`relative bg-black ${isFullscreen ? 'h-screen' : 'aspect-video'}`}
        style={{ minHeight: isFullscreen ? '100vh' : '450px' }}
      >
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-contain bg-black"
            style={{ 
              width: '100%',
              height: '100%',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
            muted={false}
            playsInline
            controls={false}
            onLoadedMetadata={() => {
              const video = videoRef.current;
              if (video) {
                setVideoLoaded(true);
                setVideoSize({ 
                  width: video.videoWidth || 1920, 
                  height: video.videoHeight || 1080 
                });
              }
            }}
            onError={() => {
              setError('Video playback error');
              setVideoLoaded(false);
            }}
            onCanPlay={() => {
              setVideoLoaded(true);
            }}
          />

          {videoLoaded && (
            <DetectionOverlay
              videoElement={videoRef.current}
              detectionResults={detectionResults}
              roi={roi}
              showOverlay={showOverlay}
              showROI={showROI}
              isDetecting={isDetecting}
              detectionCount={detectionCount}
              fps={fps}
              lastDetectionTime={lastDetectionTime}
              detectionInterval={detectionInterval}
              trackingHistory={trackingHistory}
            />
          )}

          <canvas
            ref={canvasRef}
            className="hidden"
            width={videoSize.width}
            height={videoSize.height}
          />

          {/* Enhanced Video Controls */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 40 }}>
            {/* Top Status Bar */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center space-x-1">
                <div className="bg-black bg-opacity-80 text-white px-2 py-1 rounded-lg text-xs">
                  {inputSource.charAt(0).toUpperCase() + inputSource.slice(1)}
                </div>
                {isDetecting && (
                  <div className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs animate-pulse">
                    🔴 Live
                  </div>
                )}
                {detectionResults && (
                  <div className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs">
                    👥 {detectionResults.count}
                  </div>
                )}
              </div>
              
              <div className="bg-black bg-opacity-80 text-white px-2 py-1 rounded-lg text-xs">
                {videoSize.width} × {videoSize.height}
              </div>
            </div>

            {/* Center Play Button */}
            {!isPlaying && videoLoaded && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                <button
                  onClick={togglePlayPause}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-full shadow-2xl transform hover:scale-110 transition-all"
                >
                  <Play className="w-10 h-10" />
                </button>
              </div>
            )}

            {/* No Video State */}
            {!videoLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center pointer-events-auto">
                <div className="text-center text-gray-300">
                  <Video className="w-20 h-20 mx-auto mb-4 opacity-50" />
                  <h3 className="text-2xl font-medium mb-2">Select Input Source</h3>
                  <p className="opacity-75">Choose camera, video, or image for detection</p>
                </div>
              </div>
            )}

            {/* Enhanced Bottom Controls */}
            <div className="absolute bottom-2 left-2 right-2 pointer-events-auto">
              <div className="bg-black bg-opacity-90 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={togglePlayPause}
                      disabled={!videoLoaded}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span className="text-xs">{isPlaying ? 'Pause' : 'Play'}</span>
                    </button>

                    <button
                      onClick={stopVideo}
                      disabled={!videoLoaded}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      <Square className="w-3 h-3" />
                      <span className="text-xs">Stop</span>
                    </button>

                    <button
                      onClick={isDetecting ? stopDetection : startDetection}
                      disabled={!isPlaying || !videoLoaded}
                      className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                        isDetecting
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isDetecting ? <Square className="w-3 h-3" /> : <Target className="w-3 h-3" />}
                      <span className="text-xs">{isDetecting ? 'Stop' : 'Detect'}</span>
                    </button>

                    <button
                      onClick={captureFrame}
                      disabled={!isPlaying || !videoLoaded}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span className="text-xs">Capture</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Volume Control */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setVolume(volume > 0 ? 0 : 0.5)}
                        className="text-white hover:text-gray-300"
                      >
                        {volume > 0 ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={(e) => {
                          const newVolume = parseFloat(e.target.value);
                          setVolume(newVolume);
                          if (videoRef.current) {
                            videoRef.current.volume = newVolume;
                          }
                        }}
                        className="w-16"
                      />
                    </div>

                    {/* Detection Speed */}
                    <div className="flex items-center space-x-1 text-white">
                      <span className="text-xs">Speed:</span>
                      <select
                        value={detectionInterval}
                        onChange={(e) => setDetectionInterval(parseInt(e.target.value))}
                        className="px-1 py-0.5 bg-gray-800 text-white border border-gray-600 rounded text-xs"
                      >
                        <option value={250}>Ultra (0.25s)</option>
                        <option value={500}>Fast (0.5s)</option>
                        <option value={1000}>Normal (1s)</option>
                        <option value={2000}>Slow (2s)</option>
                      </select>
                    </div>
                    
                    {fps > 0 && (
                      <div className="text-white text-xs">
                        {fps} FPS
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Selector */}
      {showROI && videoLoaded && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <ROISelector
            imageElement={videoRef.current}
            roi={roi}
            onROIChange={setROI}
            width={Math.min(videoSize.width / 3, 480)}
            height={Math.min(videoSize.height / 3, 270)}
            showAdvanced={false}
            onCapture={captureFrame}
          />
        </div>
      )}

      {/* Enhanced Detection Results */}
      {detectionResults && (
        <div className="p-3 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Detection Results</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-xs text-blue-600 font-medium">People</div>
              <div className="text-xl font-bold text-blue-900">{detectionResults.count || 0}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-xs text-green-600 font-medium">Confidence</div>
              <div className="text-xl font-bold text-green-900">
                {((detectionResults.confidence || 0) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2">
              <div className="text-xs text-purple-600 font-medium">Speed</div>
              <div className="text-xl font-bold text-purple-900">
                {(detectionResults.processingTime || 0).toFixed(0)}ms
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2">
              <div className="text-xs text-yellow-600 font-medium">Density</div>
              <div className="text-lg font-bold text-yellow-900 capitalize">
                {detectionResults.crowdDensity || 'Medium'}
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-2">
              <div className="text-xs text-orange-600 font-medium">Tracked</div>
              <div className="text-xl font-bold text-orange-900">
                {trackingHistory.size}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            loadVideoFile(file);
          }
          e.target.value = '';
        }}
      />
      
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            loadImageFile(file);
          }
          e.target.value = '';
        }}
      />
    </div>
  );
};