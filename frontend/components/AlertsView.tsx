'use client';

import React, { useState, useMemo } from 'react';
import { SensorReading, AlertThresholds, AlertItem, AlertSeverity } from '../lib/types';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Filter,
  Check,
} from 'lucide-react';

interface AlertsViewProps {
  latestReading: SensorReading | null;
  thresholds: AlertThresholds;
  backendConnected: boolean;
  secondsSinceLastReading: number | null;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  latestReading,
  thresholds,
  backendConnected,
  secondsSinceLastReading,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Acknowledged'>('all');
  const [acknowledgedMap, setAcknowledgedMap] = useState<Record<string, boolean>>({});

  // Generate genuine alerts from actual telemetry
  const alerts: AlertItem[] = useMemo(() => {
    const list: AlertItem[] = [];

    // 1. Backend Server Connectivity
    if (!backendConnected) {
      list.push({
        id: 'conn-backend',
        severity: 'critical',
        title: 'Backend API Disconnected',
        description: 'Unable to communicate with the FastAPI server or PostgreSQL database.',
        timestamp: new Date().toISOString(),
        metric: 'connection',
        status: acknowledgedMap['conn-backend'] ? 'Acknowledged' : 'Active',
      });
    }

    // 2. Sensor Signal Staleness / Offline
    if (secondsSinceLastReading !== null && secondsSinceLastReading > 120) {
      list.push({
        id: 'sensor-offline',
        severity: 'critical',
        title: 'Transmitter Offline',
        description: `No telemetry packets received for ${Math.round(secondsSinceLastReading)} seconds. Check ESP32 power and Wi-Fi hotspot.`,
        timestamp: latestReading?.timestamp || new Date().toISOString(),
        metric: 'connection',
        value: Math.round(secondsSinceLastReading),
        threshold: 120,
        unit: 'seconds',
        status: acknowledgedMap['sensor-offline'] ? 'Acknowledged' : 'Active',
      });
    } else if (secondsSinceLastReading !== null && secondsSinceLastReading > 30) {
      list.push({
        id: 'sensor-stale',
        severity: 'warning',
        title: 'Telemetry Delayed',
        description: `Sensor signal delay of ${Math.round(secondsSinceLastReading)} seconds exceeds normal 3s transmission interval.`,
        timestamp: latestReading?.timestamp || new Date().toISOString(),
        metric: 'connection',
        value: Math.round(secondsSinceLastReading),
        threshold: 30,
        unit: 'seconds',
        status: acknowledgedMap['sensor-stale'] ? 'Acknowledged' : 'Active',
      });
    }

    // 3. Temperature Threshold Alerts
    if (latestReading) {
      if (latestReading.temperature_c < thresholds.minTemp) {
        list.push({
          id: 'temp-low',
          severity: 'critical',
          title: 'Low Brood Temperature',
          description: `Temperature is ${latestReading.temperature_c.toFixed(1)}°C, below configured safe minimum of ${thresholds.minTemp}°C. Risk of chilled brood.`,
          timestamp: latestReading.timestamp,
          metric: 'temperature',
          value: latestReading.temperature_c,
          threshold: thresholds.minTemp,
          unit: '°C',
          status: acknowledgedMap['temp-low'] ? 'Acknowledged' : 'Active',
        });
      } else if (latestReading.temperature_c > thresholds.maxTemp) {
        list.push({
          id: 'temp-high',
          severity: 'critical',
          title: 'High Brood Temperature',
          description: `Temperature is ${latestReading.temperature_c.toFixed(1)}°C, exceeding safe maximum of ${thresholds.maxTemp}°C. Hive ventilation recommended.`,
          timestamp: latestReading.timestamp,
          metric: 'temperature',
          value: latestReading.temperature_c,
          threshold: thresholds.maxTemp,
          unit: '°C',
          status: acknowledgedMap['temp-high'] ? 'Acknowledged' : 'Active',
        });
      }

      // 4. Humidity Threshold Alerts
      if (latestReading.humidity_pct > thresholds.maxHumidity) {
        list.push({
          id: 'hum-high',
          severity: 'warning',
          title: 'High Relative Humidity',
          description: `Humidity is ${latestReading.humidity_pct.toFixed(1)}%, exceeding threshold of ${thresholds.maxHumidity}%. Check for moisture condensation.`,
          timestamp: latestReading.timestamp,
          metric: 'humidity',
          value: latestReading.humidity_pct,
          threshold: thresholds.maxHumidity,
          unit: '% RH',
          status: acknowledgedMap['hum-high'] ? 'Acknowledged' : 'Active',
        });
      } else if (latestReading.humidity_pct < thresholds.minHumidity) {
        list.push({
          id: 'hum-low',
          severity: 'warning',
          title: 'Low Relative Humidity',
          description: `Humidity is ${latestReading.humidity_pct.toFixed(1)}%, below threshold of ${thresholds.minHumidity}%. Verify apiary water availability.`,
          timestamp: latestReading.timestamp,
          metric: 'humidity',
          value: latestReading.humidity_pct,
          threshold: thresholds.minHumidity,
          unit: '% RH',
          status: acknowledgedMap['hum-low'] ? 'Acknowledged' : 'Active',
        });
      }
    }

    // 5. Informational Alert if all nominal
    if (list.length === 0 && latestReading) {
      list.push({
        id: 'system-nominal',
        severity: 'info',
        title: 'Nominal Operating Conditions',
        description: `Microclimate readings (${latestReading.temperature_c.toFixed(1)}°C, ${latestReading.humidity_pct.toFixed(1)}% RH) are within configured safe bounds.`,
        timestamp: latestReading.timestamp,
        metric: 'temperature',
        status: 'Active',
      });
    }

    return list;
  }, [backendConnected, secondsSinceLastReading, latestReading, thresholds, acknowledgedMap]);

