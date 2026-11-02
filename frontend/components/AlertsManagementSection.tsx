'use client';

import React, { useState, useMemo } from 'react';
import { SensorReading, AlertThresholds, AlertItem, AlertSeverity } from '../lib/types';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Filter,
  Clock,
  ShieldCheck,
  Check,
  Thermometer,
  Droplets,
  Radio,
} from 'lucide-react';

interface AlertsManagementSectionProps {
  latestReading: SensorReading | null;
  thresholds: AlertThresholds;
  backendConnected: boolean;
  secondsSinceLastReading: number | null;
}

export const AlertsManagementSection: React.FC<AlertsManagementSectionProps> = ({
  latestReading,
  thresholds,
  backendConnected,
  secondsSinceLastReading,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | AlertSeverity>('all');
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Record<string, boolean>>({});

  // Evaluate genuine, strictly calculated alerts based on actual telemetry
  const alerts: AlertItem[] = useMemo(() => {
    const list: AlertItem[] = [];

    // 1. Backend Connectivity Alert
    if (!backendConnected) {
      list.push({
        id: 'conn-err',
        severity: 'critical',
        title: 'Backend API Unreachable',
        message: 'Dashboard cannot communicate with FastAPI backend server or PostgreSQL database.',
        timestamp: new Date().toISOString(),
        metric: 'connection',
        suggestedAction: 'Verify FastAPI server status and check database container on Render/Docker.',
      });
    }

    // 2. Transmitter Offline Alert (> 120s)
    if (secondsSinceLastReading !== null && secondsSinceLastReading > 120) {
      list.push({
        id: 'dev-offline',
        severity: 'critical',
        title: 'ESP32 Transmitter Offline',
        message: `No telemetry packets received for ${Math.round(secondsSinceLastReading)} seconds (>120s limit).`,
        timestamp: latestReading ? latestReading.timestamp : new Date().toISOString(),
        metric: 'connection',
        value: Math.round(secondsSinceLastReading),
        threshold: 120,
        unit: 'seconds',
        suggestedAction: 'Check ESP32 USB power supply and verify 2.4 GHz Wi-Fi hotspot configuration.',
      });
    } else if (secondsSinceLastReading !== null && secondsSinceLastReading > 30) {
      // 3. Stale Signal Warning (> 30s)
      list.push({
        id: 'dev-stale',
        severity: 'warning',
        title: 'Sensor Telemetry Delayed',
        message: `Last packet received ${Math.round(secondsSinceLastReading)}s ago (expected cadence 3s).`,
        timestamp: latestReading ? latestReading.timestamp : new Date().toISOString(),
        metric: 'connection',
        value: Math.round(secondsSinceLastReading),
        threshold: 30,
        unit: 'seconds',
        suggestedAction: 'Check Wi-Fi signal quality between ESP32 and router/hotspot.',
      });
    }

    // 4. Temperature Alerts
    if (latestReading) {
      if (latestReading.temperature_c < thresholds.minTemp) {
        list.push({
          id: 'temp-low',
          severity: 'critical',
          title: 'Brood Hypothermia Risk (Chilled Brood)',
          message: `Brood temperature is ${latestReading.temperature_c.toFixed(1)}°C, below safe threshold of ${thresholds.minTemp}°C. Larvae mortality and developmental defects occur below 32°C.`,
          timestamp: latestReading.timestamp,
          metric: 'temperature',
          value: latestReading.temperature_c,
          threshold: thresholds.minTemp,
          unit: '°C',
          suggestedAction: 'Inspect hive entrance reducer, close upper ventilation gaps, and verify cluster tightness.',
        });
      } else if (latestReading.temperature_c > thresholds.maxTemp) {
        list.push({
          id: 'temp-high',
          severity: 'critical',
          title: 'Brood Hyperthermia Alert (Overheating)',
          message: `Brood temperature is ${latestReading.temperature_c.toFixed(1)}°C, exceeding safe threshold of ${thresholds.maxTemp}°C. Comb structure weakens and melting occurs above 36.5°C.`,
          timestamp: latestReading.timestamp,
          metric: 'temperature',
          value: latestReading.temperature_c,
          threshold: thresholds.maxTemp,
          unit: '°C',
          suggestedAction: 'Ensure screened bottom board is open, provide hive shade, and check water supply nearby.',
        });
      }

      // 5. Humidity Alerts
      if (latestReading.humidity_pct > thresholds.maxHumidity) {
        list.push({
          id: 'hum-high',
          severity: 'warning',
          title: 'Excess Microclimate Moisture / Condensation',
          message: `Relative humidity is ${latestReading.humidity_pct.toFixed(1)}%, exceeding maximum threshold of ${thresholds.maxHumidity}%. High moisture accelerates Ascosphaera apis (chalkbrood).`,
          timestamp: latestReading.timestamp,
          metric: 'humidity',
          value: latestReading.humidity_pct,
          threshold: thresholds.maxHumidity,
          unit: '% RH',
          suggestedAction: 'Increase upper hive ventilation or inspect moisture quilt board.',
        });
      } else if (latestReading.humidity_pct < thresholds.minHumidity) {
        list.push({
          id: 'hum-low',
          severity: 'warning',
          title: 'Low Microclimate Humidity (Egg Desiccation)',
          message: `Relative humidity is ${latestReading.humidity_pct.toFixed(1)}%, below minimum threshold of ${thresholds.minHumidity}%. Larvae hatching success drops below 50% RH.`,
          timestamp: latestReading.timestamp,
          metric: 'humidity',
          value: latestReading.humidity_pct,
          threshold: thresholds.minHumidity,
          unit: '% RH',
          suggestedAction: 'Check apiary water source availability and reduce excessive hive ventilation drafts.',
        });
      }
    }

    // 6. Information Alert: Baseline status
    if (list.length === 0 && latestReading) {
      list.push({
        id: 'all-clear',
        severity: 'info',
        title: 'Microclimate In Optimal Equilibrium',
        message: `All current parameters (${latestReading.temperature_c.toFixed(1)}°C, ${latestReading.humidity_pct.toFixed(1)}% RH) are within configured safe physiological thresholds.`,
        timestamp: latestReading.timestamp,
        metric: 'temperature',
        suggestedAction: 'No intervention required. Brood nest thermal regulation active.',
      });
    }

    return list;
  }, [backendConnected, secondsSinceLastReading, latestReading, thresholds]);

  const filteredAlerts = useMemo(() => {
    if (selectedSeverity === 'all') return alerts;
    return alerts.filter((a) => a.severity === selectedSeverity);
  }, [alerts, selectedSeverity]);

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedAlerts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      
      {/* Alert Header & Filter Controls */}
      <div className="panel-card rounded-lg p-4 bg-industrial-900 border-industrial-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-honey-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">
            Anomaly & Threshold Breach Manager
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-industrial-850 text-industrial-400 border border-industrial-800">
            {alerts.filter((a) => a.severity !== 'info').length} Active Issues
          </span>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center space-x-1 text-xs">
          {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-3 py-1 rounded text-xs font-semibold capitalize font-mono transition-all ${
                selectedSeverity === sev
                  ? sev === 'critical'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : sev === 'warning'
                    ? 'bg-honey-500/20 text-honey-400 border border-honey-500/40'
                    : sev === 'info'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-industrial-850 text-white border border-industrial-700'
                  : 'bg-industrial-850 text-industrial-400 border border-industrial-800 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => {
            const isAck = acknowledgedAlerts[alert.id];
            return (
              <div
                key={alert.id}
                className={`panel-card rounded-lg p-4 transition-all ${
                  alert.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : alert.severity === 'warning'
                    ? 'bg-honey-950/20 border-honey-500/30'
                    : 'bg-emerald-950/20 border-emerald-500/30'
                } ${isAck ? 'opacity-60' : 'opacity-100'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {alert.severity === 'critical' ? (
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-honey-400" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white tracking-tight">
                          {alert.title}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded font-bold ${
                            alert.severity === 'critical'
                              ? 'bg-rose-500/20 text-rose-400'
                              : alert.severity === 'warning'
                              ? 'bg-honey-500/20 text-honey-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        {isAck && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-industrial-800 text-industrial-400">
                            Acknowledged
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-industrial-300 mt-1 leading-relaxed">
                        {alert.message}
                      </p>

                      {alert.suggestedAction && (
                        <div className="mt-2 text-[11px] text-industrial-400 font-mono bg-industrial-950/40 p-2 rounded border border-industrial-800">
                          <strong className="text-honey-400">Remediation Action:</strong> {alert.suggestedAction}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Timestamp & Acknowledge Button */}
                  <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                    <span className="text-[10px] font-mono text-industrial-500">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    {alert.severity !== 'info' && (
                      <button
                        onClick={() => toggleAcknowledge(alert.id)}
                        className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-mono font-medium transition-all ${
                          isAck
                            ? 'bg-industrial-800 text-industrial-400 border border-industrial-700'
                            : 'bg-industrial-850 hover:bg-industrial-800 text-industrial-300 border border-industrial-700'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{isAck ? 'Unacknowledge' : 'Acknowledge'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="panel-card rounded-lg p-8 bg-industrial-900 border-industrial-800 text-center text-industrial-500 text-xs">
            No alerts found matching the selected filter.
          </div>
        )}
      </div>

    </div>
  );
};

