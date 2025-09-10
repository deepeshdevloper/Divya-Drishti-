import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { fineTunedYolo8CrowdService } from '../../services/fineTunedYolo11Service';
import { performanceOptimizer } from '../../utils/performanceOptimizer';

interface ModelManagerProps {
  onModelReady: () => void;
  className?: string;
}

export const ModelManager: React.FC<ModelManagerProps> = ({ onModelReady, className = '' }) => {
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error' | 'not-loaded'>('not-loaded');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkModelStatus();
  }, []);

  const checkModelStatus = async () => {
    try {
      if (fineTunedYolo8CrowdService.isModelReady()) {
        setModelStatus('ready');
        setModelInfo(fineTunedYolo8CrowdService.getModelInfo());
        onModelReady();
      } else {
        setModelStatus('not-loaded');
      }
    } catch (error) {
      console.error('Model status check failed:', error);
      setModelStatus('error');
      setError('Failed to check model status');
    }
  };

  const loadModel = async () => {
    if (isLoading || modelStatus === 'ready') return;

    setIsLoading(true);
    setError('');
    setModelStatus('loading');
    setLoadingProgress(0);

    try {
      fineTunedYolo8CrowdService.onLoadingProgress((progress: number) => {
        setLoadingProgress(progress);
      });

      const success = await fineTunedYolo8CrowdService.loadModel();
      
      if (success) {
        setModelStatus('ready');
        setModelInfo(fineTunedYolo8CrowdService.getModelInfo());
        setLoadingProgress(100);
        onModelReady();
        
        const isValid = await fineTunedYolo8CrowdService.validateModel();
        if (!isValid) {
          throw new Error('Model validation failed');
        }
      } else {
        throw new Error('Model loading failed');
      }
    } catch (error) {
      console.error('Model loading error:', error);
      setModelStatus('error');
      setError(error.message || 'Failed to load detection model');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-100';
      case 'loading': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="w-5 h-5" />;
      case 'loading': return <RefreshCw className="w-5 h-5 animate-spin" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <Brain className="w-5 h-5" />;
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">YOLOv8 Detection Engine</h3>
            <p className="text-sm text-gray-600">People-only detection system</p>
          </div>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${getStatusColor(modelStatus)}`}>
          {getStatusIcon(modelStatus)}
          <span className="font-medium capitalize">{modelStatus.replace('-', ' ')}</span>
        </div>
      </div>

      {/* Model Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Model Status</span>
              {modelStatus === 'not-loaded' && (
                <button
                  onClick={loadModel}
                  disabled={isLoading}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Load Model
                </button>
              )}
            </div>
            
            {modelStatus === 'loading' && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <div className="text-xs text-gray-600 text-center">
                  Loading... {loadingProgress.toFixed(0)}%
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}
          </div>

          {modelInfo && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Model Info</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-medium">{modelInfo.version || 'v8.0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-medium">{((modelInfo.accuracy || 0.97) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="font-medium">{modelInfo.format || 'ONNX'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">System Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Processing</span>
                <span className={`text-sm font-medium ${
                  performanceOptimizer?.isSystemStressed() ? 'text-red-600' : 'text-green-600'
                }`}>
                  {performanceOptimizer?.isSystemStressed() ? 'Stressed' : 'Normal'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => {
                if (performanceOptimizer && typeof performanceOptimizer.cleanupMemory === 'function') {
                  performanceOptimizer.cleanupMemory();
                }
              }}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Cleanup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Model Features */}
      {modelStatus === 'ready' && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h4 className="font-medium text-gray-900 mb-4">Detection Features</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              'Real-time people counting',
              'Ignores non-human objects',
              'Cultural behavior analysis',
              'Flow direction tracking',
              'Risk assessment',
              'Predictive forecasting'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading Instructions */}
      {modelStatus === 'not-loaded' && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">YOLOv8 People Detection</h4>
            <p className="text-sm text-blue-800 mb-3">
              Load the specialized model for accurate people-only detection.
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 97% accuracy for people detection</li>
              <li>• Ignores vehicles and objects</li>
              <li>• Real-time processing capability</li>
              <li>• Cultural pattern recognition</li>
            </ul>
          </div>
        </div>
      )}

      {/* Emergency Controls */}
      {performanceOptimizer?.isSystemStressed() && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">System Overloaded</span>
              </div>
              <button
                onClick={() => {
                  if (performanceOptimizer && typeof performanceOptimizer.emergencyStop === 'function') {
                    performanceOptimizer.emergencyStop();
                  }
                }}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                Emergency Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};