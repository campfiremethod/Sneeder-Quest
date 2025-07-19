// cpu-usage-anim.js
// Script to animate CPU usage in the status bar with realistic Windows 98 patterns

class CPUUsageSimulator {
  constructor() {
    this.currentUsage = 14; // Starting value
    this.targetUsage = 14;
    this.spikeActive = false;
    this.spikeDuration = 0;
    this.idleCounter = 0;
    this.updateInterval = null;
    
    // Get the CPU usage element
    this.cpuElement = document.querySelector('.status-bar-field:nth-child(2)');
    
    if (this.cpuElement) {
      this.startSimulation();
    }
  }
  
  startSimulation() {
    // Update every 800ms to 1200ms (feels authentic to Win98)
    this.scheduleNextUpdate();
  }
  
  scheduleNextUpdate() {
    const delay = 800 + Math.random() * 400; // 800-1200ms
    this.updateInterval = setTimeout(() => {
      this.updateCPUUsage();
      this.scheduleNextUpdate();
    }, delay);
  }
  
  updateCPUUsage() {
    // Handle spike logic
    if (this.spikeActive) {
      this.spikeDuration--;
      if (this.spikeDuration <= 0) {
        this.spikeActive = false;
        this.targetUsage = this.getRandomBaseUsage();
      }
    } else {
      // Random chance for spike (about 15% chance)
      if (Math.random() < 0.15) {
        this.triggerSpike();
      } else {
        // Normal usage fluctuation
        this.targetUsage = this.getRandomBaseUsage();
      }
    }
    
    // Gradually move toward target (simulates system response time)
    const diff = this.targetUsage - this.currentUsage;
    if (Math.abs(diff) > 1) {
      this.currentUsage += Math.sign(diff) * (1 + Math.random() * 2);
    } else {
      this.currentUsage = this.targetUsage;
    }
    
    // Ensure bounds
    this.currentUsage = Math.max(0, Math.min(100, this.currentUsage));
    
    // Update display
    this.cpuElement.textContent = `CPU Usage: ${Math.round(this.currentUsage)}%`;
  }
  
  getRandomBaseUsage() {
    // Weighted random for realistic usage patterns
    const rand = Math.random();
    
    if (rand < 0.4) {
      // 40% chance: Very low usage (2-12%)
      return 2 + Math.random() * 10;
    } else if (rand < 0.8) {
      // 40% chance: Low-moderate usage (8-25%)
      return 8 + Math.random() * 17;
    } else {
      // 20% chance: Moderate usage (20-45%)
      return 20 + Math.random() * 25;
    }
  }
  
  triggerSpike() {
    this.spikeActive = true;
    this.spikeDuration = 2 + Math.floor(Math.random() * 4); // 2-5 updates
    
    const spikeType = Math.random();
    if (spikeType < 0.6) {
      // 60% chance: Moderate spike (60-85%)
      this.targetUsage = 60 + Math.random() * 25;
    } else if (spikeType < 0.9) {
      // 30% chance: High spike (80-95%)
      this.targetUsage = 80 + Math.random() * 15;
    } else {
      // 10% chance: Max spike (95-100%)
      this.targetUsage = 95 + Math.random() * 5;
    }
  }
  
  stop() {
    if (this.updateInterval) {
      clearTimeout(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Initialize the CPU usage simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
  window.cpuSimulator = new CPUUsageSimulator();
});

// Optional: Stop simulation when page is hidden (saves resources)
document.addEventListener('visibilitychange', () => {
  if (window.cpuSimulator) {
    if (document.hidden) {
      window.cpuSimulator.stop();
    } else {
      window.cpuSimulator.startSimulation();
    }
  }
});