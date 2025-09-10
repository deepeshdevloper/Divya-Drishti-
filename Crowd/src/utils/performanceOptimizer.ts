// Performance optimization utilities for Divya Drishti (दिव्य  दृष्टि) system - Optimized Version

declare global {
    interface Window {
        performanceOptimizer?: PerformanceOptimizer;
    }
}

export class PerformanceOptimizer {
    private static instance: PerformanceOptimizer;
    private taskQueue: Array<() => Promise<void>> = [];
    private isProcessing = false;
    private memoryThreshold = 100 * 1024 * 1024; // 100MB - increased for real model
    private performanceMetrics = {
        taskCount: 0,
        avgExecutionTime: 0,
        memoryUsage: 0,
        lastCleanup: Date.now(),
        isBlocked: false
    };
    private emergencyMode = false;
    private cleanupInProgress = false;
    private lastMemoryCheck = 0;
    private memoryCheckInterval = 60000; // Check memory every 60 seconds
    private maxTasksPerFrame = 2; // Increased for better performance

    static getInstance(): PerformanceOptimizer {
        if (!PerformanceOptimizer.instance) {
            PerformanceOptimizer.instance = new PerformanceOptimizer();
            if (typeof window !== 'undefined') {
                window.performanceOptimizer = PerformanceOptimizer.instance;
            }
        }
        return PerformanceOptimizer.instance;
    }

    queueTask(task: () => Promise<void>): void {
        if (!task || typeof task !== 'function') {
            console.warn('Invalid task provided to queueTask');
            return;
        }

        if (this.performanceMetrics.isBlocked || this.emergencyMode) {
            console.warn('Task rejected - system is blocked or in emergency mode');
            return;
        }

        // Less aggressive queue management for real model
        if (this.taskQueue.length > 5) {
            this.taskQueue = [];
            console.warn('Task queue overflow, dropping old tasks');
        }

        this.taskQueue.push(task);
        
        // Use setTimeout with shorter delay for real-time performance
        setTimeout(() => this.processQueue(), 50);
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.taskQueue.length === 0) return;

        this.isProcessing = true;
        const startTime = performance.now();
        const maxProcessTime = 16; // Increased to 16ms for real model

        // Process up to 2 tasks for better performance
        const tasksToProcess = Math.min(this.maxTasksPerFrame, this.taskQueue.length);
        
        for (let i = 0; i < tasksToProcess; i++) {
            const task = this.taskQueue.shift();
            if (task) {
                try {
                    const taskStart = performance.now();
                    await task();
                    const taskEnd = performance.now();

                    this.performanceMetrics.taskCount++;
                    this.performanceMetrics.avgExecutionTime =
                        (this.performanceMetrics.avgExecutionTime + (taskEnd - taskStart)) / 2;

                    // Yield control after task
                    await this.yieldToMain();

                    // Check memory usage periodically
                    if (this.performanceMetrics.taskCount % 10 === 0) {
                        await this.checkMemoryUsage();
                    }
                } catch (error) {
                    console.error('Task execution error:', error);
                }
            }
        }

