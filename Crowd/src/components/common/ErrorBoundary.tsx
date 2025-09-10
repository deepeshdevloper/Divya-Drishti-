import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Store error info for debugging
    this.setState({ errorInfo });
    
    // Enhanced error handling with emergency cleanup
    console.error('Application error caught by boundary:', error);
    
    // Trigger emergency cleanup on critical errors
    if (error.message?.includes('memory') || 
        error.message?.includes('heap') ||
        error.message?.includes('out of memory') ||
        error.message?.includes('Maximum call stack')) {
      console.warn('Critical error detected, triggering emergency cleanup');
      if (typeof window !== 'undefined' && window.performanceOptimizer && typeof window.performanceOptimizer.emergencyStop === 'function') {
        window.performanceOptimizer.emergencyStop();
      }
    }
    
    // Report error to monitoring service (if available)
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: true
      });
    }
  }

  private handleReset = () => {
    // Clean up before reset
    try {
      // Safe performance optimizer access
      if (typeof window !== 'undefined' && window.performanceOptimizer && typeof window.performanceOptimizer.cleanupMemory === 'function') {
        window.performanceOptimizer.cleanupMemory();
      }
    } catch (error) {
      console.warn('Cleanup failed during reset:', error);
    }
    
    this.setState(prevState => ({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
    
    // Delayed reload to allow cleanup
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };
  
  private handleReload = () => {
    // Clear all caches before reload
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any remaining intervals/timeouts
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
        clearInterval(i);
      }
    } catch (error) {
      console.warn('Failed to clear storage:', error);
    }
    
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isMemoryError = this.state.error?.message?.includes('memory') || 
                           this.state.error?.message?.includes('heap');
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {isMemoryError ? 'System Overload' : 'Application Error'}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {isMemoryError ? 
                'The application ran out of memory. The system has been reset to recover.' :
                'The Divya Drishti (दिव्य  दृष्टि) monitoring system encountered an unexpected error.'
              }
            </p>
            
            {this.state.error && (
              <div className="bg-gray-50 rounded-lg p-3 mb-6 text-left">
                <p className="text-sm text-gray-700 font-mono">
                  {this.state.error.message}
                </p>
                {this.state.retryCount > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Retry attempts: {this.state.retryCount}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              {this.state.retryCount < 2 && (
                <button
                  onClick={this.handleReset}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Cache & Reload
              </button>
              
              {isMemoryError && (
                <div className="text-xs text-gray-500 mt-4">
                  <p>💡 Tips to prevent memory errors:</p>
                  <ul className="text-left mt-2 space-y-1">
                    <li>• Close other browser tabs</li>
                    <li>• Avoid heavy operations</li>
                    <li>• Refresh the page periodically</li>
                    <li>• Use a more powerful device</li>
                  </ul>
                </div>
              )}
              
              {this.state.retryCount >= 2 && (
                <div className="text-xs text-red-600 mt-4">
                  <p>Multiple retry attempts failed. Please reload the page or contact support.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}