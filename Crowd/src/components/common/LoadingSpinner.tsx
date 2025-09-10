import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  text?: string;
  className?: string;
  timeout?: number;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'blue',
  text,
  className = '',
  timeout = 5000, // Reduced timeout
  showProgress = false,
  progress = 0
}) => {
  const [showTimeout, setShowTimeout] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, timeout);
    
    return () => clearTimeout(timer);
  }, [timeout]);
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    purple: 'border-purple-600'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <p className="text-sm text-gray-600">{text}</p>
      )}
      {showProgress && (
        <div className="w-full max-w-xs mx-auto mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Loading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color].replace('border-', 'bg-')}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
      {showTimeout && (
        <div className="text-center">
          <p className="text-xs text-red-600 mb-2">System may be overloaded...</p>
          <button
            onClick={() => {
              // Clear memory before reload
              try {
                if (typeof window !== 'undefined' && window.performanceOptimizer && typeof window.performanceOptimizer.emergencyStop === 'function') {
                  window.performanceOptimizer.emergencyStop();
                }
              } catch (error) {
                console.warn('Emergency stop failed:', error);
              }
              setTimeout(() => window.location.reload(), 500);
            }}
            className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
          >
            Emergency Reload
          </button>
        </div>
      )}
    </div>
  );
};