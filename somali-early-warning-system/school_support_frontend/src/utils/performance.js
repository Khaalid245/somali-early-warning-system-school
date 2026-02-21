export const performanceMonitor = {
  marks: {},

  start(label) {
    this.marks[label] = performance.now();
  },

  end(label) {
    if (!this.marks[label]) return;
    
    const duration = performance.now() - this.marks[label];
    delete this.marks[label];
    
    if (duration > 1000) {
      console.warn(`[PERFORMANCE] ${label} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  },

  measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  },

  async measureAsync(label, fn) {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }
};
