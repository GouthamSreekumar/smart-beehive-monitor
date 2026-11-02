'use client';

import React, { useState, useMemo } from 'react';
import { SensorReading, AlertThresholds, AlertItem, AlertSeverity } from '../lib/types';
import {
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Check,
  Filter,
} from 'lucide-react';

interface AlertsLogViewProps {
  latestReading: SensorReading | null;
  thresholds: AlertThresholds;
  backendConnected: boolean;
  nodeConnected: boolean;
  secondsSinceLastReading: number | null;
}

export const AlertsLogView: React.FC<AlertsLogViewProps> = ({
  latestReading,
  thresholds,
  backendConnected,
  nodeConnected,
  secondsSinceLastReading,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | AlertSeverity>('all');
  const [acknowledgedMap, setAcknowledgedMap] = useState<Record<string, boolean>>({});

  const alerts: AlertItem[] = useMemo(() => {
    const list: AlertItem[] = [];

    if (!backendConnected) {
      list.push({
        id: 'api-offline',
        severity: 'critical',
        title: 'Backend API Unreachable',
        description: 'Dashboard cannot communicate with FastAPI backend server or PostgreSQL database.',
        timestamp: new Date().toISOString(),
        metric: 'connection',
        status: acknowledgedMap['api-offline'] ? 'Acknowledged' : 'Active',
      });
    }

    if (!nodeConnected && secondsSinceLastReading !== null && secondsSinceLastReading > 120) {
      list.push({
        id: 'node-offline',
        severity: 'critical',
        title: 'Transmitter Offline (Packet Age Exceeded)',
        description: `ESP32 node has been idle for ${Math.round(secondsSinceLastReading)} seconds (>120s limit). Check USB power and 2.4 GHz Wi-Fi.`,
        timestamp: latestReading?.timestamp || new Date().toISOString(),
        metric: 'connection',
        value: Math.round(secondsSinceLastReading),
        threshold: 120,
        unit: 'seconds',
        status: acknowledgedMap['node-offline'] ? 'Acknowledged' : 'Active',
      });
    }

    if (latestReading) {
      if (latestReading.temperature_c < thresholds.minTemp) {
        list.push({
          id: 'temp-low',
          severity: 'critical',
          title: 'Brood Hypothermia (Chilled Brood)',
          description: `Temperature is ${latestReading.temperature_c.toFixed(1)}°C, below safe incubation floor (${thresholds.minTemp}°C). High larvae mortality risk.`,
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
          title: 'Brood Hyperthermia (Overheating)',
          description: `Temperature is ${latestReading.temperature_c.toFixed(1)}°C, above safe ceiling (${thresholds.maxTemp}°C). Comb softening and fanning risk.`,
          timestamp: latestReading.timestamp,
          metric: 'temperature',
          value: latestReading.temperature_c,
          threshold: thresholds.maxTemp,
          unit: '°C',
          status: acknowledgedMap['temp-high'] ? 'Acknowledged' : 'Active',
        });
      }

      if (latestReading.humidity_pct > thresholds.maxHumidity) {
        list.push({
          id: 'hum-high',
          severity: 'warning',
          title: 'Excess Relative Moisture (Condensation)',
          description: `Humidity is ${latestReading.humidity_pct.toFixed(1)}% (exceeds ${thresholds.maxHumidity}% ceiling). Check upper hive ventilation for chalkbrood prevention.`,
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
          title: 'Low Relative Moisture (Desiccation)',
          description: `Humidity is ${latestReading.humidity_pct.toFixed(1)}% (below ${thresholds.minHumidity}%). Verify apiary water availability.`,
          timestamp: latestReading.timestamp,
          metric: 'humidity',
          value: latestReading.humidity_pct,
          threshold: thresholds.minHumidity,
          unit: '% RH',
          status: acknowledgedMap['hum-low'] ? 'Acknowledged' : 'Active',
        });
      }
    }

    return list;
  }, [backendConnected, nodeConnected, secondsSinceLastReading, latestReading, thresholds, acknowledgedMap]);

  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'all') return alerts;
    return alerts.filter((a) => a.severity === severityFilter);
  }, [alerts, severityFilter]);

  const toggleAcknowledge = (id: string) => {
    setAcknowledgedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 animate-stage-enter">
      
      {/* Header and Filter */}
      <div className="studio-stage p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#18261C]">
            Apicultural Anomaly & Threshold Log
          </h2>
          <p className="text-xs text-[#6E7F72]">
            Biological boundaries and hardware connectivity audit
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-[#F6F8F5] p-1 rounded-lg border border-[#DFE5DC] text-xs">
          {(['all', 'critical', 'warning'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-md text-xs font-semibold capitalize transition-all ${
                severityFilter === sev ? 'bg-white text-[#18261C] shadow-xs' : 'text-[#6E7F72] hover:text-[#18261C]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed or All Clear */}
      {alerts.length === 0 ? (
        <div className="studio-stage p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#EDF5EF] flex items-center justify-center text-[#2D5A3C]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#18261C]">
            All Brood Nest Parameters Nominal
          </h3>
          <p className="text-xs text-[#6E7F72] max-w-md">
            No active anomalies detected. Microclimate parameters strictly conform to safe physiological thresholds.
          </p>
        </div>
      ) : (
        <div className="studio-stage overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#F6F8F5] border-b border-[#DFE5DC] text-[#6E7F72] font-semibold">
                  <th className="py-3.5 px-5">Severity</th>
                  <th className="py-3.5 px-5">Event</th>
                  <th className="py-3.5 px-5">Biological Description</th>
                  <th className="py-3.5 px-5">Recorded</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE5DC]/60">
                {filteredAlerts.map((a) => (
                  <tr key={a.id} className={`hover:bg-[#F6F8F5]/60 transition-colors ${a.status === 'Acknowledged' ? 'opacity-60' : ''}`}>
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        a.severity === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${a.severity === 'critical' ? 'bg-rose-600' : 'bg-amber-600'}`} />
                        <span className="capitalize">{a.severity}</span>
                      </span>
                    </td>
                    <td className="py-4 px-5 font-bold text-[#18261C] whitespace-nowrap">
                      {a.title}
                    </td>
                    <td className="py-4 px-5 text-[#435447] max-w-md leading-relaxed">
                      {a.description}
                    </td>
                    <td className="py-4 px-5 text-[#6E7F72] whitespace-nowrap font-mono">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-4 px-5 font-semibold text-[#18261C] whitespace-nowrap">
                      {a.status}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => toggleAcknowledge(a.id)}
                        className="px-3 py-1 rounded-md text-xs font-semibold border border-[#DFE5DC] bg-white hover:bg-[#F6F8F5] text-[#18261C] transition-colors"
                      >
                        {a.status === 'Acknowledged' ? 'Reset' : 'Acknowledge'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

