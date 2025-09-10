import { Zone, Alert, CrowdData } from '../types';

export class DemoDataGenerator {
  private intervalId: NodeJS.Timeout | null = null;

  // Generate realistic crowd data based on time patterns
  generateCrowdData(zones: Zone[]): CrowdData[] {
    const now = new Date();
    const hour = now.getHours();
    
    return zones.map(zone => {
      // Time-based multipliers for Simhastha patterns
      let multiplier = 1;
      if (hour >= 4 && hour <= 8) multiplier = 2.5; // Early morning bathing
      else if (hour >= 17 && hour <= 21) multiplier = 2.8; // Evening aarti
      else if (hour >= 22 || hour <= 3) multiplier = 0.2; // Night
      else if (hour >= 9 && hour <= 16) multiplier = 1.5; // Day time

      // Zone-specific patterns
      const zoneMultiplier = {
        'mahakal-ghat': 1.3,
        'ram-ghat': 1.2,
        'bhairav-ghat': 1.1,
        'narsingh-ghat': 0.9,
        'kshipra-ghat': 0.8
      }[zone.id] || 1.0;

      const baseCount = Math.floor(zone.capacity * 0.4);
      const count = Math.floor(baseCount * multiplier * zoneMultiplier * (0.8 + Math.random() * 0.4));

      return {
        id: `demo-${zone.id}-${Date.now()}`,
        location_id: zone.id,
        timestamp: now.toISOString(),
        people_count: Math.max(0, count),
        source: 'demo' as const,
        roi: [0.1, 0.1, 0.9, 0.9],
        created_at: now.toISOString()
      };
    });
  }

  // Generate alerts based on crowd levels
  generateAlerts(zones: Zone[]): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date();

    zones.forEach(zone => {
      const occupancy = (zone.current_count / zone.capacity) * 100;
      
      if (occupancy > 90 && Math.random() < 0.3) {
        alerts.push({
          id: `alert-critical-${zone.id}-${Date.now()}`,
          type: 'critical',
          message: `CRITICAL: ${zone.name} has exceeded safe capacity (${zone.current_count}/${zone.capacity}) - immediate evacuation recommended`,
          location_id: zone.id,
          timestamp: now.toISOString(),
          acknowledged: false
        });
      } else if (occupancy > 70 && Math.random() < 0.2) {
        alerts.push({
          id: `alert-warning-${zone.id}-${Date.now()}`,
          type: 'warning',
          message: `WARNING: ${zone.name} approaching high capacity (${zone.current_count}/${zone.capacity}) - monitor closely`,
          location_id: zone.id,
          timestamp: now.toISOString(),
          acknowledged: false
        });
      }
    });

    return alerts;
  }

  // Start automatic demo data generation
  startDemoMode(
    zones: Zone[],
    onCrowdDataUpdate: (data: CrowdData[]) => void,
    onAlertUpdate: (alerts: Alert[]) => void,
    interval = 5000
  ) {
    this.intervalId = setInterval(() => {
      const crowdData = this.generateCrowdData(zones);
      const alerts = this.generateAlerts(zones);
      
      onCrowdDataUpdate(crowdData);
      if (alerts.length > 0) {
        onAlertUpdate(alerts);
      }
    }, interval);
  }

  // Stop demo mode
  stopDemoMode() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Generate evacuation recommendations
  generateEvacuationRecommendations(zones: Zone[]) {
    const criticalZones = zones.filter(z => z.status === 'critical');
    const safeZones = zones.filter(z => z.status === 'safe');
    
    return criticalZones.map(criticalZone => {
      const nearestSafe = safeZones[Math.floor(Math.random() * safeZones.length)];
      if (!nearestSafe) return null;
      
      return {
        fromZone: criticalZone.id,
        toZone: nearestSafe.id,
        distance: Math.floor(Math.random() * 500) + 100,
        estimatedTime: Math.floor(Math.random() * 10) + 5,
        priority: 'high' as const,
        message: `Evacuate from ${criticalZone.name} to ${nearestSafe.name}`,
        peopleCount: criticalZone.current_count - criticalZone.capacity
      };
    }).filter(Boolean);
  }
}

export const demoDataGenerator = new DemoDataGenerator();