        this.isProcessing = false;
    }

    private yieldToMain(): Promise<void> {
        return new Promise(resolve => {
            if ('requestIdleCallback' in window) {
                (window as any).requestIdleCallback(resolve, { timeout: 16 });
            } else {
                setTimeout(resolve, 0);
            }
        });
    }

    private async checkMemoryUsage(): Promise<void> {
        const now = Date.now();
        if (now - this.lastMemoryCheck < this.memoryCheckInterval) {
            return;
        }
        this.lastMemoryCheck = now;

        if (this.cleanupInProgress) return;

        if ('memory' in performance) {
            const memInfo = (performance as any).memory;
            this.performanceMetrics.memoryUsage = memInfo.usedJSHeapSize;

            // More conservative memory management
            if (memInfo.usedJSHeapSize > this.memoryThreshold) {
                await this.emergencyCleanup();
            }

            // Emergency mode if memory is extremely high
            if (memInfo.usedJSHeapSize > this.memoryThreshold * 2) {
                this.emergencyMode = true;
                await this.emergencyCleanup();

                setTimeout(() => {
                    this.emergencyMode = false;
                }, 15000); // Longer recovery time for real model
            }
        }
    }

    private async emergencyCleanup(): Promise<void> {
        if (this.cleanupInProgress) return;
        this.cleanupInProgress = true;

        try {
            this.performanceMetrics.isBlocked = true;
            this.taskQueue = [];
            this.isProcessing = false;

            // Force garbage collection if available
            if ('gc' in window) {
                (window as any).gc();
            }

            // TensorFlow.js specific cleanup
            await this.cleanupTensorFlow();

            // Clear caches
            this.clearUnusedCaches();

            this.performanceMetrics.lastCleanup = Date.now();

            console.log('Emergency cleanup completed');
        } catch (error) {
            console.error('Emergency cleanup failed:', error);
        } finally {
            setTimeout(() => {
                this.performanceMetrics.isBlocked = false;
            }, 2000); // Shorter block time for real-time performance
            this.cleanupInProgress = false;
        }
    }

    private async cleanupTensorFlow(): Promise<void> {
        try {
            if (typeof window !== 'undefined' && (window as any).tf) {
                const tf = (window as any).tf;

                if (tf.disposeVariables) {
                    tf.disposeVariables();
                }

                if (tf.tidy) {
                    tf.tidy(() => {
                        // Empty tidy block to force cleanup
                    });
                }
            }
        } catch (error) {
            console.warn('TensorFlow.js cleanup failed:', error);
        }
    }

    debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number = 1000 // Default 1 second
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout;
        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), Math.max(wait, 500)); // Reduced for real-time
        };
    }

    throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number = 1000 // Default 1 second
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean;
        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => { inThrottle = false; }, Math.max(limit, 1000)); // Reduced for real-time
            }
        };
    }

    async processInChunks<T>(
        array: T[],
        chunkSize: number,
        processor: (chunk: T[]) => Promise<void>
    ): Promise<void> {
        const safeChunkSize = Math.min(chunkSize, 5); // Increased for better performance

        for (let i = 0; i < array.length; i += safeChunkSize) {
            const chunk = array.slice(i, i + safeChunkSize);
            await processor(chunk);
            await this.yieldToMain();

            if (this.performanceMetrics.memoryUsage > this.memoryThreshold) {
                console.warn('Pausing chunk processing due to high memory usage');
                await this.checkMemoryUsage();
                await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced wait time
            }
        }
    }

    cleanupMemory(): void {
        if ('gc' in window) {
            (window as any).gc();
        }

        this.clearUnusedCaches();

        if (this.taskQueue.length > 0) {
            this.taskQueue = [];
        }

        if (Date.now() - this.performanceMetrics.lastCleanup > 10 * 60 * 1000) {
            this.performanceMetrics = {
                taskCount: 0,
                avgExecutionTime: 0,
                memoryUsage: 0,
                lastCleanup: Date.now(),
                isBlocked: false
            };
        }
    }

    private clearUnusedCaches(): void {
        try {
            const keys = Object.keys(localStorage);
            let removedCount = 0;

            keys.forEach(key => {
                if (key.startsWith('temp_') || key.startsWith('cache_') || key.startsWith('model_')) {
                    const item = localStorage.getItem(key);
                    if (item) {
                        try {
                            const data = JSON.parse(item);
                            if (data.timestamp && Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
                                localStorage.removeItem(key);
                                removedCount++;
                            }
                        } catch {
                            localStorage.removeItem(key);
                            removedCount++;
                        }
                    }
                }
            });

            if (removedCount > 0) {
                console.log(`Cleaned up ${removedCount} cached items`);
            }
        } catch (error) {
            console.error('Cache cleanup error:', error);
        }
    }

    getMetrics() {
        return {
            ...this.performanceMetrics,
            queueLength: this.taskQueue.length,
            isProcessing: this.isProcessing
        };
    }

    isSystemStressed(): boolean {
        try {
            return (
                this.emergencyMode ||
                this.performanceMetrics.isBlocked ||
                this.taskQueue.length > 3 || // Increased threshold
                this.performanceMetrics.avgExecutionTime > 200 || // Increased threshold
                this.performanceMetrics.memoryUsage > this.memoryThreshold
            );
        } catch (error) {
            return false;
        }
    }

    emergencyStop(): void {
        try {
            console.warn('Emergency stop triggered');
            this.emergencyMode = true;
            this.taskQueue = [];
            this.isProcessing = false;
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('emergency-stop'));
            }
            this.emergencyCleanup();
        } catch (error) {
            console.error('Emergency stop failed:', error);
        }
    }

    isEmergencyMode(): boolean {
        try {
            return this.emergencyMode;
        } catch (error) {
            return false;
        }
    }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();

export const createFallbackOptimizer = () => ({
  isSystemStressed: () => false,
  cleanupMemory: () => {},
  emergencyStop: () => {},
  isEmergencyMode: () => false,
  queueTask: (task: () => Promise<void>) => {
    try {
      task();
    } catch (e) {
      console.warn('Task failed:', e);
    }
  },
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => func,
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => func,
  getMetrics: () => ({})
});

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Don't prevent default for real model errors
    // event.preventDefault();

    if (event.reason?.message?.includes('memory') ||
        event.reason?.message?.includes('heap')) {
        console.warn('Memory error detected, cleaning up...');
        performanceOptimizer.cleanupMemory();
    }
});

window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);

    if (event.error?.message?.includes('memory') ||
        event.error?.message?.includes('heap')) {
        console.warn('Memory error detected, cleaning up...');
        performanceOptimizer.cleanupMemory();
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        performanceOptimizer.cleanupMemory();
        window.dispatchEvent(new CustomEvent('page-hidden'));
    } else {
        window.dispatchEvent(new CustomEvent('page-visible'));
    }
});

window.addEventListener('beforeunload', () => {
    performanceOptimizer.emergencyStop();
});