  // Filtered list
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSeverity && matchesStatus;
    });
  }, [alerts, severityFilter, statusFilter]);

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      
      {/* Filters Strip */}
      <div className="agri-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Severity Filters */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-ink-primary">Severity:</span>
          <div className="flex items-center space-x-1 bg-canvas p-1 rounded-lg border border-border-light text-xs">
            {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  severityFilter === sev
                    ? 'bg-surface text-ink-primary shadow-xs font-semibold'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-ink-primary">Status:</span>
          <div className="flex items-center space-x-1 bg-canvas p-1 rounded-lg border border-border-light text-xs">
            {(['all', 'Active', 'Acknowledged'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-surface text-ink-primary shadow-xs font-semibold'
                    : 'text-ink-muted hover:text-ink-primary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Clean Alert Table */}
      <div className="agri-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-canvas border-b border-border-light text-ink-muted font-medium">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Alert Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Recorded Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredAlerts.length > 0 ? (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={`hover:bg-canvas/40 transition-colors ${
                      alert.status === 'Acknowledged' ? 'opacity-60' : 'opacity-100'
                    }`}
                  >
                    {/* Severity Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                          alert.severity === 'critical'
                            ? 'bg-status-critical/10 border-status-critical/20 text-status-critical'
                            : alert.severity === 'warning'
                            ? 'bg-status-warning/10 border-status-warning/20 text-status-warning'
                            : 'bg-primary-50 border-primary-200 text-primary-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            alert.severity === 'critical'
                              ? 'bg-status-critical'
                              : alert.severity === 'warning'
                              ? 'bg-status-warning'
                              : 'bg-primary-500'
                          }`}
                        />
                        <span className="capitalize">{alert.severity}</span>
                      </span>
                    </td>

                    {/* Alert Name */}
                    <td className="py-3.5 px-4 font-semibold text-ink-primary whitespace-nowrap">
                      {alert.title}
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-ink-secondary max-w-md">
                      {alert.description}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-ink-muted whitespace-nowrap">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-ink-secondary font-medium">
                        {alert.status}
                      </span>
                    </td>

                    {/* Acknowledge Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {alert.severity !== 'info' ? (
                        <button
                          onClick={() => toggleAcknowledge(alert.id)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-border-light hover:border-border-hover text-ink-secondary hover:text-ink-primary bg-surface transition-colors"
                        >
                          {alert.status === 'Acknowledged' ? 'Reset' : 'Acknowledge'}
                        </button>
                      ) : (
                        <span className="text-ink-muted text-[11px]">Nominal</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-ink-muted">
                    No alerts matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

