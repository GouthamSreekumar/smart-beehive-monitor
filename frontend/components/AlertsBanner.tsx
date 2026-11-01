'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, WifiOff } from 'lucide-react';
import { SensorReading, AlertThresholds } from '../lib/types';

interface AlertsBannerProps {
  latestReading: SensorReading | null;
  thresholds: AlertThresholds;
  isStale: boolean;
  isOffline: boolean;
  secondsSinceLastReading: number | null;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({
  latestReading,
  thresholds,
  isStale,
  isOffline,
  secondsSinceLastReading,
}) => {
  if (!latestReading) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center space-x-3 text-amber-800">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
        <div className="text-sm">
          <span className="font-semibold">Awaiting Telemetry:</span> No sensor data has been ingested yet.
          Ensure the ESP32 is powered on and transmitting to this backend. You can also click <b>Demo Ingest</b> above to test.
        </div>
      </div>
    );
  }

  const alerts: {
    id: string;
    level: 'warning' | 'critical';
    title: string;
    desc: string;
  }[] = [];

  // Connectivity alerts
  if (isOffline) {
    alerts.push({
      id: 'offline',
      level: 'critical',
      title: 'Device Offline',
      desc: `No telemetry received for ${Math.round(secondsSinceLastReading || 0)}s (>120s limit). Displayed readings are cached historical data.`,
    });
  } else if (isStale) {
    alerts.push({
      id: 'stale',
      level: 'warning',
      title: 'Stale Sensor Telemetry',
      desc: `Last reading was received ${Math.round(secondsSinceLastReading || 0)}s ago (>30s expected interval). Device may be experiencing Wi-Fi lag.`,
    });
  }

  // Temperature alerts
  if (latestReading.temperature_c > thresholds.maxTemp) {
    alerts.push({
      id: 'temp-high',
      level: latestReading.temperature_c > thresholds.maxTemp + 2 ? 'critical' : 'warning',
      title: 'High Hive Temperature',
      desc: `Brood temperature is ${latestReading.temperature_c}°C (exceeds threshold ${thresholds.maxTemp}°C). Risk of overheating or wax collapse.`,
    });
  } else if (latestReading.temperature_c < thresholds.minTemp) {
    alerts.push({
      id: 'temp-low',
      level: latestReading.temperature_c < thresholds.minTemp - 2 ? 'critical' : 'warning',
      title: 'Low Hive Temperature',
      desc: `Brood temperature is ${latestReading.temperature_c}°C (below threshold ${thresholds.minTemp}°C). Risk of chilled brood.`,
    });
  }

  // Humidity alerts
  if (latestReading.humidity_pct > thresholds.maxHumidity) {
    alerts.push({
      id: 'hum-high',
      level: 'warning',
      title: 'High Relative Humidity',
      desc: `Hive humidity is ${latestReading.humidity_pct}% (exceeds threshold ${thresholds.maxHumidity}%). Excess moisture can promote mold and chalkbrood.`,
    });
  } else if (latestReading.humidity_pct < thresholds.minHumidity) {
    alerts.push({
      id: 'hum-low',
      level: 'warning',
      title: 'Low Relative Humidity',
      desc: `Hive humidity is ${latestReading.humidity_pct}% (below threshold ${thresholds.minHumidity}%). Dry conditions can dehydrate larvae.`,
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-emerald-900 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">All Hive Conditions Optimal</h4>
            <p className="text-xs text-emerald-700">
              Temperature ({latestReading.temperature_c}°C) and humidity ({latestReading.humidity_pct}%) are safely within configured brood nest limits.
            </p>
          </div>
        </div>
        <span className="hidden md:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
          Normal State
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-xl p-4 border flex items-start space-x-3 shadow-sm ${
            alert.level === 'critical'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          {alert.level === 'critical' ? (
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold">{alert.title}</h4>
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  alert.level === 'critical'
                    ? 'bg-rose-200 text-rose-800'
                    : 'bg-amber-200 text-amber-800'
                }`}
              >
                {alert.level}
              </span>
            </div>
            <p className="text-xs mt-0.5 text-slate-700">{alert.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

