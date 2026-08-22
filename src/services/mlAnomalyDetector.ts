import { AccessAnomalyAlert, AccessEvent } from '../types';
import { INITIAL_ANOMALIES } from './mockData';

export class MLAnomalyDetector {
  private alerts: AccessAnomalyAlert[] = [...INITIAL_ANOMALIES];

  public getAlerts(): AccessAnomalyAlert[] {
    return this.alerts;
  }

  public analyzeAccessStream(
    hospitalId: string,
    hospitalName: string,
    events: AccessEvent[]
  ): AccessAnomalyAlert | null {
    // 1. Check for repeated emergency triggers for the same patient in recent history
    const emergencyEvents = events.filter(
      e => e.hospitalId === hospitalId && e.accessType === 'emergency'
    );

    if (emergencyEvents.length >= 3) {
      const existingAlert = this.alerts.find(
        a => a.hospitalId === hospitalId && a.abusePattern.includes('Repeated Emergency')
      );

      if (!existingAlert) {
        const newAlert: AccessAnomalyAlert = {
          id: 'alert-' + Math.random().toString(36).substring(2, 9),
          hospitalId,
          hospitalName,
          date: new Date().toISOString().split('T')[0],
          accessCount: emergencyEvents.length,
          rollingAverage: 0.8,
          severity: 'critical',
          abusePattern: 'Repeated Emergency Access Pattern Detected on Patient Record',
          reason: `Hospital triggered emergency unlock ${emergencyEvents.length} times within a short duration. Potential circumvention of standard consent flow.`,
          adminReviewed: false,
          timestamp: new Date().toISOString(),
        };

        this.alerts.unshift(newAlert);
        return newAlert;
      }
    }

    return null;
  }

  public markReviewed(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.adminReviewed = true;
    }
  }
}

export const mlAnomalyDetector = new MLAnomalyDetector();
