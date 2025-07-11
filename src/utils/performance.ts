// Simple performance monitoring utility
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(operation: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, []);
      }
      this.metrics.get(operation)!.push(duration);
      
      // Log performance data in development
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(`⏱️ ${operation}: ${duration.toFixed(2)}ms`);
      }
    };
  }

  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation) || [];
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMetrics(): Record<string, { count: number; average: number; total: number }> {
    const result: Record<string, { count: number; average: number; total: number }> = {};
    
    this.metrics.forEach((times, operation) => {
      result[operation] = {
        count: times.length,
        average: this.getAverageTime(operation),
        total: times.reduce((sum, time) => sum + time, 0)
      };
    });
    
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Simple performance tracking hook
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance();
  
  const trackRender = () => {
    const endTimer = monitor.startTimer(`${componentName}_render`);
    return endTimer;
  };

  const trackOperation = (operationName: string) => {
    return monitor.startTimer(`${componentName}_${operationName}`);
  };

  return { trackRender, trackOperation };
}; 